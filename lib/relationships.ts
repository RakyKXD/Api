import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'
import { getUser, mutate, readDatabase, type Database } from '@/lib/discord-store'

/**
 * Solicitudes de amistad compatibles con fosscord/Spacebar.
 *
 * Referencia: fosscord-server-main/src/api/routes/users/@me/relationships.ts
 * El cliente (web.d4c7976eccf337f1.js) espera:
 *   POST   /users/@me/relationships          {username, discriminator, note}   -> 204
 *   PUT    /users/@me/relationships/:id      {type, note, confirm_stranger_request} -> 204
 *   PATCH  /users/@me/relationships/:id      {nickname}                        -> 204
 *   DELETE /users/@me/relationships/:id                                       -> 204
 *   GET    /users/@me/relationships          -> [{id, type, user, nickname, since, note, user_ignored, ...}]
 * Los cambios se propagan por el gateway con RELATIONSHIP_ADD / UPDATE / REMOVE
 * y PRESENCE_UPDATE, que son los eventos que refrescan la pestaña de Amistades.
 */

export const RELATIONSHIP_TYPE = {
  NONE: 0,
  FRIEND: 1,
  BLOCKED: 2,
  INCOMING_REQUEST: 3,
  OUTGOING_REQUEST: 4,
  IMPLICIT: 5,
  SUGGESTION: 6,
} as const

export const MAX_FRIEND_REQUEST_NOTE = 120

// "Allow friend requests from" (Privacy settings) -> fosscord FRIEND_SOURCE_*
const FRIEND_SOURCE_MUTUAL_FRIENDS = 2
const FRIEND_SOURCE_MUTUAL_GUILDS = 4
const FRIEND_SOURCE_EVERYONE = 8
const FRIEND_SOURCE_ALL = 14

type RelRow = Record<string, unknown>
type GatewayEvent = { t: string; d: unknown; user?: string | null }

export type RelationshipOutcome = { status: number; body?: unknown; events?: GatewayEvent[] }

const noteDetail = () => ({
  code: 'BASE_TYPE_MAX_LENGTH',
  message: `Must be ${MAX_FRIEND_REQUEST_NOTE} or fewer in length.`,
})

/**
 * El cliente comprueba `e?.body?.note != null` para decidir si el fallo fue por
 * longitud, así que hay que devolver `note` tanto en la raíz como en `errors`.
 */
function noteTooLong(): RelationshipOutcome {
  return {
    status: 400,
    body: {
      code: 50035,
      message: 'Invalid Form Body',
      note: { _errors: [noteDetail()] },
      errors: { note: { _errors: [noteDetail()] } },
    },
  }
}

export function sanitizeRelationshipNote(value: unknown): { note: string; invalid: boolean } {
  if (value === undefined || value === null || value === '') return { note: '', invalid: false }
  if (typeof value !== 'string') return { note: '', invalid: false }
  const cleaned = value.replace(/\r?\n/g, ' ').trim()
  if (cleaned.length > MAX_FRIEND_REQUEST_NOTE) return { note: '', invalid: true }
  return { note: cleaned, invalid: false }
}

/** Busca por username#discriminator (fosscord: `padStart(4, "0")`) o, sin discriminator, por username sin distinguir mayúsculas. */
export async function findUserByTag(username: string, discriminator: unknown): Promise<Record<string, unknown> | null> {
  const wanted = String(username ?? '').trim()
  if (!wanted) return null
  const database = await readDatabase()

  const candidates = new Map<string, Record<string, unknown>>()
  for (const user of database.users ?? []) {
    if (user && user.id) candidates.set(String(user.id), user)
  }
  for (const guild of database.guilds) {
    for (const member of (guild.members as Array<Record<string, unknown>>) ?? []) {
      const memberUser = member?.user as Record<string, unknown> | undefined
      if (memberUser?.id && !candidates.has(String(memberUser.id))) candidates.set(String(memberUser.id), memberUser)
    }
  }

  const rawDisc = Number(discriminator)
  const hasDisc = discriminator !== undefined && discriminator !== null && discriminator !== '' && Number.isFinite(rawDisc) && rawDisc !== 0
  const padded = hasDisc ? String(rawDisc).padStart(4, '0') : null
  const lower = wanted.toLowerCase()

  for (const user of candidates.values()) {
    if (String(user.username ?? '').toLowerCase() !== lower) continue
    if (padded && String(user.discriminator ?? '0').padStart(4, '0') !== padded) continue
    return user
  }
  return null
}

function rowOf(rows: RelRow[], owner: string, other: string): RelRow | undefined {
  return rows.find((row) => String(row.id) === other && (String(row.user_id) === owner || !row.user_id))
}

function publicRelationship(row: RelRow, user: Record<string, unknown> | null) {
  const stranger = Boolean(row.stranger_request)
  return {
    id: String(row.id),
    type: Number(row.type ?? 0),
    nickname: (row.nickname as string) ?? null,
    user: user ?? undefined,
    user_ignored: Boolean(row.user_ignored),
    since: (row.since as string) ?? new Date().toISOString(),
    note: typeof row.note === 'string' && row.note ? row.note : undefined,
    stranger_request: stranger,
    is_stranger_request: stranger,
    is_spam_request: Boolean(row.is_spam_request),
    origin_application_id: (row.origin_application_id as string) ?? null,
  }
}

function sharedGuildIds(database: Database, a: string, b: string): string[] {
  const shared: string[] = []
  for (const guild of database.guilds) {
    const members = (guild.members as Array<Record<string, unknown>>) ?? []
    const inA = members.some((m) => String((m.user as Record<string, unknown> | undefined)?.id ?? '') === a)
    const inB = members.some((m) => String((m.user as Record<string, unknown> | undefined)?.id ?? '') === b)
    if (inA && inB) shared.push(String(guild.id))
  }
  return shared
}

/** Respeta el ajuste de privacidad "Allow friend requests from" del destino. */
function acceptsFriendRequestFrom(database: Database, targetId: string, shared: string[], mutualFriends: string[]): boolean {
  const settings = (database.user_settings ?? []).find((s) => String(s.user_id) === targetId)
  const raw = settings?.friend_source_flags

  let flags = FRIEND_SOURCE_ALL
  if (typeof raw === 'number') {
    flags = raw
  } else if (raw && typeof raw === 'object') {
    const source = raw as Record<string, unknown>
    if (source.all === undefined && source.mutual_guilds === undefined && source.mutual_friends === undefined) {
      flags = FRIEND_SOURCE_ALL
    } else {
      flags = 0
      if (source.all === true) flags |= FRIEND_SOURCE_EVERYONE
      if (source.mutual_guilds === true) flags |= FRIEND_SOURCE_MUTUAL_GUILDS
      if (source.mutual_friends === true) flags |= FRIEND_SOURCE_MUTUAL_FRIENDS
    }
  }

  if (flags & FRIEND_SOURCE_EVERYONE) return true
  if (flags & FRIEND_SOURCE_MUTUAL_GUILDS && shared.length > 0) return true
  if (flags & FRIEND_SOURCE_MUTUAL_FRIENDS && mutualFriends.length > 0) return true
  return false
}

function hideFriendRequestNotes(database: Database, targetId: string): boolean {
  const settings = (database.user_settings ?? []).find((s) => String(s.user_id) === targetId)
  return settings?.hide_friend_request_notes === true
}

/**
 * Crea o acepta una solicitud. Postel (fosscord `updateRelationship`):
 *  - el emisor queda con type 4 (OUTGOING) y el receptor con type 3 (INCOMING);
 *  - si el receptor ya tenía una solicitud hacia el emisor, ambos pasan a 1 (FRIEND);
 *  - la nota viaja en las dos filas (se oculta si el receptor pidió no mostrarla).
 */
export async function applyRelationshipChange(
  currentUserId: string,
  targetUserId: string,
  input: Record<string, unknown>,
): Promise<RelationshipOutcome> {
  const me = String(currentUserId)
  const target = String(targetUserId)
  if (!target || target === me) {
    return { status: 400, body: { code: 80003, message: 'Cannot send friend request to self' } }
  }

  const { note, invalid } = sanitizeRelationshipNote(input.note)
  if (invalid) return noteTooLong()

  const requestedType =
    typeof input.type === 'number' && Number.isFinite(input.type) ? Number(input.type) : RELATIONSHIP_TYPE.FRIEND
  const meUser = await getUser(me)
  const targetUser = await getUser(target)

  const outcome = await mutate((database) => {
    database.relationships ??= []
    const rows = database.relationships as RelRow[]
    const nowIso = new Date().toISOString()
    const events: GatewayEvent[] = []

    let mine = rowOf(rows, me, target)
    let theirs = rowOf(rows, target, me)
    const myType = mine ? Number(mine.type ?? 0) : RELATIONSHIP_TYPE.NONE
    const theirType = theirs ? Number(theirs.type ?? 0) : RELATIONSHIP_TYPE.NONE

    // ---- Bloquear ---------------------------------------------------------
    if (requestedType === RELATIONSHIP_TYPE.BLOCKED) {
      if (!mine) {
        mine = { id: target, user_id: me, type: RELATIONSHIP_TYPE.BLOCKED, nickname: null, user_ignored: false, since: nowIso, note: null }
        rows.push(mine)
      } else {
        mine.type = RELATIONSHIP_TYPE.BLOCKED
        mine.note = null
        mine.since = nowIso
      }
      if (theirs && theirType !== RELATIONSHIP_TYPE.BLOCKED) {
        rows.splice(rows.indexOf(theirs), 1)
        events.push({ t: 'RELATIONSHIP_REMOVE', d: publicRelationship(theirs, meUser), user: target })
      }
      events.push({ t: 'RELATIONSHIP_ADD', d: { ...publicRelationship(mine, targetUser), should_notify: false }, user: me })
      return { status: 204, events }
    }

    // ---- Errores de estado ------------------------------------------------
    const accepting = theirType === RELATIONSHIP_TYPE.OUTGOING_REQUEST
    const settled = theirType === RELATIONSHIP_TYPE.BLOCKED || theirType === RELATIONSHIP_TYPE.FRIEND
    if (settled) {
      return {
        status: 400,
        body:
          theirType === RELATIONSHIP_TYPE.BLOCKED
            ? { code: 80001, message: 'Friend request blocked' }
            : { code: 80007, message: 'You are already friends with this user' },
        events,
      }
    }
    if (myType === RELATIONSHIP_TYPE.FRIEND) {
      return { status: 400, body: { code: 80007, message: 'You are already friends with this user' }, events }
    }
    if (myType === RELATIONSHIP_TYPE.OUTGOING_REQUEST) {
      return { status: 400, body: { code: 40007, message: 'You already sent a friend request' }, events }
    }
    if (myType === RELATIONSHIP_TYPE.BLOCKED) {
      return { status: 400, body: { code: 40007, message: 'Unblock the user before sending a friend request' }, events }
    }

    const shared = sharedGuildIds(database, me, target)
    const mutualFriends = (database.relationships ?? [])
      .filter(
        (row) =>
          String(row.user_id) === me &&
          Number(row.type ?? 0) === RELATIONSHIP_TYPE.FRIEND &&
          (database.relationships ?? []).some(
            (other) =>
              String(other.user_id) === target &&
              String(other.id) === String(row.id) &&
              Number(other.type ?? 0) === RELATIONSHIP_TYPE.FRIEND,
          ),
      )
      .map((row) => String(row.id))

    // Aceptar una solicitud recibida siempre está permitido; crear una nueva
    // tiene que pasar por la privacidad del receptor (fosscord).
    if (!accepting && !acceptsFriendRequestFrom(database, target, shared, mutualFriends)) {
      return { status: 400, body: { code: 80000, message: 'Incoming friend requests disabled.' }, events }
    }

    const stranger = shared.length === 0
    const theirNote = hideFriendRequestNotes(database, target) ? '' : note

    if (!mine) {
      mine = { id: target, user_id: me, type: RELATIONSHIP_TYPE.NONE, nickname: null, user_ignored: false, since: nowIso }
      rows.push(mine)
    }
    if (!theirs) {
      theirs = { id: me, user_id: target, type: RELATIONSHIP_TYPE.NONE, nickname: null, user_ignored: false, since: nowIso }
      rows.push(theirs)
    }

    const willAccept = accepting || myType === RELATIONSHIP_TYPE.INCOMING_REQUEST
    if (willAccept) {
      // Al aceptar la nota del solicitante se conserva: el cliente la muestra
      // en el MD ("también aparecerá en tu MD si se hacen amigos").
      mine.type = RELATIONSHIP_TYPE.FRIEND
      if (mine.note == null) mine.note = null
      mine.since = nowIso
      theirs.type = RELATIONSHIP_TYPE.FRIEND
      if (theirs.note == null) theirs.note = null
      theirs.since = nowIso
    } else {
      mine.type = RELATIONSHIP_TYPE.OUTGOING_REQUEST
      mine.note = note || null
      mine.since = nowIso
      mine.stranger_request = stranger
      theirs.type = RELATIONSHIP_TYPE.INCOMING_REQUEST
      theirs.note = theirNote || null
      theirs.since = nowIso
      theirs.stranger_request = stranger
    }

    events.push({ t: 'RELATIONSHIP_ADD', d: { ...publicRelationship(mine, targetUser), should_notify: false }, user: me })
    events.push({ t: 'RELATIONSHIP_ADD', d: { ...publicRelationship(theirs, meUser), should_notify: true }, user: target })
    if (willAccept) {
      events.push({ t: 'PRESENCE_UPDATE', d: { user: targetUser, status: 'online', activities: [], client_status: { desktop: 'online' } }, user: me })
      events.push({ t: 'PRESENCE_UPDATE', d: { user: meUser, status: 'online', activities: [], client_status: { desktop: 'online' } }, user: target })
    }

    return { status: 204, events }
  })

  await flushEvents(outcome.events)
  return { status: outcome.status, body: outcome.body }
}

/** POST /users/@me/relationships  {username, discriminator, note} */
export async function sendFriendRequest(currentUserId: string, input: Record<string, unknown>): Promise<RelationshipOutcome> {
  const username = String(input.username ?? '').trim()
  if (!username) {
    return {
      status: 400,
      body: {
        code: 50035,
        message: 'Invalid Form Body',
        errors: { username: { _errors: [{ code: 'BASE_TYPE_REQUIRED', message: 'This field is required' }] } },
      },
    }
  }

  const found = await findUserByTag(username, input.discriminator)
  if (!found) return { status: 400, body: { code: 80004, message: 'No users with DiscordTag exist' } }

  const targetId = String(found.id)
  if (targetId === String(currentUserId)) {
    return { status: 400, body: { code: 80003, message: 'Cannot send friend request to self' } }
  }
  return applyRelationshipChange(currentUserId, targetId, input)
}

/** DELETE /users/@me/relationships/:id — borra las dos filas y avisa a ambos lados. */
export async function removeRelationship(currentUserId: string, targetUserId: string): Promise<RelationshipOutcome> {
  const me = String(currentUserId)
  const target = String(targetUserId)
  if (!target || target === me) {
    return { status: 400, body: { code: 40007, message: "You can't remove yourself as a friend" } }
  }

  const meUser = await getUser(me)
  const targetUser = await getUser(target)

  const outcome = await mutate((database) => {
    database.relationships ??= []
    const rows = database.relationships as RelRow[]
    const mine = rowOf(rows, me, target)
    const theirs = rowOf(rows, target, me)
    const events: GatewayEvent[] = []
    if (mine) {
      rows.splice(rows.indexOf(mine), 1)
      events.push({ t: 'RELATIONSHIP_REMOVE', d: publicRelationship(mine, targetUser), user: me })
    }
    if (theirs) {
      rows.splice(rows.indexOf(theirs), 1)
      events.push({ t: 'RELATIONSHIP_REMOVE', d: publicRelationship(theirs, meUser), user: target })
    }
    return { status: 204, events }
  })

  await flushEvents(outcome.events)
  return { status: 204 }
}

/** PATCH /users/@me/relationships/:id  {nickname} */
export async function setRelationshipNickname(
  currentUserId: string,
  targetUserId: string,
  nickname: unknown,
): Promise<RelationshipOutcome> {
  const me = String(currentUserId)
  const target = String(targetUserId)
  const value = typeof nickname === 'string' && nickname.trim() ? nickname : null

  const targetUser = await getUser(target)
  const outcome = await mutate((database) => {
    database.relationships ??= []
    const rows = database.relationships as RelRow[]
    const mine = rowOf(rows, me, target)
    if (!mine) return { status: 404, body: { code: 10013, message: 'Unknown Relationship' }, events: [] as GatewayEvent[] }
    mine.nickname = value
    return {
      status: 204,
      events: [{ t: 'RELATIONSHIP_UPDATE', d: publicRelationship(mine, targetUser), user: me }] as GatewayEvent[],
    }
  })

  await flushEvents(outcome.events)
  return { status: outcome.status, body: outcome.body }
}

/** PUT/DELETE /users/@me/relationships/:id/ignore */
export async function setRelationshipIgnored(
  currentUserId: string,
  targetUserId: string,
  ignored: boolean,
): Promise<RelationshipOutcome> {
  const me = String(currentUserId)
  const target = String(targetUserId)
  if (!target || target === me) return { status: 400, body: { code: 80003, message: "You can't ignore yourself" } }

  const targetUser = await getUser(target)
  const outcome = await mutate((database): RelationshipOutcome => {
    database.relationships ??= []
    const rows = database.relationships as RelRow[]
    let mine = rowOf(rows, me, target)
    if (!mine) {
      if (!ignored) return { status: 204, events: [] as GatewayEvent[] }
      mine = {
        id: target,
        user_id: me,
        type: RELATIONSHIP_TYPE.NONE,
        nickname: null,
        user_ignored: true,
        since: new Date().toISOString(),
      }
      rows.push(mine)
      return {
        status: 204,
        events: [{ t: 'RELATIONSHIP_ADD', d: { ...publicRelationship(mine, targetUser), should_notify: false }, user: me }] as GatewayEvent[],
      }
    }
    mine.user_ignored = ignored
    if (!ignored && Number(mine.type ?? 0) === RELATIONSHIP_TYPE.NONE) {
      rows.splice(rows.indexOf(mine), 1)
      return {
        status: 204,
        events: [{ t: 'RELATIONSHIP_REMOVE', d: publicRelationship(mine, targetUser), user: me }] as GatewayEvent[],
      }
    }
    return {
      status: 204,
      events: [{ t: 'RELATIONSHIP_UPDATE', d: publicRelationship(mine, targetUser), user: me }] as GatewayEvent[],
    }
  })

  await flushEvents(outcome.events)
  return { status: outcome.status, body: outcome.body }
}

/** DELETE /users/@me/relationships?relationship_type=3 — "limpiar solicitudes pendientes". */
export async function clearPendingRelationships(currentUserId: string, relationshipType?: number): Promise<RelationshipOutcome> {
  const me = String(currentUserId)
  const wanted = typeof relationshipType === 'number' && Number.isFinite(relationshipType) ? relationshipType : RELATIONSHIP_TYPE.INCOMING_REQUEST
  const meUser = await getUser(me)

  const outcome = await mutate((database) => {
    database.relationships ??= []
    const rows = database.relationships as RelRow[]
    const events: GatewayEvent[] = []
    const doomed = rows.filter((row) => String(row.user_id) === me && Number(row.type ?? 0) === wanted)
    for (const row of doomed) {
      rows.splice(rows.indexOf(row), 1)
      events.push({ t: 'RELATIONSHIP_REMOVE', d: publicRelationship(row, meUser), user: me })
      const mirrorId = String(row.id)
      const mirror = rows.find((other) => String(other.user_id) === mirrorId && String(other.id) === me)
      if (mirror) {
        rows.splice(rows.indexOf(mirror), 1)
        events.push({ t: 'RELATIONSHIP_REMOVE', d: publicRelationship(mirror, meUser), user: mirrorId })
      }
    }
    return { status: 204, events }
  })

  await flushEvents(outcome.events)
  return { status: 204 }
}

async function flushEvents(events?: GatewayEvent[]) {
  if (!events?.length) return
  for (const event of events) {
    await broadcastGatewayEvent(event.t, event.d, event.user)
  }
}

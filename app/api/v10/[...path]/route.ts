import { NextRequest, NextResponse } from 'next/server'
import {
  createCollectionItem,
  deleteCollectionItem,
  getGuild,
  getUser,
  listCollection,
  listGuilds,
  updateCollectionItem,
  crosspostMessage,
  listPinnedMessages,
  pinMessage,
  unpinMessage,
  addMessageRecipient,
  removeMessageRecipient,
  updateGuild,
  listUserGuilds,
  getGuildResource,
  addGuildResource,
  removeGuildResource,
  getSafetyHub,
  requestSafetyReview,
  updateUser,
} from '@/lib/discord-store'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ path: string[] }> }
type Item = Record<string, unknown>

const id = () => `${Date.now()}${Math.floor(Math.random() * 10000)}`
const now = () => new Date().toISOString()
const json = (body: unknown, status = 200, headers?: HeadersInit) => NextResponse.json(body, { status, headers })
const error = (code: number, message: string, status: number) => json({ code, message }, status)

function collectionFor(resource: string): keyof Omit<import('@/lib/discord-store').Database, 'guilds'> | null {
  const map: Record<string, keyof Omit<import('@/lib/discord-store').Database, 'guilds'>> = {
    users: 'users', invites: 'invites', webhooks: 'webhooks', audit: 'audit_logs', applications: 'applications', sessions: 'sessions',
    connections: 'connections', experiments: 'experiments', relationships: 'relationships', 'payment-sources': 'payment_sources',
  }
  return map[resource] ?? null
}

async function bodyOf(request: NextRequest): Promise<Item> {
  try { return await request.json() as Item } catch { return {} }
}

const guildResourceNames = new Set(['bans', 'stickers', 'scheduled-events', 'automod-rules', 'voice-states', 'onboarding'])
const guildResource = (name: string) => name === 'automod' ? 'automod-rules' : name
const validLimit = (value: string | null) => Math.min(Math.max(Number(value ?? 50) || 50, 1), 100)

async function guildArray(guildId: string, name: string) {
  const guild = await getGuild(guildId)
  if (!guild) return null
  return Array.isArray(guild[guildResource(name)]) ? guild[guildResource(name)] as Item[] : []
}

async function saveGuildArray(guildId: string, name: string, values: Item[]) {
  return updateGuild(guildId, { [guildResource(name)]: values })
}

function validationError(message: string) { return error(50035, message, 400) }
function validateAuthorization(request: NextRequest) {
  const value = request.headers.get('authorization')
  if (value && !/^(Bearer|Bot)\s+\S+$/i.test(value)) return error(40001, 'Invalid Authorization header', 401)
  return null
}

export async function GET(request: NextRequest, { params }: Params) {
  const authError = validateAuthorization(request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId, action] = path
  const query = request.nextUrl.searchParams
  const currentUser = '900000000000000001'

  // Batch 1: persistent guild/channel/message/relationship/application reads.
  if (resource === 'channels' && resourceId && subresource === 'messages') {
    const guilds = await listGuilds()
    const guild = guilds.find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) return error(10003, 'Unknown Channel', 404)
    const messages = (await import('@/lib/discord-store')).listMessages(guild.id, resourceId)
    const values = (await messages) ?? []
    if (subId) return json(values.find((item) => item.id === subId) ?? error(10008, 'Unknown Message', 404))
    const before = query.get('before'); const after = query.get('after')
    return json(values.filter((item) => (!before || item.id < before) && (!after || item.id > after)).slice(0, validLimit(query.get('limit'))))
  }
  if (resource === 'guilds' && resourceId && subresource === 'channels' && !subId) {
    const channels = await (await import('@/lib/discord-store')).listChannels(resourceId)
    return channels ? json(channels) : error(10004, 'Unknown Guild', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships') return json(await listCollection('relationships'))
  if (resource === 'applications' && resourceId && subresource === 'commands') return json((await listCollection('application_commands')).filter((item) => item.application_id === resourceId))

  if (resource === 'users' && resourceId === '@me' && subresource === 'settings') {
    const settings = (await listCollection('user_settings'))[0] ?? { locale: 'en-US', theme: 'dark', status: 'online', afk_timeout: 600, animate_emoji: true, render_embeds: true, render_reactions: true, guild_folders: [] }
    return json(settings)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'consent') return json((await listCollection('user_consents'))[0] ?? { personalization: { consented: false }, usage_statistics: { consented: false } })
  if (resource === 'users' && resourceId === '@me' && subresource === 'email-settings') return json((await listCollection('email_settings'))[0] ?? { initialized: true, categories: {} })
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings') return json((await listCollection('notification_settings'))[0] ?? { flags: 0 })
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections') return json(await listCollection('connections'))
  if (resource === 'users' && resourceId === '@me' && subresource === 'billing') return json({ country_code: 'US', subdivision_code: null })
  if (resource === 'voice' && resourceId === 'regions') return json([{ id: 'us-west', name: 'US West', optimal: true, deprecated: false, custom: false }, { id: 'us-east', name: 'US East', optimal: false, deprecated: false, custom: false }])
  if (resource === 'guilds' && resourceId && subresource === 'regions') return json([{ id: 'us-west', name: 'US West', optimal: true, deprecated: false, custom: false }])
  if (resource === 'billing' && resourceId === 'popup-bridge') return json({ state: crypto.randomUUID() })
  if (resource === 'channels' && resourceId && subresource === 'pins') {
    const pinned = await listPinnedMessages('', resourceId)
    return pinned ? json(pinned) : error(10003, 'Unknown Channel', 404)
  }
  if (!resource) return json({ message: 'Discord-compatible API', version: 10 })
  if (resource === 'safety-hub' && resourceId === '@me') return json(await getSafetyHub('900000000000000001'))
  if (resource === 'safety-hub' && resourceId === 'suspended') return error(10013, 'Suspended user token required', 401)
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds') return json(await listUserGuilds('900000000000000001'))
  if (resource === 'users' && resourceId === '@me') {
    return json(await getUser('900000000000000001'))
  }
  if (resource === 'users' && resourceId) {
    const user = await getUser(resourceId)
    return user ? json(user) : error(10013, 'Unknown User', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds') return json(await listUserGuilds('900000000000000001'))
  if (resource === 'guilds' && resourceId && guildResourceNames.has(subresource ?? '') ) {
    const values = await guildArray(resourceId, subresource as string)
    if (!values) return error(10004, 'Unknown Guild', 404)
    if (subId) return json(values.find((item) => item.id === subId) ?? { id: subId, guild_id: resourceId, name: subId })
    return json(values.slice(0, validLimit(query.get('limit'))))
  }
  if (resource === 'guilds' && !resourceId) return json(await listGuilds())
  if (resource === 'guilds' && resourceId) {
    const guild = await getGuild(resourceId)
    if (!guild) return error(10004, 'Unknown Guild', 404)
    if (!subresource) return json(guild)
    const values = (guild[subresource] as unknown[] | undefined) ?? []
    if (subId) {
      const found = values.find((value) => (value as Item).id === subId)
      return found ? json(found) : error(10011, `Unknown ${subresource}`, 404)
    }
    return json(values)
  }
  if (resource === 'gateway' || (resource === 'gateway' && resourceId === 'bot')) return json({ url: '/api/v10/gateway', shards: 1, session_start_limit: { total: 1000, remaining: 1000, reset_after: 86400000, max_concurrency: 1 } })
  const collection = collectionFor(resource)
  if (collection) {
    const items = await listCollection(collection)
    if (!resourceId) {
      const after = query.get('after')
      const before = query.get('before')
      const limit = Math.min(Math.max(Number(query.get('limit') ?? 50) || 50, 1), 100)
      let paged = items
      if (after) paged = paged.filter((item) => String(item.id) > after)
      if (before) paged = paged.filter((item) => String(item.id) < before)
      return json(paged.slice(0, limit))
    }
    const found = items.find((value) => value.id === resourceId)
    return found ? json(found) : error(10013, `Unknown ${resource}`, 404)
  }
  if (resource === 'oauth2') return json({ id: '900000000000000001', name: 'API Application', scopes: query.getAll('scope') })
  return json([])
}

export async function POST(request: NextRequest, { params }: Params) {
  const authError = validateAuthorization(request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId, action] = path
  const input = await bodyOf(request)
  if (resource === 'channels' && resourceId && subresource === 'messages') {
    const guild = (await listGuilds()).find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) return error(10003, 'Unknown Channel', 404)
    if (subId && action === 'crosspost') return json((await crosspostMessage(guild.id, resourceId, subId)) ?? error(10008, 'Unknown Message', 404))
    if (subId) return json((await (await import('@/lib/discord-store')).updateMessage(guild.id, resourceId, subId, input)) ?? error(10008, 'Unknown Message', 404))
    if (typeof input.content !== 'string' || input.content.length > 2000) return validationError('content must be a string of 2000 characters or fewer')
    return json((await (await import('@/lib/discord-store')).createMessage(guild.id, resourceId, input.content)) ?? error(10003, 'Unknown Channel', 404), 201)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships') {
    if (typeof input.id !== 'string' || typeof input.type !== 'number') return validationError('id and type are required')
    return json(await createCollectionItem('relationships', { ...input, user_id: '900000000000000001' }), 201)
  }
  if (resource === 'applications' && resourceId && subresource === 'commands') {
    if (typeof input.name !== 'string' || !input.name) return validationError('name is required')
    return json(await createCollectionItem('application_commands', { ...input, application_id: resourceId, type: input.type ?? 1 }), 201)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'consent') {
    const current = (await listCollection('user_consents'))[0] ?? {}
    const next = { ...current }
    for (const key of Array.isArray(input.grant) ? input.grant : []) next[String(key)] = { consented: true }
    for (const key of Array.isArray(input.revoke) ? input.revoke : []) next[String(key)] = { consented: false }
    return json((await createCollectionItem('user_consents', next)))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'billing') return json({ id: id(), ...input, created_at: now() }, 201)
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections') return json(await createCollectionItem('connections', input), 201)
  if (resource === 'voice' && resourceId === 'public-keys') return new NextResponse(null, { status: 204 })
  if (resource === 'channels' && resourceId && (subresource === 'voice-channel-effects' || subresource === 'custom-call-sounds')) return new NextResponse(null, { status: 204 })
  if (resource === 'users' && resourceId === '@me' && subresource === 'settings') return json(await createCollectionItem('user_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'email-settings') return json(await createCollectionItem('email_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings') return json(await createCollectionItem('notification_settings', input))
  if (resource === 'safety-hub' && resourceId === 'suspended' && subresource === '@me') {
    if (typeof input.token !== 'string' || !input.token) return error(50035, 'token is required', 400)
    return json(await getSafetyHub('900000000000000001'))
  }
  if (resource === 'safety-hub' && resourceId === 'suspended' && subresource === 'check-verification') {
    if (typeof input.token !== 'string' || !input.token) return error(50035, 'token is required', 400)
    return json({ success: false })
  }
  if (resource === 'safety-hub' && resourceId === 'suspended' && subresource === 'request-verification') {
    if (typeof input.token !== 'string' || !input.token) return error(50035, 'token is required', 400)
    return json({
      verification_request_id: crypto.randomUUID(),
      verification_vendor_name: 'K_ID',
      verification_webview_url: 'https://verify.discord.com/age-verification',
    })
  }
  if (resource === 'guilds' && resourceId && guildResourceNames.has(subresource ?? '')) {
    const values = await guildArray(resourceId, subresource as string)
    if (!values) return error(10004, 'Unknown Guild', 404)
    if ((subresource === 'bans' && !input.user_id) || (subresource === 'stickers' && !input.name)) return validationError('Required fields are missing')
    const item = { id: String(input.user_id ?? id()), guild_id: resourceId, ...input, created_at: now() }
    await saveGuildArray(resourceId, subresource as string, [...values.filter((value) => value.id !== item.id), item])
    return json(item, 201)
  }
  if (resource === 'guilds' && resourceId && subresource) {
    const guild = await getGuild(resourceId)
    if (!guild) return error(10004, 'Unknown Guild', 404)
    const item = { id: String(input.id ?? id()), ...input, created_at: now() }
    const values = (guild[subresource] as unknown[] | undefined) ?? []
    values.push(item)
    const { updateGuild } = await import('@/lib/discord-store')
    await updateGuild(resourceId, { [subresource]: values })
    return json(item, 201)
  }
  if (resource === 'messages' || subresource === 'messages') return json({ id: id(), ...input, timestamp: now(), type: 0 }, 201)
  const collection = collectionFor(resource)
  if (collection) return json(await createCollectionItem(collection, input), 201)
  if (resource === 'interactions' || resource === 'webhooks') return json({ id: id(), ...input, created_at: now() }, 201)
  return json({ id: id(), ...input }, 201)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authError = validateAuthorization(request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId] = path
  const input = await bodyOf(request)
  if (resource === 'applications' && resourceId && subresource === 'commands' && subId) {
    const updated = await updateCollectionItem('application_commands', subId, { ...input, application_id: resourceId })
    return updated ? json(updated) : error(10063, 'Unknown Application Command', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships' && subId) {
    const updated = await updateCollectionItem('relationships', subId, input)
    return updated ? json(updated) : error(10013, 'Unknown Relationship', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'settings') return json(await createCollectionItem('user_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'email-settings') return json(await createCollectionItem('email_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings') return json(await createCollectionItem('notification_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections' && subId) return json(await updateCollectionItem('connections', subId, input))
  if (resource === 'guilds' && resourceId && subresource === 'voice-states') return new NextResponse(null, { status: 204 })
  if (resource === 'safety-hub' && resourceId === 'request-review' && subresource) {
    const signal = Number(input.signal)
    if (![0, 1, 2, 3].includes(signal) || typeof input.user_input !== 'string' || input.user_input.length > 1000) return validationError('Invalid appeal payload')
    return json(await requestSafetyReview('900000000000000001', subresource, { signal, user_input: input.user_input }))
  }
  if (resource === 'safety-hub' && resourceId === 'suspended' && subresource === 'request-review' && subId) {
    const signal = Number(input.signal)
    if (typeof input.token !== 'string' || !input.token || ![0, 1, 2, 3].includes(signal) || typeof input.user_input !== 'string' || input.user_input.length > 1000) return validationError('Invalid appeal payload')
    return json(await requestSafetyReview('900000000000000001', subId, { signal, user_input: input.user_input }))
  }
  if (resource === 'guilds' && resourceId && guildResourceNames.has(subresource ?? '') && subId) {
    const values = await guildArray(resourceId, subresource as string)
    if (!values) return error(10004, 'Unknown Guild', 404)
    const index = values.findIndex((value) => value.id === subId)
    if (index < 0) return error(10011, 'Unknown Resource', 404)
    values[index] = { ...values[index], ...input, id: subId, guild_id: resourceId }
    await saveGuildArray(resourceId, subresource as string, values)
    return json(values[index])
  }
  if (resource === 'guilds' && resourceId && subresource && subId) {
    const guild = await getGuild(resourceId)
    if (!guild) return error(10004, 'Unknown Guild', 404)
    const values = (guild[subresource] as Item[] | undefined) ?? []
    const index = values.findIndex((value) => value.id === subId)
    if (index < 0) return error(10011, 'Unknown resource', 404)
    values[index] = { ...values[index], ...input, id: subId }
    const { updateGuild } = await import('@/lib/discord-store')
    await updateGuild(resourceId, { [subresource]: values })
    return json(values[index])
  }
  const collection = collectionFor(resource)
  if (collection && resourceId) {
    const updated = await updateCollectionItem(collection, resourceId, input)
    return updated ? json(updated) : error(10013, 'Unknown resource', 404)
  }
  return json({ id: resourceId, ...input })
}

export async function PUT(request: NextRequest, context: Params) { return PATCH(request, context) }

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authError = validateAuthorization(_request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId, action] = path
  if (resource === 'channels' && resourceId && subresource === 'messages' && subId) {
    const guild = (await listGuilds()).find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) return error(10003, 'Unknown Channel', 404)
    const removed = await (await import('@/lib/discord-store')).deleteMessage(guild.id, resourceId, subId)
    return removed ? new NextResponse(null, { status: 204 }) : error(10008, 'Unknown Message', 404)
  }
  if (resource === 'applications' && resourceId && subresource === 'commands' && subId) {
    return (await deleteCollectionItem('application_commands', subId)) ? new NextResponse(null, { status: 204 }) : error(10063, 'Unknown Application Command', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships' && subId) {
    return (await deleteCollectionItem('relationships', subId)) ? new NextResponse(null, { status: 204 }) : error(10013, 'Unknown Relationship', 404)
  }
  if (resource === 'guilds' && resourceId && guildResourceNames.has(subresource ?? '') && subId) {
    const values = await guildArray(resourceId, subresource as string)
    if (!values) return error(10004, 'Unknown Guild', 404)
    const next = values.filter((value) => value.id !== subId)
    if (next.length === values.length) return error(10011, 'Unknown Resource', 404)
    await saveGuildArray(resourceId, subresource as string, next)
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'guilds' && resourceId && subresource && subId) {
    const guild = await getGuild(resourceId)
    if (!guild) return error(10004, 'Unknown Guild', 404)
    const values = (guild[subresource] as Item[] | undefined) ?? []
    const next = values.filter((value) => value.id !== subId)
    if (next.length === values.length) return error(10011, 'Unknown resource', 404)
    const { updateGuild } = await import('@/lib/discord-store')
    await updateGuild(resourceId, { [subresource]: next })
    return new NextResponse(null, { status: 204 })
  }
  const collection = collectionFor(resource)
  if (collection && resourceId) {
    const removed = await deleteCollectionItem(collection, resourceId)
    return removed ? new NextResponse(null, { status: 204 }) : error(10013, 'Unknown resource', 404)
  }
  return new NextResponse(null, { status: 204 })
}

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { Allow: 'GET,POST,PATCH,PUT,DELETE,OPTIONS' } }) }

export async function HEAD() { return new NextResponse(null, { status: 200 }) }

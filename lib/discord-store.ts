import fs from 'node:fs/promises'
import path from 'node:path'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

const filePath = path.join(process.cwd(), 'data', 'discord.json')

export type Guild = {
  id: string
  name: string
  icon: string | null
  icon_hash?: string | null
  splash: string | null
  discovery_splash: string | null
  owner?: boolean
  owner_id: string
  permissions?: string
  region: string | null
  afk_channel_id: string | null
  afk_timeout: number
  widget_enabled: boolean
  widget_channel_id: string | null
  verification_level: number
  default_message_notifications: number
  explicit_content_filter: number
  roles: unknown[]
  emojis: unknown[]
  features: string[]
  mfa_level: number
  application_id: string | null
  system_channel_id: string | null
  system_channel_flags: number
  rules_channel_id: string | null
  max_presences: number | null
  max_members: number
  vanity_url_code: string | null
  description: string | null
  banner: string | null
  premium_tier: number
  premium_subscription_count?: number
  preferred_locale: string
  public_updates_channel_id: string | null
  max_video_channel_users: number
  max_stage_video_channel_users: number
  approximate_member_count?: number
  approximate_presence_count?: number
  welcome_screen?: Record<string, unknown>
  nsfw_level: number
  stickers: unknown[]
  premium_progress_bar_enabled: boolean
  safety_alerts_channel_id: string | null
  incidents_data?: Record<string, unknown> | null
  channels: Array<Record<string, unknown>>
  members: unknown[]
  messages: Array<Record<string, unknown>>
  [key: string]: unknown
}

export type Database = {
  guilds: Guild[]
  users?: Array<Record<string, unknown>>
  invites?: Array<Record<string, unknown>>
  webhooks?: Array<Record<string, unknown>>
  audit_logs?: Array<Record<string, unknown>>
  applications?: Array<Record<string, unknown>>
  sessions?: Array<Record<string, unknown>>
  safety_hubs?: Array<Record<string, unknown>>
  user_settings?: Array<Record<string, unknown>>
  user_consents?: Array<Record<string, unknown>>
  email_settings?: Array<Record<string, unknown>>
  notification_settings?: Array<Record<string, unknown>>
  user_guild_settings?: Array<Record<string, unknown>>
  notification_settings_snapshots?: Array<Record<string, unknown>>
  audio_settings?: Array<Record<string, unknown>>
  video_filter_assets?: Array<Record<string, unknown>>
  payment_sources?: Array<Record<string, unknown>>
  connections?: Array<Record<string, unknown>>
  experiments?: Array<Record<string, unknown>>
  relationships?: Array<Record<string, unknown>>
  application_commands?: Array<Record<string, unknown>>
  automod_rules?: Array<Record<string, unknown>>
  scheduled_events?: Array<Record<string, unknown>>
  emojis?: Array<Record<string, unknown>>
  threads?: Array<Record<string, unknown>>
  thread_members?: Array<Record<string, unknown>>
  read_state?: Array<Record<string, unknown>>
  reports?: Array<Record<string, unknown>>
  cloud_uploads?: Array<Record<string, unknown>>
  user_settings_proto?: Array<Record<string, unknown>>
  rate_limits?: Array<Record<string, unknown>>
  [collection: string]: Array<Record<string, unknown>> | Guild[] | undefined
}

async function mutate<T>(callback: (database: Database) => T): Promise<T> {
  const database = await readDatabase()
  const result = callback(database)
  await writeDatabase(database)
  return result
}

/**
 * Collections are stored as JSON arrays. Some snapshots keep the same data
 * nested inside an object (for example `store: { published_listings: [...] }`),
 * and trying to call `.find()` on that object used to fail with a TypeError
 * that reached the Discord client as `500 Internal Server Error`. Non-array
 * values are flattened into item arrays instead.
 */
function asRawArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return Object.values(value)
  return []
}

function asItemArray(value: unknown): Array<Record<string, unknown>> {
  return asRawArray(value).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
}

export async function listCollection(name: keyof Omit<Database, 'guilds'>) {
  const database = await readDatabase()
  return database[name] === undefined ? [] : asItemArray(database[name])
}

export async function createCollectionItem(name: keyof Omit<Database, 'guilds'>, value: Record<string, unknown>): Promise<Record<string, unknown>> {
  return mutate((database) => {
    const items = asRawArray(database[name])
    const item = { id: `${Date.now()}${Math.floor(Math.random() * 1000)}`, ...value }
    items.push(item)
    database[name] = items as Array<Record<string, unknown>>
    return item
  })
}

export async function updateCollectionItem(name: keyof Omit<Database, 'guilds'>, itemId: string, value: Record<string, unknown>) {
  return mutate((database) => {
    const items = asRawArray(database[name])
    const index = items.findIndex((item) => (item as Record<string, unknown>).id === itemId)
    if (index < 0) return null
    items[index] = { ...(items[index] as Record<string, unknown>), ...value, id: itemId }
    database[name] = items as Array<Record<string, unknown>>
    return items[index] as Record<string, unknown>
  })
}

export async function deleteCollectionItem(name: keyof Omit<Database, 'guilds'>, itemId: string) {
  return mutate((database) => {
    const items = asRawArray(database[name])
    const next = items.filter((item) => (item as Record<string, unknown>).id !== itemId)
    if (next.length === items.length) return false
    database[name] = next as Array<Record<string, unknown>>
    return true
  })
}

export async function appendAuditLog(input: Record<string, unknown>) {
  return createCollectionItem('audit_logs', {
    user_id: '900000000000000001',
    action_type: 0,
    changes: [],
    ...input,
  })
}

const rateLimitCache = new Map<string, { count: number; resetAt: number }>()

export async function consumeRateLimit(key: string, limit = 50, windowMs = 1000) {
  const currentTime = Date.now()
  const cached = rateLimitCache.get(key)
  if (cached && cached.resetAt > currentTime) {
    cached.count += 1
    return {
      allowed: cached.count <= limit,
      limit,
      remaining: Math.max(limit - cached.count, 0),
      resetAt: cached.resetAt,
      retryAfter: Math.max((cached.resetAt - currentTime) / 1000, 0.001),
    }
  }

  const state = { count: 1, resetAt: currentTime + windowMs }
  rateLimitCache.set(key, state)
  if (rateLimitCache.size > 4096) {
    for (const [cachedKey, cachedState] of rateLimitCache) {
      if (cachedState.resetAt <= currentTime) rateLimitCache.delete(cachedKey)
    }
  }
  return {
    allowed: state.count <= limit,
    limit,
    remaining: Math.max(limit - state.count, 0),
    resetAt: state.resetAt,
    retryAfter: Math.max((state.resetAt - currentTime) / 1000, 0.001),
  }
}

let cachedDatabase: Database | null = null
let writeQueue: Promise<void> = Promise.resolve()

function emptyDatabase(): Database {
  return { guilds: [] }
}

function normalizeDatabase(value: unknown): Database {
  const database = value && typeof value === 'object' && !Array.isArray(value) ? (value as Database) : emptyDatabase()
  if (!Array.isArray(database.guilds)) database.guilds = []
  return database
}

/**
 * Reads the JSON database. A corrupted, locked or partially written file must
 * never crash a request (it reached the Discord client as a 500 and produced
 * client-side error screens), so the last known good snapshot is reused.
 */
export async function readDatabase(): Promise<Database> {
  try {
    const parsed = normalizeDatabase(JSON.parse(await fs.readFile(filePath, 'utf8')))
    cachedDatabase = parsed
    return parsed
  } catch (error) {
    if (cachedDatabase) return cachedDatabase
    console.warn('[discord-store] Falling back to an empty database:', (error as Error)?.message ?? error)
    cachedDatabase = emptyDatabase()
    return cachedDatabase
  }
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

/**
 * Atomic write with retries plus a serialized queue. On Windows `fs.rename`
 * fails transiently with EBUSY/EPERM when another process (antivirus, editor,
 * indexer) holds the destination, and this mock writes on nearly every request.
 * Failures are logged instead of thrown so persistence never becomes a 500.
 */
export async function writeDatabase(database: Database): Promise<void> {
  const content = JSON.stringify(database, null, 2) + '\n'
  const run = writeQueue.then(() => persist(content))
  writeQueue = run.catch(() => undefined)
  return run
}

async function persist(content: string): Promise<void> {
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
  let lastError: unknown = null
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.writeFile(tmpPath, content, 'utf8')
      await fs.rename(tmpPath, filePath)
      return
    } catch (error) {
      lastError = error
      await wait(10 * (attempt + 1))
    }
  }
  try {
    await fs.writeFile(filePath, content, 'utf8')
  } catch {
    console.warn('[discord-store] Unable to persist data/discord.json:', (lastError as Error)?.message ?? lastError)
  }
}

const storeId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`

const defaultSafetyHub = (userId: string): Record<string, unknown> => ({
  username: userId === '900000000000000001' ? 'api-bot' : `user-${userId}`,
  classifications: [],
  guild_classifications: [],
  account_standing: { state: 100 },
  is_dsa_eligible: false,
  is_appeal_eligible: false,
  appeal_eligibility: [],
})

export async function getSafetyHub(userId: string) {
  const database = await readDatabase()
  return database.safety_hubs?.find((hub) => hub.user_id === userId)?.data ?? defaultSafetyHub(userId)
}

export async function requestSafetyReview(userId: string, classificationId: string, input: Record<string, unknown>) {
  return mutate((database) => {
    const appeal = { id: storeId(), classification_id: classificationId, user_id: userId, ...input, status: 1, created_at: new Date().toISOString() }
    database.safety_hubs ??= []
    const existing = database.safety_hubs.find((hub) => hub.user_id === userId)
    if (existing) {
      const data = existing.data as Record<string, unknown>
      data.classifications = Array.isArray(data.classifications) ? data.classifications : []
      ;(data.classifications as unknown[]).push({ id: classificationId, appeal_status: { status: 1 }, appeal })
      existing.data = data
    } else {
      database.safety_hubs.push({ id: storeId(), user_id: userId, data: { ...defaultSafetyHub(userId), classifications: [{ id: classificationId, appeal_status: { status: 1 }, appeal }] } })
    }
    return { appeal_id: appeal.id }
  })
}

export async function setSafetyHub(userId: string, data: Record<string, unknown>) {
  return mutate((database) => {
    database.safety_hubs ??= []
    const existing = database.safety_hubs.find((hub) => hub.user_id === userId)
    if (existing) existing.data = data
    else database.safety_hubs.push({ id: storeId(), user_id: userId, data })
    return data
  })
}

export async function listGuilds() { return (await readDatabase()).guilds }
export async function getGuild(id: string) {
  const database = await readDatabase()
  const guild = database.guilds.find((guild) => String(guild.id) === String(id))
  if (guild) {
    const memberCount = Array.isArray(guild.members) ? guild.members.length : 1
    guild.member_count = memberCount
    guild.approximate_member_count = memberCount
    guild.approximate_presence_count = memberCount
  }
  return guild
}
export async function createGuild(input: Partial<Guild>, ownerUserId?: string) {
  const database = await readDatabase()
  const now = Date.now().toString()
  const ownerId = ownerUserId || input.owner_id || '900000000000000001'
  const ownerUser = (await getUser(ownerId)) || {
    id: ownerId,
    username: 'user',
    discriminator: '0',
    avatar: null,
    bot: false,
    flags: 0,
  }

  const textChannelId = `${Date.now() + 1}`
  const voiceChannelId = `${Date.now() + 2}`

  const defaultRoles = [
    {
      id: now,
      name: '@everyone',
      color: 0,
      hoist: false,
      position: 0,
      permissions: '1071698660929',
      managed: false,
      mentionable: false,
    },
  ]

  const defaultChannels = [
    {
      id: textChannelId,
      guild_id: now,
      type: 0, // Guild Text
      name: 'general',
      position: 0,
      permission_overwrites: [],
      rate_limit_per_user: 0,
      topic: null,
      nsfw: false,
      parent_id: null,
    },
    {
      id: voiceChannelId,
      guild_id: now,
      type: 2, // Guild Voice
      name: 'General',
      position: 1,
      permission_overwrites: [],
      bitrate: 64000,
      user_limit: 0,
      parent_id: null,
    },
  ]

  const defaultMembers = [
    {
      user: ownerUser,
      roles: [],
      joined_at: new Date().toISOString(),
      deaf: false,
      mute: false,
    },
  ]

  const guildChannels = Array.isArray(input.channels) && input.channels.length > 0 ? input.channels : defaultChannels
  const guildRoles = Array.isArray(input.roles) && input.roles.length > 0 ? input.roles : defaultRoles
  const guildMembers = Array.isArray(input.members) && input.members.length > 0 ? input.members : defaultMembers
  const systemChanId = input.system_channel_id || textChannelId

  const isEncrypted = Boolean((input as any).is_encrypted || (Array.isArray(input.features) && input.features.includes('ENCRYPTED_E2EE')))

  const guildProperties = {
    id: now,
    name: input.name?.trim() || 'New Guild',
    icon: input.icon ?? null,
    description: null,
    splash: null,
    discovery_splash: null,
    features: isEncrypted ? ['ENCRYPTED_E2EE'] : (input.features || ['COMMUNITY', 'NEWS']),
    banner: null,
    owner_id: ownerId,
    application_id: null,
    region: 'us-central',
    afk_channel_id: null,
    afk_timeout: 300,
    system_channel_id: systemChanId,
    system_channel_flags: 0,
    widget_enabled: false,
    widget_channel_id: null,
    verification_level: isEncrypted ? 3 : 0,
    default_message_notifications: 0,
    mfa_level: 0,
    explicit_content_filter: isEncrypted ? 0 : 2,
    max_presences: null,
    max_members: isEncrypted ? 500000 : 250000,
    vanity_url_code: null,
    premium_tier: 0,
    premium_subscription_count: 0,
    preferred_locale: 'es-ES',
    rules_channel_id: null,
    safety_alerts_channel_id: null,
    public_updates_channel_id: null,
    premium_progress_bar_enabled: false,
    nsfw: false,
    nsfw_level: isEncrypted ? 2 : 0,
    max_video_channel_users: 25,
    max_stage_video_channel_users: 50,
    is_encrypted: isEncrypted,
    high_capacity_e2ee: isEncrypted,
    clyde_settings: {
      enabled: true,
      name: 'Clyde AI',
      avatar: null,
      personality: 'Eres Clyde, el asistente inteligente de Raky en este servidor.',
      description: 'Asistente IA para este servidor'
    },
  }

  const guild: Guild = {
    ...guildProperties,
    ...input,
    max_members: isEncrypted ? 500000 : 250000,
    is_encrypted: isEncrypted,
    high_capacity_e2ee: isEncrypted,
    properties: guildProperties,
    id: now,
    roles: guildRoles,
    channels: guildChannels,
    members: guildMembers,
    joined_at: new Date().toISOString(),
    large: false,
    unavailable: false,
    member_count: guildMembers.length,
    approximate_member_count: guildMembers.length,
    approximate_presence_count: guildMembers.length,
    threads: [],
    presences: [],
    voice_states: [],
    stage_instances: [],
    guild_scheduled_events: [],
    messages: [],
    emojis: [],
    stickers: [],
    data_mode: 'full',
  }

  database.guilds.push(guild)
  await writeDatabase(database)

  // Broadcast real-time GUILD_CREATE event to connected Discord web clients via WebSocket Gateway
  await broadcastGatewayEvent('GUILD_CREATE', guild)

  return guild
}
export async function updateGuild(id: string, input: Partial<Guild>) {
  const database = await readDatabase()
  const index = database.guilds.findIndex((guild) => String(guild.id) === String(id))
  if (index < 0) return null
  const current = database.guilds[index]
  const updated = { ...current, ...input, id }
  const currentProps = ((current as any).properties as Record<string, unknown>) || {}
  ;(updated as any).properties = { ...currentProps, ...input, id }
  if (Array.isArray(updated.members)) {
    ;(updated as any).member_count = updated.members.length
    updated.approximate_member_count = updated.members.length
    updated.approximate_presence_count = updated.members.length
  }
  database.guilds[index] = updated
  await writeDatabase(database)
  return database.guilds[index]
}
export async function deleteGuild(id: string, userId?: string) {
  const database = await readDatabase()
  const index = database.guilds.findIndex((guild) => String(guild.id) === String(id))
  if (index < 0) return false
  const guild = database.guilds[index]

  if (userId && guild.owner_id !== userId) {
    const members = (guild.members as Array<Record<string, unknown>>) || []
    const mIdx = members.findIndex((m) => ((m.user as any)?.id === userId))
    if (mIdx >= 0) members.splice(mIdx, 1)
    await writeDatabase(database)
    await broadcastGatewayEvent('GUILD_DELETE', { id: String(id), unavailable: false })
    return true
  }

  database.guilds.splice(index, 1)
  await writeDatabase(database)
  await broadcastGatewayEvent('GUILD_DELETE', { id: String(id), unavailable: false })
  return true
}
export async function listChannels(guildId: string) { return (await getGuild(guildId))?.channels || null }
export async function listMessages(guildId: string, channelId: string) { return (await getGuild(guildId))?.messages.filter((message) => message.channel_id === channelId) || null }
export type MessageInput = {
  authorId?: string
  nonce?: unknown
  tts?: unknown
  flags?: unknown
  embeds?: unknown
  attachments?: unknown
  mentions?: unknown
  components?: unknown
  allowed_mentions?: unknown
  message_reference?: unknown
}

export async function resolveAuthor(authorId: string) {
  const user = await getUser(authorId)
  if (user) return user
  return {
    id: authorId,
    username: authorId === '900000000000000001' ? 'api-bot' : `user_${authorId.slice(-4)}`,
    discriminator: '0',
    global_name: authorId === '900000000000000001' ? 'API Bot' : `User ${authorId.slice(-4)}`,
    avatar: null,
    bot: false,
  }
}

/**
 * Builds a Discord-shaped message. The author is always the user that sent the
 * request: hardcoding `api-bot` here made every message look like it was sent
 * from another account.
 */
export function buildMessage(channelId: string, content: string, author: Record<string, unknown>, options: MessageInput, guildId: string | null) {
  const message: Record<string, unknown> = {
    id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    channel_id: channelId,
    author,
    content,
    timestamp: new Date().toISOString(),
    edited_timestamp: null,
    tts: Boolean(options.tts),
    mention_everyone: false,
    mentions: Array.isArray(options.mentions) ? options.mentions : [],
    mention_roles: [],
    attachments: Array.isArray(options.attachments) ? options.attachments : [],
    embeds: Array.isArray(options.embeds) ? options.embeds : [],
    reactions: [],
    pinned: false,
    type: 0,
    flags: Number(options.flags ?? 0),
    components: Array.isArray(options.components) ? options.components : [],
    sticker_items: [],
  }
  if (guildId) message.guild_id = guildId
  if (options.nonce !== undefined) message.nonce = options.nonce
  if (options.message_reference !== undefined) message.message_reference = options.message_reference
  if (options.allowed_mentions !== undefined) message.allowed_mentions = options.allowed_mentions
  return message
}

export async function createMessage(guildId: string, channelId: string, content: string, authorId = '900000000000000001', options: MessageInput = {}) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  if (!guild) return null
  const author = await resolveAuthor(options.authorId ?? authorId)
  const message = buildMessage(channelId, content, author, options, guildId)
  guild.messages.push(message); await writeDatabase(database)
  await broadcastGatewayEvent('MESSAGE_CREATE', message)
  return message
}

export async function getMessage(guildId: string, channelId: string, messageId: string) {
  return (await getGuild(guildId))?.messages.find((message) => message.channel_id === channelId && message.id === messageId) ?? null
}

export async function updateMessage(guildId: string, channelId: string, messageId: string, input: Record<string, unknown>) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  const message = guild?.messages.find((item) => item.channel_id === channelId && item.id === messageId)
  if (!message) return null
  Object.assign(message, input, { id: messageId, channel_id: channelId, edited_timestamp: new Date().toISOString() })
  await writeDatabase(database); return message
}

export async function deleteMessage(guildId: string, channelId: string, messageId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  if (!guild) return null
  const index = guild.messages.findIndex((item) => item.channel_id === channelId && item.id === messageId)
  if (index < 0) return false
  guild.messages.splice(index, 1); await writeDatabase(database); return true
}

export async function pinMessage(guildId: string, channelId: string, messageId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  const message = guild?.messages.find((item) => item.channel_id === channelId && item.id === messageId)
  if (!guild || !message) return null
  message.pinned = true
  await writeDatabase(database)
  return true
}

export async function unpinMessage(guildId: string, channelId: string, messageId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  const message = guild?.messages.find((item) => item.channel_id === channelId && item.id === messageId)
  if (!guild || !message) return null
  message.pinned = false
  await writeDatabase(database)
  return true
}

export async function listPinnedMessages(guildId: string, channelId: string) {
  return (await getGuild(guildId))?.messages.filter((message) => message.channel_id === channelId && message.pinned === true) ?? null
}

export async function crosspostMessage(guildId: string, channelId: string, messageId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  const message = guild?.messages.find((item) => item.channel_id === channelId && item.id === messageId)
  if (!guild || !message) return null
  message.flags = Number(message.flags ?? 0) | 1
  await writeDatabase(database)
  return message
}

export async function addMessageRecipient(guildId: string, channelId: string, userId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  const channel = guild?.channels.find((item) => item.id === channelId)
  if (!guild || !channel) return null
  const recipients = Array.isArray(channel.recipients) ? channel.recipients : []
  if (!recipients.some((recipient) => (recipient as Record<string, unknown>).id === userId)) recipients.push({ id: userId })
  channel.recipients = recipients
  await writeDatabase(database)
  return true
}

export async function removeMessageRecipient(guildId: string, channelId: string, userId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  const channel = guild?.channels.find((item) => item.id === channelId)
  if (!guild || !channel) return null
  channel.recipients = (Array.isArray(channel.recipients) ? channel.recipients : []).filter((recipient) => (recipient as Record<string, unknown>).id !== userId)
  await writeDatabase(database)
  return true
}


export async function findChannelById(channelId: string) {
  const database = await readDatabase()
  for (const guild of database.guilds) {
    const channel = guild.channels?.find((c) => c.id === channelId)
    if (channel) return { channel, guildId: guild.id, guild }
  }
  const thread = (database.threads as Array<Record<string, unknown>> | undefined)?.find(
    (t) => t.id === channelId
  )
  if (thread) {
    const guild = database.guilds.find((g) => g.id === thread.guild_id) || null
    return { channel: thread, guildId: thread.guild_id ? String(thread.guild_id) : (guild?.id || null), guild }
  }
  const dmChannel = (database.dm_channels as Array<Record<string, unknown>> | undefined)?.find(
    (c) => c.id === channelId
  )
  if (dmChannel) return { channel: dmChannel, guildId: null, guild: null }
  return null
}

/* ---------------------------------------------------------------------------
 * Canales privados que sólo conoce el gateway
 *
 * READY anuncia canales privados (por ejemplo `800000000000000001`) que nunca se
 * guardaron en la base de datos: los construye el propio gateway. Al abrirlos, el
 * REST respondía 404 "Unknown Channel" y el cliente no podía leer ni enviar
 * mensajes directos (y tampoco el "typing"). Al ser un mock, el canal se crea de
 * forma perezosa la primera vez que el cliente lo pide.
 * ------------------------------------------------------------------------- */
export async function ensurePrivateChannel(channelId: string) {
  const database = await readDatabase()
  database.dm_channels ??= []
  const list = database.dm_channels as Array<Record<string, unknown>>
  const existing = list.find((channel) => channel.id === channelId)
  if (existing) {
    // Los canales creados antes de este arreglo quedaron con `recipients: []`:
    // se completan aquí para que REST y gateway cuenten lo mismo.
    if (!Array.isArray(existing.recipients) || existing.recipients.length === 0) {
      existing.recipients = DEFAULT_PRIVATE_RECIPIENTS()
      await writeDatabase(database)
    }
    return existing
  }
  const created: Record<string, unknown> = {
    id: channelId,
    type: 1,
    last_message_id: null,
    flags: 0,
    recipients: DEFAULT_PRIVATE_RECIPIENTS(),
    messages: [],
  }
  list.push(created)
  await writeDatabase(database)
  return created
}

/**
 * Destinatario por defecto de los canales privados que sólo conoce el gateway
 * (READY anuncia el DM `800000000000000001` con Alex Vance).
 */
function DEFAULT_PRIVATE_RECIPIENTS() {
  return [
    {
      id: '900000000000000002',
      username: 'alex',
      discriminator: '0',
      global_name: 'Alex Vance',
      avatar: null,
      bot: false,
    },
  ]
}

/**
 * Lista los canales privados conocidos (los que anuncia READY y los que se abren
 * desde el cliente). Sin esto `GET /users/@me/channels` respondía `[]` (caía en
 * los defaults de /users/@me/*) y la barra de mensajes directos aparecía vacía
 * aunque el DM anunciado por el gateway existiese.
 */
export async function listPrivateChannels() {
  const database = await readDatabase()
  const list = (database.dm_channels as Array<Record<string, unknown>> | undefined) ?? []
  // El DM que anuncia el gateway nace sin `recipients` en la BD: se completa al
  // listarlo para que el cliente no pinte un canal privado sin interlocutor.
  let changed = false
  for (const channel of list) {
    if (!Array.isArray(channel.recipients) || channel.recipients.length === 0) {
      channel.recipients = DEFAULT_PRIVATE_RECIPIENTS()
      changed = true
    }
  }
  if (changed) await writeDatabase(database)
  return list
}

/**
 * `POST /users/@me/channels`: abre (o reutiliza) el DM con `recipientId` y lo
 * guarda en la BD para que sobreviva a la recarga. Devuelve el canal con sus
 * `recipients`, que es lo que el cliente pinta en la lista de mensajes directos.
 */
export async function ensureDirectChannelForRecipient(recipientId: string) {
  const database = await readDatabase()
  database.dm_channels ??= []
  const list = database.dm_channels as Array<Record<string, unknown>>
  const existing = list.find(
    (channel) =>
      Array.isArray(channel.recipients) &&
      (channel.recipients as Array<Record<string, unknown>>).some((recipient) => recipient.id === recipientId)
  )
  if (existing) return existing
  const recipient = (await getUser(recipientId)) ?? {
    id: recipientId,
    username: `user_${recipientId.slice(-4)}`,
    discriminator: '0',
    global_name: `User ${recipientId.slice(-4)}`,
    avatar: null,
    bot: false,
  }
  const created: Record<string, unknown> = {
    id: `7${Date.now()}`,
    type: 1,
    last_message_id: null,
    flags: 0,
    recipients: [recipient],
    messages: [],
  }
  list.push(created)
  await writeDatabase(database)
  return created
}

export async function getDirectChannelMessages(channelId: string) {
  const database = await readDatabase()
  const found = await findChannelById(channelId)
  if (!found) return null

  const threads = (database.threads as Array<Record<string, unknown>> | undefined) ?? []

  if (found.guild) {
    const list = found.guild.messages.filter((m) => m.channel_id === channelId)
    for (const msg of list) {
      const thr = threads.find((t) => t.id === msg.id || t.message_id === msg.id)
      if (thr) {
        msg.thread = thr
        msg.flags = Number(msg.flags || 0) | 32
      }
    }
    return list
  }
  const dm = found.channel
  return (dm.messages as Array<Record<string, unknown>>) ?? []
}

export async function createDirectChannelMessage(channelId: string, content: string, authorId = '900000000000000001', options: MessageInput = {}) {
  const database = await readDatabase()
  const author = await resolveAuthor(options.authorId ?? authorId)

  for (const guild of database.guilds) {
    const channel = guild.channels?.find((c) => c.id === channelId)
    if (channel) {
      const message = buildMessage(channelId, content, author, options, guild.id)
      guild.messages = Array.isArray(guild.messages) ? guild.messages : []
      guild.messages.push(message)
      await writeDatabase(database)
      await broadcastGatewayEvent('MESSAGE_CREATE', message)
      return message
    }
  }

  // Check if channelId is an active thread
  const thread = ((database.threads as Array<Record<string, unknown>> | undefined) ?? []).find(
    (t) => t.id === channelId
  )
  if (thread) {
    const guildId = String(thread.guild_id)
    const guild = database.guilds.find((g) => g.id === guildId)
    if (guild) {
      const message = buildMessage(channelId, content, author, options, guild.id)
      guild.messages = Array.isArray(guild.messages) ? guild.messages : []
      guild.messages.push(message)
      thread.last_message_id = message.id
      thread.message_count = Number(thread.message_count ?? 0) + 1
      thread.total_message_sent = Number(thread.total_message_sent ?? 0) + 1
      await writeDatabase(database)
      await broadcastGatewayEvent('MESSAGE_CREATE', message)
      await broadcastGatewayEvent('THREAD_UPDATE', thread)
      return message
    }
  }

  database.dm_channels ??= []
  const dm = (database.dm_channels as Array<Record<string, unknown>>).find((c) => c.id === channelId)
  if (dm) {
    const message = buildMessage(channelId, content, author, options, null)
    const recipients = Array.isArray(dm.recipients) ? dm.recipients as Array<Record<string, unknown>> : []
    message.mentions = options.mentions !== undefined && Array.isArray(options.mentions) ? options.mentions : recipients
    dm.messages = Array.isArray(dm.messages) ? dm.messages : []
    ;(dm.messages as Array<Record<string, unknown>>).push(message)
    dm.last_message_id = message.id
    await writeDatabase(database)
    await broadcastGatewayEvent('MESSAGE_CREATE', message)
    return message
  }

  return null
}

export async function getDirectChannelMessage(channelId: string, messageId: string) {
  const messages = await getDirectChannelMessages(channelId)
  return messages?.find((m) => m.id === messageId) ?? null
}

export async function updateDirectChannelMessage(channelId: string, messageId: string, input: Record<string, unknown>) {
  return mutate((database) => {
    for (const guild of database.guilds) {
      const msg = guild.messages?.find((m) => m.channel_id === channelId && m.id === messageId)
      if (msg) {
        Object.assign(msg, input, { id: messageId, channel_id: channelId, edited_timestamp: new Date().toISOString() })
        return msg
      }
    }
    const dm = (database.dm_channels as Array<Record<string, unknown>> | undefined)?.find((c) => c.id === channelId)
    const dmMsg = (dm?.messages as Array<Record<string, unknown>> | undefined)?.find((m) => m.id === messageId)
    if (dmMsg) {
      Object.assign(dmMsg, input, { id: messageId, channel_id: channelId, edited_timestamp: new Date().toISOString() })
      return dmMsg
    }
    return null
  })
}

export async function deleteDirectChannelMessage(channelId: string, messageId: string) {
  return mutate((database) => {
    for (const guild of database.guilds) {
      const index = guild.messages?.findIndex((m) => m.channel_id === channelId && m.id === messageId) ?? -1
      if (index >= 0) {
        guild.messages.splice(index, 1)
        return true
      }
    }
    const dm = (database.dm_channels as Array<Record<string, unknown>> | undefined)?.find((c) => c.id === channelId)
    const index = (dm?.messages as Array<Record<string, unknown>> | undefined)?.findIndex((m) => m.id === messageId) ?? -1
    if (index >= 0) {
      (dm?.messages as Array<Record<string, unknown>>).splice(index, 1)
      return true
    }
    return false
  })
}
export async function addMessageReaction(channelId: string, messageId: string, emojiStr: string, userId = '900000000000000001') {
  return mutate((database) => {
    let msg: Record<string, unknown> | undefined
    for (const guild of database.guilds) {
      msg = guild.messages?.find((m) => m.channel_id === channelId && m.id === messageId)
      if (msg) break
    }
    if (!msg) {
      const dm = (database.dm_channels as Array<Record<string, unknown>> | undefined)?.find((c) => c.id === channelId)
      msg = (dm?.messages as Array<Record<string, unknown>> | undefined)?.find((m) => m.id === messageId)
    }
    if (!msg) return null

    msg.reactions = Array.isArray(msg.reactions) ? msg.reactions : []
    const reactions = msg.reactions as Array<Record<string, unknown>>
    let target = reactions.find((r) => {
      const e = r.emoji as Record<string, unknown> | undefined
      return e?.name === emojiStr || e?.id === emojiStr
    })
    if (!target) {
      target = {
        count: 1,
        me: userId === '900000000000000001',
        emoji: { id: null, name: emojiStr },
        users: [userId],
      }
      reactions.push(target)
    } else {
      const users = (target.users as string[]) || []
      if (!users.includes(userId)) {
        users.push(userId)
        target.users = users
        target.count = Number(target.count ?? 0) + 1
        if (userId === '900000000000000001') target.me = true
      }
    }
    return true
  })
}

export async function removeMessageReaction(channelId: string, messageId: string, emojiStr: string, userId = '900000000000000001') {
  return mutate((database) => {
    let msg: Record<string, unknown> | undefined
    for (const guild of database.guilds) {
      msg = guild.messages?.find((m) => m.channel_id === channelId && m.id === messageId)
      if (msg) break
    }
    if (!msg) {
      const dm = (database.dm_channels as Array<Record<string, unknown>> | undefined)?.find((c) => c.id === channelId)
      msg = (dm?.messages as Array<Record<string, unknown>> | undefined)?.find((m) => m.id === messageId)
    }
    if (!msg || !Array.isArray(msg.reactions)) return null

    const reactions = msg.reactions as Array<Record<string, unknown>>
    const index = reactions.findIndex((r) => {
      const e = r.emoji as Record<string, unknown> | undefined
      return e?.name === emojiStr || e?.id === emojiStr
    })
    if (index < 0) return true
    const target = reactions[index]
    const users = ((target.users as string[]) || []).filter((id) => id !== userId)
    target.users = users
    target.count = users.length
    if (userId === '900000000000000001') target.me = false
    if (Number(target.count) <= 0) {
      reactions.splice(index, 1)
    }
    return true
  })
}

export async function listMessageReactions(channelId: string, messageId: string, emojiStr: string) {
  const msg = await getDirectChannelMessage(channelId, messageId)
  if (!msg || !Array.isArray(msg.reactions)) return null
  const reactions = msg.reactions as Array<Record<string, unknown>>
  const target = reactions.find((r) => {
    const e = r.emoji as Record<string, unknown> | undefined
    return e?.name === emojiStr || e?.id === emojiStr
  })
  if (!target) return []
  const userIds = (target.users as string[]) || []
  const result = []
  for (const uid of userIds) {
    const u = await getUser(uid)
    if (u) result.push(u)
  }
  return result
}

export async function clearMessageReactions(channelId: string, messageId: string, emojiStr?: string) {
  return mutate((database) => {
    let msg: Record<string, unknown> | undefined
    for (const guild of database.guilds) {
      msg = guild.messages?.find((m) => m.channel_id === channelId && m.id === messageId)
      if (msg) break
    }
    if (!msg) {
      const dm = (database.dm_channels as Array<Record<string, unknown>> | undefined)?.find((c) => c.id === channelId)
      msg = (dm?.messages as Array<Record<string, unknown>> | undefined)?.find((m) => m.id === messageId)
    }
    if (!msg) return null

    if (!emojiStr) {
      msg.reactions = []
    } else if (Array.isArray(msg.reactions)) {
      msg.reactions = (msg.reactions as Array<Record<string, unknown>>).filter((r) => {
        const e = r.emoji as Record<string, unknown> | undefined
        return e?.name !== emojiStr && e?.id !== emojiStr
      })
    }
    return true
  })
}

export async function bulkDeleteMessages(channelId: string, messageIds: string[]) {
  return mutate((database) => {
    let deletedCount = 0
    for (const guild of database.guilds) {
      if (guild.messages) {
        const prev = guild.messages.length
        guild.messages = guild.messages.filter(
          (m) => !(m.channel_id === channelId && messageIds.includes(String(m.id)))
        )
        deletedCount += prev - guild.messages.length
      }
    }
    const dm = (database.dm_channels as Array<Record<string, unknown>> | undefined)?.find((c) => c.id === channelId)
    if (dm && Array.isArray(dm.messages)) {
      const prev = dm.messages.length
      dm.messages = (dm.messages as Array<Record<string, unknown>>).filter(
        (m) => !messageIds.includes(String(m.id))
      )
      deletedCount += prev - (dm.messages as Array<Record<string, unknown>>).length
    }
    return deletedCount
  })
}
export async function createInvite(channelId: string, input: Record<string, unknown> = {}) {
  const found = await findChannelById(channelId)
  if (!found) return null

  const code = (input.code as string) || Math.random().toString(36).substring(2, 9)
  const invite = {
    code,
    type: 0,
    channel: { id: channelId, name: (found.channel.name as string) || 'channel', type: found.channel.type },
    guild: found.guild ? { id: found.guild.id, name: found.guild.name, icon: found.guild.icon, features: found.guild.features } : null,
    inviter: { id: '900000000000000001', username: 'api-bot', discriminator: '0', avatar: null },
    uses: 0,
    max_uses: Number(input.max_uses ?? 0),
    max_age: Number(input.max_age ?? 86400),
    temporary: Boolean(input.temporary),
    created_at: new Date().toISOString(),
  }

  return mutate((database) => {
    database.invites ??= []
    ;(database.invites as Array<Record<string, unknown>>).push(invite)
    return invite
  })
}

export async function getInvite(code: string) {
  const database = await readDatabase()
  const list = (database.invites as Array<Record<string, unknown>> | undefined) || []
  return list.find((i) => i.code === code) ?? null
}

export async function deleteInvite(code: string) {
  return mutate((database) => {
    database.invites ??= []
    const list = database.invites as Array<Record<string, unknown>>
    const index = list.findIndex((i) => i.code === code)
    if (index < 0) return null
    const [deleted] = list.splice(index, 1)
    return deleted
  })
}

export async function listGuildBans(guildId: string) {
  const database = await readDatabase()
  database.bans ??= []
  const bans = database.bans as Array<Record<string, unknown>>
  return bans.filter((b) => b.guild_id === guildId)
}

export async function getGuildBan(guildId: string, userId: string) {
  const database = await readDatabase()
  database.bans ??= []
  const bans = database.bans as Array<Record<string, unknown>>
  return bans.find((b) => b.guild_id === guildId && b.user && (b.user as Record<string, unknown>).id === userId) ?? null
}

export async function createGuildBan(guildId: string, userId: string, reason?: string | null, deleteMessageSeconds = 0) {
  const guild = await getGuild(guildId)
  if (!guild) return null
  const user = (await getUser(userId)) || { id: userId, username: `user-${userId}`, discriminator: '0', avatar: null }

  return mutate((database) => {
    database.bans ??= []
    const bans = database.bans as Array<Record<string, unknown>>
    let ban = bans.find((b) => b.guild_id === guildId && b.user && (b.user as Record<string, unknown>).id === userId)
    if (!ban) {
      ban = { guild_id: guildId, user, reason: reason ?? null }
      bans.push(ban)
    } else {
      ban.reason = reason ?? ban.reason
    }

    // Remove user from guild members if present
    const members = guild.members as Array<Record<string, unknown>>
    const mIndex = members.findIndex((m) => ((m.user as Record<string, unknown>) || {}).id === userId)
    if (mIndex >= 0) members.splice(mIndex, 1)

    // Optionally purge recent messages
    if (deleteMessageSeconds > 0) {
      const cutoff = Date.now() - deleteMessageSeconds * 1000
      guild.messages = guild.messages.filter((m) => {
        const isTarget = m.author && (m.author as Record<string, unknown>).id === userId
        const ts = new Date(m.timestamp as string).getTime()
        return !(isTarget && ts >= cutoff)
      })
    }

    return ban
  })
}

export async function getGuildAuditLogs(guildId: string, limit = 50) {
  const database = await readDatabase()
  const logs = (database.audit_logs as Array<Record<string, unknown>> | undefined) || []
  const filtered = logs.filter((log) => log.guild_id === guildId || !log.guild_id)
  return {
    audit_log_entries: filtered.slice(0, limit),
    users: database.users || [],
    integrations: [],
    webhooks: (database.webhooks as Array<Record<string, unknown>> | undefined) || [],
    guild_scheduled_events: [],
    auto_moderation_rules: [],
    application_commands: [],
  }
}

export async function createThread(
  channelId: string,
  input: Record<string, unknown>,
  messageId?: string,
  authorId = '900000000000000001'
) {
  const found = await findChannelById(channelId)
  if (!found) return null

  const nowIso = new Date().toISOString()
  const threadId = messageId ? messageId : Date.now().toString()
  const guildId = found.guildId ?? (found.guild ? found.guild.id : null)

  const starterMsgContent = (input.message && typeof (input.message as Record<string, unknown>).content === 'string')
    ? ((input.message as Record<string, unknown>).content as string)
    : (typeof input.content === 'string' ? input.content : '')

  const memberObj = {
    id: threadId,
    user_id: authorId,
    join_timestamp: nowIso,
    flags: 0,
  }

  const thread: Record<string, unknown> = {
    id: threadId,
    type: Number(input.type ?? 11), // 11: PUBLIC_THREAD, 12: PRIVATE_THREAD
    name: String(input.name || 'Comentarios'),
    guild_id: guildId,
    parent_id: channelId,
    owner_id: authorId,
    last_message_id: messageId ?? null,
    message_count: starterMsgContent ? 1 : 0,
    member_count: 1,
    rate_limit_per_user: Number(input.rate_limit_per_user ?? 0),
    total_message_sent: starterMsgContent ? 1 : 0,
    applied_tags: Array.isArray(input.applied_tags) ? input.applied_tags : [],
    thread_metadata: {
      archived: false,
      auto_archive_duration: Number(input.auto_archive_duration ?? 4320),
      archive_timestamp: nowIso,
      locked: false,
      create_timestamp: nowIso,
      invitable: input.invitable !== undefined ? Boolean(input.invitable) : true,
    },
    member: memberObj,
    message_id: messageId ?? null,
  }

  const author = await resolveAuthor(authorId)
  let starterMsg: Record<string, unknown> | null = null
  let parentMsgToUpdate: Record<string, unknown> | null = null

  if (starterMsgContent) {
    const msgOptions = (typeof input.message === 'object' && input.message !== null)
      ? (input.message as Record<string, unknown>)
      : {}
    starterMsg = buildMessage(threadId, starterMsgContent, author, msgOptions, guildId)
    starterMsg.id = threadId
    thread.last_message_id = starterMsg.id
  }

  await mutate((database) => {
    database.threads ??= []
    const threads = database.threads as Array<Record<string, unknown>>
    const existingIndex = threads.findIndex((t) => t.id === threadId)
    if (existingIndex >= 0) {
      threads[existingIndex] = thread
    } else {
      threads.push(thread)
    }

    database.thread_members ??= []
    const members = database.thread_members as Array<Record<string, unknown>>
    const mIndex = members.findIndex((m) => (m.id === threadId || m.thread_id === threadId) && m.user_id === authorId)
    if (mIndex >= 0) {
      members[mIndex] = memberObj
    } else {
      members.push(memberObj)
    }

    if (guildId) {
      const guild = database.guilds.find((g) => g.id === guildId)
      if (guild) {
        guild.messages = Array.isArray(guild.messages) ? guild.messages : []
        if (starterMsg) {
          guild.messages.push(starterMsg)
        }
        if (messageId) {
          const parentMsg = guild.messages.find((m) => m.id === messageId)
          if (parentMsg) {
            parentMsg.thread = thread
            parentMsg.flags = Number(parentMsg.flags || 0) | 32
            parentMsgToUpdate = parentMsg
          }
        }
      }
    }
    return thread
  })

  await broadcastGatewayEvent('THREAD_CREATE', { ...thread, newly_created: true })
  await broadcastGatewayEvent('THREAD_MEMBERS_UPDATE', {
    id: thread.id,
    guild_id: thread.guild_id,
    member_count: 1,
    added_members: [memberObj],
    removed_member_ids: [],
  })
  if (starterMsg) {
    await broadcastGatewayEvent('MESSAGE_CREATE', starterMsg)
  }
  if (parentMsgToUpdate) {
    await broadcastGatewayEvent('MESSAGE_UPDATE', parentMsgToUpdate)
  }

  return starterMsg ? { ...thread, message: starterMsg } : thread
}

export async function createGuildSticker(guildId: string, input: Record<string, unknown>) {
  const guild = await getGuild(guildId)
  if (!guild) return null

  const sticker = {
    id: Date.now().toString(),
    guild_id: guildId,
    name: String(input.name || 'custom_sticker'),
    description: input.description ?? null,
    tags: String(input.tags || 'sticker'),
    type: 2, // 2: GUILD
    format_type: Number(input.format_type || 1), // 1: PNG, 2: APNG, 3: LOTTIE, 4: GIF
    available: true,
    user: { id: '900000000000000001', username: 'api-bot', discriminator: '0' },
  }

  return mutate((database) => {
    database.stickers ??= []
    ;(database.stickers as Array<Record<string, unknown>>).push(sticker)
    return sticker
  })
}

export async function listGuildStickers(guildId: string) {
  const database = await readDatabase()
  const stickers = (database.stickers as Array<Record<string, unknown>> | undefined) || []
  return stickers.filter((s) => s.guild_id === guildId)
}

export async function getGuildSticker(guildId: string, stickerId: string) {
  const stickers = await listGuildStickers(guildId)
  return stickers.find((s) => s.id === stickerId) ?? null
}

export async function deleteGuildSticker(guildId: string, stickerId: string) {
  return mutate((database) => {
    database.stickers ??= []
    const list = database.stickers as Array<Record<string, unknown>>
    const index = list.findIndex((s) => s.guild_id === guildId && s.id === stickerId)
    if (index < 0) return false
    list.splice(index, 1)
    return true
  })
}

export async function listGuildSoundboardSounds(guildId: string) {
  const database = await readDatabase()
  const sounds = (database.soundboard_sounds as Array<Record<string, unknown>> | undefined) || []
  return sounds.filter((s) => s.guild_id === guildId)
}
export async function listThreadMembers(threadId: string) {
  const database = await readDatabase()
  const members = (database.thread_members as Array<Record<string, unknown>> | undefined) || []
  return members.filter((m) => m.id === threadId)
}

export async function getThreadMember(threadId: string, userId: string) {
  const members = await listThreadMembers(threadId)
  return members.find((m) => m.user_id === userId) ?? null
}

export async function addThreadMember(threadId: string, userId: string) {
  return mutate((database) => {
    database.thread_members ??= []
    const members = database.thread_members as Array<Record<string, unknown>>
    let member = members.find((m) => m.id === threadId && m.user_id === userId)
    if (!member) {
      member = {
        id: threadId,
        user_id: userId,
        join_timestamp: new Date().toISOString(),
        flags: 0,
      }
      members.push(member)
    }
    return member
  })
}

export async function removeThreadMember(threadId: string, userId: string) {
  return mutate((database) => {
    database.thread_members ??= []
    const members = database.thread_members as Array<Record<string, unknown>>
    const index = members.findIndex((m) => m.id === threadId && m.user_id === userId)
    if (index < 0) return false
    members.splice(index, 1)
    return true
  })
}

export async function getGuildPruneCount(guildId: string, days = 7) {
  const guild = await getGuild(guildId)
  if (!guild) return null
  const members = (guild.members as Array<Record<string, unknown>>) || []
  return { pruned: Math.max(0, Math.floor(members.length * 0.1)) }
}

export async function executeGuildPrune(guildId: string, days = 7) {
  const guild = await getGuild(guildId)
  if (!guild) return null
  return { pruned: 0 }
}

export async function getDiscoverableGuilds(offset = 0, limit = 24, categoryId?: number) {
  const database = await readDatabase()
  const guilds = database.guilds || []
  const discoverable = guilds.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description ?? null,
    icon: g.icon ?? null,
    splash: g.splash ?? null,
    banner: g.banner ?? null,
    discovery_splash: g.discovery_splash ?? null,
    features: g.features || ['DISCOVERABLE', 'COMMUNITY'],
    approximate_member_count: Array.isArray(g.members) ? g.members.length : 1,
    approximate_presence_count: 1,
    primary_category_id: categoryId || 1, // 1: Gaming
    vanity_url_code: g.vanity_url_code ?? null,
    preferred_locale: g.preferred_locale || 'en-US',
  }))
  return {
    total: discoverable.length,
    guilds: discoverable.slice(offset, offset + limit),
    offset,
    limit,
  }
}

export const DISCOVERY_CATEGORIES = [
  { id: 0, name: { default: 'Unset' }, is_primary: false },
  { id: 1, name: { default: 'Gaming' }, is_primary: true },
  { id: 2, name: { default: 'Music' }, is_primary: true },
  { id: 3, name: { default: 'Entertainment' }, is_primary: true },
  { id: 4, name: { default: 'Creative Arts' }, is_primary: true },
  { id: 5, name: { default: 'Science & Tech' }, is_primary: true },
  { id: 6, name: { default: 'Education' }, is_primary: true },
  { id: 7, name: { default: 'Sports' }, is_primary: true },
  { id: 8, name: { default: 'Anime & Manga' }, is_primary: true },
  { id: 9, name: { default: 'Movies & TV' }, is_primary: true },
  { id: 10, name: { default: 'Fashion & Beauty' }, is_primary: true },
  { id: 11, name: { default: 'Podcasts' }, is_primary: true },
]

export async function createGuildSoundboardSound(guildId: string, input: Record<string, unknown>) {
  const guild = await getGuild(guildId)
  if (!guild) return null

  const sound = {
    sound_id: Date.now().toString(),
    guild_id: guildId,
    name: String(input.name || 'sound'),
    volume: Number(input.volume ?? 1),
    emoji_id: input.emoji_id ?? null,
    emoji_name: input.emoji_name ?? null,
    override_path: null,
    user: { id: '900000000000000001', username: 'api-bot', discriminator: '0' },
  }

  return mutate((database) => {
    database.soundboard_sounds ??= []
    ;(database.soundboard_sounds as Array<Record<string, unknown>>).push(sound)
    return sound
  })
}

export async function deleteGuildSoundboardSound(guildId: string, soundId: string) {
  return mutate((database) => {
    database.soundboard_sounds ??= []
    const list = database.soundboard_sounds as Array<Record<string, unknown>>
    const index = list.findIndex((s) => s.guild_id === guildId && s.sound_id === soundId)
    if (index < 0) return false
    list.splice(index, 1)
    return true
  })
}

export async function listChannelThreads(channelId: string) {
  const database = await readDatabase()
  const threads = (database.threads as Array<Record<string, unknown>> | undefined) || []
  return threads.filter((t) => t.parent_id === channelId)
}

export async function removeGuildBan(guildId: string, userId: string) {
  return mutate((database) => {
    database.bans ??= []
    const bans = database.bans as Array<Record<string, unknown>>
    const index = bans.findIndex((b) => b.guild_id === guildId && b.user && (b.user as Record<string, unknown>).id === userId)
    if (index < 0) return false
    bans.splice(index, 1)
    return true
  })
}



export async function getGuildResource(guildId: string, resource: 'members' | 'roles' | 'emojis') {
  const guild = await getGuild(guildId)
  return guild ? (guild[resource] as unknown[]) : null
}

export async function updateMember(guildId: string, userId: string, input: Record<string, unknown>) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  const member = guild?.members.find((value) => (value as Record<string, unknown>).user && ((value as Record<string, unknown>).user as Record<string, unknown>).id === userId) as Record<string, unknown> | undefined
  if (!guild || !member) return null
  Object.assign(member, input, { user: member.user })
  await writeDatabase(database)
  return member
}

export async function removeMember(guildId: string, userId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  if (!guild) return null
  const index = guild.members.findIndex((value) => ((value as Record<string, unknown>).user as Record<string, unknown> | undefined)?.id === userId)
  if (index < 0) return false
  guild.members.splice(index, 1); await writeDatabase(database); return true
}

export async function addGuildResource(guildId: string, resource: 'members' | 'roles' | 'emojis', value: Record<string, unknown>) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  if (!guild) return null
  const item = { id: Date.now().toString(), ...value }
  ;(guild[resource] as unknown[]).push(item)
  await writeDatabase(database)
  return item
}

export async function removeGuildResource(guildId: string, resource: 'members' | 'roles' | 'emojis', itemId: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  if (!guild) return null
  const items = guild[resource] as Array<Record<string, unknown>>
  const index = items.findIndex((item) => item.id === itemId)
  if (index < 0) return false
  items.splice(index, 1); await writeDatabase(database); return true
} 

export async function getUser(userId: string) {
  const database = await readDatabase()
  let user: Record<string, unknown> | null = null
  if (database.users) {
    const found = database.users.find((u) => u.id === userId)
    if (found) user = found
  }
  if (!user) {
    for (const guild of database.guilds) {
      for (const member of guild.members as Array<Record<string, unknown>>) {
        if (member.user && (member.user as Record<string, unknown>).id === userId) {
          user = member.user as Record<string, unknown>
          break
        }
      }
      if (user) break
    }
  }
  if (!user) {
    user = {
      id: userId,
      username: userId === '900000000000000001' ? 'api-bot' : `user_${userId.slice(-4)}`,
      discriminator: '0',
      global_name: userId === '900000000000000001' ? 'API Bot' : `User ${userId.slice(-4)}`,
      avatar: null,
      bot: false,
    }
  }

  return {
    id: String(user.id),
    username: String(user.username || 'user'),
    discriminator: String(user.discriminator ?? '0'),
    global_name: String(user.global_name ?? user.username ?? 'User'),
    avatar: (user.avatar as string) ?? null,
    bot: Boolean(user.bot),
    system: false,
    mfa_enabled: Boolean(user.mfa_enabled),
    authenticator_types: Array.isArray(user.authenticator_types) ? user.authenticator_types : [],
    banner: (user.banner as string) ?? null,
    accent_color: (user.accent_color as number) ?? null,
    banner_color: (user.banner_color as string) ?? null,
    locale: 'en-US',
    verified: true,
    email: (user.email as string) ?? `${user.id}@mock.local`,
    flags: Number(user.flags ?? 0),
    premium_type: Number(user.premium_type) || 0,
    premium_since: Number(user.premium_type) > 0 ? ((user.premium_since as string) || '2026-01-01T00:00:00.000Z') : null,
    public_flags: Number(user.flags ?? 0),
    phone: null,
    nsfw_allowed: true,
    bio: (user.bio as string) ?? '',
    pronouns: (user.pronouns as string) ?? '',
    avatar_decoration_data: null,
  }
}

export async function getUserSubscriptions(userId: string) {
  const database = await readDatabase()
  const subscriptions = (database.subscriptions as Array<Record<string, unknown>>) || []
  return subscriptions.filter((s) => s.user_id === userId && s.status === 1)
}

export async function saveUserSubscription(userId: string, subscription: Record<string, unknown>) {
  return mutate((database) => {
    database.subscriptions ??= []
    const subs = database.subscriptions as Array<Record<string, unknown>>
    const idx = subs.findIndex((s) => s.user_id === userId)
    if (idx >= 0) {
      subs[idx] = { ...subs[idx], ...subscription, user_id: userId }
      return subs[idx]
    } else {
      subs.push({ ...subscription, user_id: userId })
      return subscription
    }
  })
}

export async function deleteUserSubscription(userId: string, subscriptionId?: string) {
  return mutate((database) => {
    database.subscriptions ??= []
    const subs = database.subscriptions as Array<Record<string, unknown>>
    database.subscriptions = subs.filter((s) => s.user_id !== userId)
    return true
  })
}

export async function updateUser(userId: string, input: Record<string, unknown>) {
  return mutate((database) => {
    database.users ??= []
    let user = database.users.find((u) => u.id === userId)
    if (!user) {
      user = { id: userId, username: 'user', discriminator: '0', ...input }
      database.users.push(user)
    } else {
      Object.assign(user, input, { id: userId })
    }
    for (const guild of database.guilds) {
      for (const member of guild.members as Array<Record<string, unknown>>) {
        const mUser = member.user as Record<string, unknown> | undefined
        if (mUser?.id === userId) {
          member.user = { ...mUser, ...user }
        }
      }
    }
    return user
  })
}

export async function getUserProfile(userId: string, currentUserId = '900000000000000001') {
  const user = (await getUser(userId)) as Record<string, unknown> | null
  if (!user) return null

  const database = await readDatabase()
  const mutualGuilds = database.guilds
    .filter((guild) => {
      const members = guild.members as Array<Record<string, unknown>>
      const hasTarget = guild.owner_id === userId || members.some((m) => (m.user as Record<string, unknown>)?.id === userId)
      const hasCurrent = guild.owner_id === currentUserId || members.some((m) => (m.user as Record<string, unknown>)?.id === currentUserId)
      return hasTarget && hasCurrent
    })
    .map((guild) => {
      const member = (guild.members as Array<Record<string, unknown>>).find((m) => (m.user as Record<string, unknown>)?.id === userId)
      return {
        id: guild.id,
        nick: (member?.nick as string) ?? null,
      }
    })

  const userPremium = Number(user.premium_type) || 0
  const userBoosts = ((database.guild_boosts as Array<Record<string, unknown>> | undefined) || []).filter(
    (b) => b.user_id === userId && !b.ended
  )
  const hasBoosts = userBoosts.length > 0
  const firstBoostDate = hasBoosts ? ((userBoosts[0]?.ends_at as string) || new Date().toISOString()) : null

  const badges = [
    ...(userPremium > 0 ? [{ id: 'premium', description: 'Subscriber since Jan 1, 2026', icon: '2ba85e8026a8614b640c2837bcdfe21b' }] : []),
    ...(hasBoosts ? [{ id: 'guild_booster', description: 'Server Booster', icon: 'guild_booster' }] : []),
    ...(Number(user.flags ?? 0) & 64 ? [{ id: 'hypesquad_house_1', description: 'HypeSquad Bravery', icon: '8a88d63823d835a165edd523860cf4fe' }] : []),
    ...(Number(user.flags ?? 0) & 128 ? [{ id: 'hypesquad_house_2', description: 'HypeSquad Brilliance', icon: '011940fd013da3f7fb926e4a1cd2e618' }] : []),
  ]

  const userProfile = {
    guild_id: null,
    bio: (user.bio as string) ?? '',
    pronouns: (user.pronouns as string) ?? '',
    banner: (user.banner as string) ?? null,
    accent_color: (user.accent_color as number) ?? null,
    theme_colors: (user.theme_colors as [number, number]) ?? null,
    popout_animation_particle_type: null,
    emoji: null,
    profile_effect: null,
  }

  return {
    user: {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator ?? '0',
      global_name: user.global_name ?? user.username,
      avatar: user.avatar ?? null,
      banner: user.banner ?? null,
      accent_color: user.accent_color ?? null,
      banner_color: null,
      bot: Boolean(user.bot),
      system: false,
      mfa_enabled: Boolean(user.mfa_enabled),
      locale: 'en-US',
      verified: true,
      email: (user.email as string) ?? `${user.id}@mock.local`,
      phone: null,
      nsfw_allowed: true,
      premium_type: userPremium,
      premium_since: userPremium > 0 ? ((user.premium_since as string) || '2026-01-01T00:00:00.000Z') : null,
      bio: userProfile.bio,
      pronouns: userProfile.pronouns,
      flags: Number(user.flags ?? 0),
      public_flags: Number(user.flags ?? 0),
      avatar_decoration_data: null,
    },
    user_profile: userProfile,
    badges,
    mutual_guilds: mutualGuilds,
    mutual_friends_count: 0,
    connected_accounts: [],
    premium_since: userPremium > 0 ? ((user.premium_since as string) || '2026-01-01T00:00:00.000Z') : null,
    premium_type: userPremium,
    premium_guild_since: hasBoosts ? firstBoostDate : null,
    legacy_username: null,
    application: null,
  }
}

export async function updateUserProfile(userId: string, input: Record<string, unknown>) {
  return mutate((database) => {
    database.users ??= []
    let user = database.users.find((u) => u.id === userId)
    if (!user) {
      user = { id: userId, username: 'user', discriminator: '0' }
      database.users.push(user)
    }
    if (input.bio !== undefined) user.bio = input.bio
    if (input.pronouns !== undefined) user.pronouns = input.pronouns
    if (input.accent_color !== undefined) user.accent_color = input.accent_color
    if (input.theme_colors !== undefined) user.theme_colors = input.theme_colors
    if (input.banner !== undefined) user.banner = input.banner

    return {
      bio: user.bio ?? '',
      pronouns: user.pronouns ?? '',
      accent_color: user.accent_color ?? null,
      theme_colors: user.theme_colors ?? null,
      banner: user.banner ?? null,
    }
  })
}

export async function getUserSettings(userId: string) {
  const database = await readDatabase()
  const existing = database.user_settings?.find((s) => s.user_id === userId)
  if (existing) return existing

  return {
    user_id: userId,
    locale: 'en-US',
    theme: 'dark',
    status: 'online',
    custom_status: null,
    developer_mode: true,
    afk_timeout: 3600,
    animate_emoji: true,
    animate_stickers: 0,
    convert_emoticons: false,
    default_guilds_restricted: false,
    detect_platform_accounts: false,
    disable_games_tab: true,
    enable_tts_command: false,
    explicit_content_filter: 0,
    friend_source_flags: { all: true, mutual_guilds: true, mutual_friends: true },
    gif_auto_play: true,
    guild_folders: [],
    guild_positions: [],
    inline_attachment_media: true,
    inline_embed_media: true,
    message_display_compact: false,
    render_embeds: true,
    render_reactions: true,
    restricted_guilds: [],
    show_current_game: true,
    timezone_offset: 0,
  }
}

export async function updateUserSettings(userId: string, input: Record<string, unknown>) {
  return mutate((database) => {
    database.user_settings ??= []
    let settings = database.user_settings.find((s) => s.user_id === userId)
    if (!settings) {
      settings = { user_id: userId, locale: 'en-US', theme: 'dark', status: 'online' }
      database.user_settings.push(settings)
    }
    Object.assign(settings, input, { user_id: userId })
    return settings
  })
}

export async function listRelationships(currentUserId = '900000000000000001') {
  const database = await readDatabase()
  const list = database.relationships ?? []
  const relationships = []
  for (const rel of list) {
    if (String(rel.user_id) === String(currentUserId)) {
      const targetUser = await getUser(String(rel.id))
      relationships.push({
        id: String(rel.id),
        type: Number(rel.type ?? 1),
        nickname: (rel.nickname as string) ?? null,
        user: targetUser ?? { id: String(rel.id), username: 'user', discriminator: '0', avatar: null },
        user_ignored: Boolean(rel.user_ignored),
        since: rel.since ?? new Date().toISOString(),
      })
    }
  }

  return relationships
}

export async function setRelationship(targetUserId: string, type: number, nickname?: string | null, currentUserId = '900000000000000001') {
  return mutate((database) => {
    database.relationships ??= []
    let rel = database.relationships.find((r) => String(r.id) === String(targetUserId) && (String(r.user_id) === String(currentUserId) || !r.user_id))
    if (rel) {
      rel.type = type
      if (nickname !== undefined) rel.nickname = nickname
    } else {
      rel = {
        id: String(targetUserId),
        type,
        nickname: nickname ?? null,
        user_id: String(currentUserId),
        user_ignored: false,
        since: new Date().toISOString(),
      }
      database.relationships.push(rel)
    }
    return rel
  })
}

export async function deleteRelationship(targetUserId: string, currentUserId = '900000000000000001') {
  return mutate((database) => {
    database.relationships ??= []
    const prev = database.relationships.length
    database.relationships = database.relationships.filter(
      (r) => !(
        (String(r.id) === String(targetUserId) && (String(r.user_id) === String(currentUserId) || !r.user_id)) ||
        (String(r.id) === String(currentUserId) && String(r.user_id) === String(targetUserId))
      )
    )
    return database.relationships.length < prev
  })
}

export async function getUserNote(targetUserId: string, currentUserId = '900000000000000001') {
  const database = await readDatabase()
  const note = (database.notes as Array<Record<string, unknown>> | undefined)?.find(
    (n) => n.user_id === targetUserId && (n.note_user_id === currentUserId || !n.note_user_id)
  )
  return note?.note ? String(note.note) : ''
}

export async function setUserNote(targetUserId: string, content: string, currentUserId = '900000000000000001') {
  return mutate((database) => {
    database.notes ??= []
    const notes = database.notes as Array<Record<string, unknown>>
    const index = notes.findIndex(
      (n) => n.user_id === targetUserId && (n.note_user_id === currentUserId || !n.note_user_id)
    )
    if (content.trim().length === 0) {
      if (index >= 0) notes.splice(index, 1)
      return ''
    }
    if (index >= 0) {
      notes[index].note = content
    } else {
      notes.push({
        user_id: targetUserId,
        note_user_id: currentUserId,
        note: content,
      })
    }
    return content
  })
}


export async function listUserGuilds(userId: string) {
  return (await readDatabase()).guilds.filter((guild) => guild.owner_id === userId || (guild.members as Array<Record<string, unknown>>).some((member) => (member.user as Record<string, unknown> | undefined)?.id === userId))
}

// ---------------------------------------------------------------------------
// Guild Boosts and Slots
// ---------------------------------------------------------------------------

export async function getUserGuildBoostSlots(userId: string) {
  const database = await readDatabase()
  database.guild_boost_slots ??= []
  const allSlots = database.guild_boost_slots as Array<Record<string, unknown>>
  let userSlots = allSlots.filter((s) => s.user_id === userId)

  const user = (database.users || []).find((u) => u.id === userId)
  const isTest = (user?.email as string)?.toLowerCase() === 'test@raky.es'
  const isNitro = Number(user?.premium_type) === 2 || isTest

  // If user has Nitro or is test@raky.es, ensure they have boost slots available
  const minSlots = isTest ? 14 : isNitro ? 2 : 0
  if (userSlots.length < minSlots) {
    await mutate((db) => {
      db.guild_boost_slots ??= []
      const slots = db.guild_boost_slots as Array<Record<string, unknown>>
      const existing = slots.filter((s) => s.user_id === userId)
      const toAdd = minSlots - existing.length
      const userSub = (db.subscriptions as Array<Record<string, unknown>> | undefined)?.find(
        (s) => s.user_id === userId && s.status === 1
      )
      const subId = (userSub?.id as string) || '600000000000000001'

      for (let i = 0; i < toAdd; i++) {
        const slot = {
          id: `slot_${userId}_${Date.now()}_${i + 1}`,
          user_id: userId,
          subscription_id: subId,
          premium_guild_subscription: null,
          canceled: false,
          cooldown_ends_at: null,
        }
        slots.push(slot)
      }
    })
    const updatedDb = await readDatabase()
    userSlots = ((updatedDb.guild_boost_slots as Array<Record<string, unknown>>) || []).filter(
      (s) => s.user_id === userId
    )
  }

  return userSlots.map((s) => ({
    id: String(s.id),
    subscription_id: String(s.subscription_id || '600000000000000001'),
    premium_guild_subscription: s.premium_guild_subscription ?? null,
    canceled: Boolean(s.canceled),
    cooldown_ends_at: (s.cooldown_ends_at as string) ?? null,
  }))
}

export async function updateGuildBoostSlot(
  userId: string,
  slotId: string,
  updates: Partial<{ canceled: boolean }>
) {
  return mutate((database) => {
    database.guild_boost_slots ??= []
    const slots = database.guild_boost_slots as Array<Record<string, unknown>>
    const slot = slots.find((s) => s.id === slotId && s.user_id === userId)
    if (!slot) return null
    Object.assign(slot, updates)
    return {
      id: String(slot.id),
      subscription_id: String(slot.subscription_id || '600000000000000001'),
      premium_guild_subscription: slot.premium_guild_subscription ?? null,
      canceled: Boolean(slot.canceled),
      cooldown_ends_at: (slot.cooldown_ends_at as string) ?? null,
    }
  })
}

export async function applyGuildBoostSlots(
  userId: string,
  guildId: string,
  slotIds: string[]
) {
  const result = await mutate((database) => {
    database.guild_boost_slots ??= []
    database.guild_boosts ??= []
    database.users ??= []

    const user = database.users.find((u) => u.id === userId) || { id: userId, username: 'user' }
    const guild = database.guilds.find((g) => g.id === guildId)
    if (!guild) {
      throw new Error(`Guild ${guildId} not found`)
    }

    const slots = database.guild_boost_slots as Array<Record<string, unknown>>
    const boosts = database.guild_boosts as Array<Record<string, unknown>>
    const appliedBoosts: Array<Record<string, unknown>> = []

    for (const slotId of slotIds) {
      let slot = slots.find((s) => s.id === slotId && s.user_id === userId)
      if (!slot) {
        slot = {
          id: slotId,
          user_id: userId,
          subscription_id: '600000000000000001',
          premium_guild_subscription: null,
          canceled: false,
          cooldown_ends_at: null,
        }
        slots.push(slot)
      }

      const boostId = `boost_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const boostRecord = {
        id: boostId,
        guild_id: guildId,
        user_id: userId,
        user: {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator || '0',
          avatar: user.avatar || null,
          global_name: user.global_name || user.username,
        },
        user_premium_guild_subscription_slot_id: slot.id,
        ended: false,
        ends_at: null,
      }

      boosts.push(boostRecord)
      slot.premium_guild_subscription = { id: boostId, guild_id: guildId }
      appliedBoosts.push(boostRecord)
    }

    // Recalculate guild boosts
    const activeGuildBoosts = boosts.filter((b) => b.guild_id === guildId && !b.ended)
    const count = activeGuildBoosts.length
    guild.premium_subscription_count = count

    if (count >= 14) {
      guild.premium_tier = 3
    } else if (count >= 7) {
      guild.premium_tier = 2
    } else if (count >= 2) {
      guild.premium_tier = 1
    } else {
      guild.premium_tier = 0
    }

    // Update guild member premium_since
    guild.members ??= []
    const members = guild.members as Array<Record<string, unknown>>
    const member = members.find((m) => {
      const u = m.user as Record<string, unknown> | undefined
      return u?.id === userId || m.user_id === userId
    })
    if (member) {
      member.premium_since ??= new Date().toISOString()
    }

    return { appliedBoosts, guild, member }
  })

  // Broadcast updates via Gateway
  if (result?.guild) {
    await broadcastGatewayEvent('GUILD_UPDATE', result.guild)
    if (result.member) {
      await broadcastGatewayEvent('GUILD_MEMBER_UPDATE', {
        guild_id: guildId,
        user: result.member.user,
        roles: result.member.roles || [],
        premium_since: result.member.premium_since,
      })
    }
  }

  return result?.appliedBoosts || []
}

export async function unapplyGuildBoost(userId: string, guildId: string, boostIdOrSlotId: string) {
  const result = await mutate((database) => {
    database.guild_boosts ??= []
    database.guild_boost_slots ??= []
    const boosts = database.guild_boosts as Array<Record<string, unknown>>
    const slots = database.guild_boost_slots as Array<Record<string, unknown>>

    const boost = boosts.find(
      (b) =>
        (b.id === boostIdOrSlotId || b.user_premium_guild_subscription_slot_id === boostIdOrSlotId) &&
        b.guild_id === guildId
    )

    if (boost) {
      boost.ended = true
      const slot = slots.find((s) => s.id === boost.user_premium_guild_subscription_slot_id)
      if (slot) {
        slot.premium_guild_subscription = null
      }
    }

    const guild = database.guilds.find((g) => g.id === guildId)
    if (guild) {
      const activeGuildBoosts = boosts.filter((b) => b.guild_id === guildId && !b.ended)
      const count = activeGuildBoosts.length
      guild.premium_subscription_count = count

      if (count >= 14) {
        guild.premium_tier = 3
      } else if (count >= 7) {
        guild.premium_tier = 2
      } else if (count >= 2) {
        guild.premium_tier = 1
      } else {
        guild.premium_tier = 0
      }
    }

    return guild
  })

  if (result) {
    await broadcastGatewayEvent('GUILD_UPDATE', result)
  }

  return true
}

export async function getGuildBoosts(guildId: string) {
  const database = await readDatabase()
  const boosts = (database.guild_boosts as Array<Record<string, unknown>>) || []
  return boosts.filter((b) => b.guild_id === guildId && !b.ended)
}

export async function getUserGuildBoosts(userId: string) {
  const database = await readDatabase()
  const boosts = (database.guild_boosts as Array<Record<string, unknown>>) || []
  return boosts.filter((b) => b.user_id === userId && !b.ended)
}

// ---------------------------------------------------------------------------
// Gift Codes
// ---------------------------------------------------------------------------

export async function createGiftCode(
  userId: string,
  skuId: string,
  subscriptionPlanId?: string,
  giftStyle = 0
) {
  const code = Array.from({ length: 16 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
      Math.floor(Math.random() * 62)
    )
  ).join('')

  const isBasic =
    skuId === '978380684370378762' ||
    subscriptionPlanId === '978380692553465866' ||
    subscriptionPlanId === '978387023482069042'
  const planId = isBasic ? '978380692553465866' : subscriptionPlanId || '511651880837840896'
  const targetSkuId = isBasic ? '978380684370378762' : '521847234246082599'
  const price = isBasic ? 299 : 999
  const planName = isBasic ? 'Nitro Basic Monthly' : 'Nitro Monthly'

  return mutate((database) => {
    database.gift_codes ??= []
    database.users ??= []
    const user = database.users.find((u) => u.id === userId) || { id: userId, username: 'user' }

    const gift = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      sku_id: targetSkuId,
      application_id: '521847234246082599',
      user_id: userId,
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator || '0',
        avatar: user.avatar || null,
        global_name: user.global_name || user.username,
      },
      uses: 0,
      max_uses: 1,
      redeemed: false,
      expires_at: null,
      gift_style: giftStyle,
      subscription_plan_id: planId,
      subscription_plan: {
        id: planId,
        name: planName,
        interval: 1,
        interval_count: 1,
        tax_inclusive: true,
        sku_id: targetSkuId,
        currency: 'eur',
        price,
        prices: {
          '0': {
            country_prices: {
              country_code: 'ES',
              prices: [{ currency: 'eur', amount: price, exponent: 2 }],
            },
          },
        },
      },
    }

    const codes = database.gift_codes as Array<Record<string, unknown>>
    codes.push(gift)
    return gift
  })
}

export async function getGiftCode(code: string) {
  const database = await readDatabase()
  const codes = (database.gift_codes as Array<Record<string, unknown>>) || []
  return codes.find((c) => c.code === code) || null
}

export async function getUserGiftCodes(userId: string) {
  const database = await readDatabase()
  const codes = (database.gift_codes as Array<Record<string, unknown>>) || []
  return codes.filter((c) => c.user_id === userId && !c.redeemed)
}

export async function revokeGiftCode(userId: string, code: string) {
  return mutate((database) => {
    database.gift_codes ??= []
    const codes = database.gift_codes as Array<Record<string, unknown>>
    const idx = codes.findIndex((c) => c.code === code && c.user_id === userId)
    if (idx >= 0) {
      codes.splice(idx, 1)
      return true
    }
    return false
  })
}

export async function redeemGiftCode(code: string, redeemingUserId: string) {
  const result = await mutate((database) => {
    database.gift_codes ??= []
    database.users ??= []
    database.subscriptions ??= []

    const codes = database.gift_codes as Array<Record<string, unknown>>
    const gift = codes.find((c) => c.code === code)
    if (!gift) {
      const err = new Error('Unknown Gift Code') as Error & { code?: number; status?: number }
      err.code = 10038
      err.status = 404
      throw err
    }

    if (gift.redeemed || Number(gift.uses) >= Number(gift.max_uses)) {
      const err = new Error('This gift has already been claimed.') as Error & { code?: number; status?: number }
      err.code = 50050
      err.status = 400
      throw err
    }

    gift.redeemed = true
    gift.uses = 1

    const isBasic = gift.sku_id === '978380684370378762'
    const premiumType = isBasic ? 3 : 2

    let user = database.users.find((u) => u.id === redeemingUserId)
    const premiumSince = new Date().toISOString()
    if (user) {
      user.premium_type = premiumType
      user.premium_since = premiumSince
    }

    const newSub = {
      id: `sub_${Date.now()}`,
      type: 1,
      status: 1,
      created_at: new Date().toISOString(),
      canceled_at: null,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      plan_id: (gift.subscription_plan_id as string) || (isBasic ? '978380692553465866' : '511651880837840896'),
      sku_id: gift.sku_id,
      items: [
        {
          id: `item_${Date.now()}`,
          plan_id: gift.subscription_plan_id,
          quantity: 1,
        },
      ],
      payment_source_id: '500000000000000001',
      payment_gateway: 1,
      flags: 0,
      user_id: redeemingUserId,
      country_code: 'ES',
      currency: 'eur',
    }

    const subs = database.subscriptions as Array<Record<string, unknown>>
    subs.push(newSub)

    return { gift, newSub, premiumType, premiumSince }
  })

  if (result) {
    await broadcastGatewayEvent('USER_UPDATE', {
      id: redeemingUserId,
      premium_type: result.premiumType,
      premium_since: result.premiumSince,
    })
    await broadcastGatewayEvent('USER_SUBSCRIPTIONS_UPDATE', {})
    await broadcastGatewayEvent('BILLING_SUBSCRIPTION_UPDATE', result.newSub)
  }

  return result.gift
}



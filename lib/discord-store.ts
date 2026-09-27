import fs from 'node:fs/promises'
import path from 'node:path'

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
  payment_sources?: Array<Record<string, unknown>>
  connections?: Array<Record<string, unknown>>
  experiments?: Array<Record<string, unknown>>
  relationships?: Array<Record<string, unknown>>
  application_commands?: Array<Record<string, unknown>>
}

async function mutate<T>(callback: (database: Database) => T): Promise<T> {
  const database = await readDatabase()
  const result = callback(database)
  await writeDatabase(database)
  return result
}

export async function listCollection(name: keyof Omit<Database, 'guilds'>) {
  const database = await readDatabase()
  return database[name] ?? []
}

export async function createCollectionItem(name: keyof Omit<Database, 'guilds'>, value: Record<string, unknown>) {
  return mutate((database) => {
    database[name] ??= []
    const item = { id: `${Date.now()}${Math.floor(Math.random() * 1000)}`, ...value }
    database[name]!.push(item)
    return item
  })
}

export async function updateCollectionItem(name: keyof Omit<Database, 'guilds'>, itemId: string, value: Record<string, unknown>) {
  return mutate((database) => {
    const items = database[name] ?? []
    const index = items.findIndex((item) => item.id === itemId)
    if (index < 0) return null
    items[index] = { ...items[index], ...value, id: itemId }
    return items[index]
  })
}

export async function deleteCollectionItem(name: keyof Omit<Database, 'guilds'>, itemId: string) {
  return mutate((database) => {
    const items = database[name] ?? []
    const next = items.filter((item) => item.id !== itemId)
    if (next.length === items.length) return false
    database[name] = next
    return true
  })
}

async function readDatabase(): Promise<Database> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as Database
}

async function writeDatabase(database: Database) {
  await fs.writeFile(filePath, JSON.stringify(database, null, 2) + '\n', 'utf8')
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
export async function getGuild(id: string) { return (await readDatabase()).guilds.find((guild) => guild.id === id) }
export async function createGuild(input: Partial<Guild>) {
  const database = await readDatabase()
  const now = Date.now().toString()
  const guild: Guild = {
    id: now,
    name: input.name?.trim() || 'New Guild',
    icon: null,
    splash: null,
    discovery_splash: null,
    owner_id: input.owner_id || '900000000000000001',
    region: null,
    afk_channel_id: null,
    afk_timeout: 300,
    widget_enabled: false,
    widget_channel_id: null,
    verification_level: 0,
    default_message_notifications: 0,
    explicit_content_filter: 0,
    roles: [],
    emojis: [],
    features: [],
    mfa_level: 0,
    application_id: null,
    system_channel_id: null,
    system_channel_flags: 0,
    rules_channel_id: null,
    max_presences: null,
    max_members: 0,
    vanity_url_code: null,
    description: null,
    banner: null,
    premium_tier: 0,
    preferred_locale: 'en-US',
    public_updates_channel_id: null,
    max_video_channel_users: 25,
    max_stage_video_channel_users: 50,
    nsfw_level: 0,
    stickers: [],
    premium_progress_bar_enabled: false,
    safety_alerts_channel_id: null,
    incidents_data: null,
    channels: [],
    members: [],
    messages: [],
    ...input,
  }
  database.guilds.push(guild)
  await writeDatabase(database)
  return guild
}
export async function updateGuild(id: string, input: Partial<Guild>) {
  const database = await readDatabase()
  const index = database.guilds.findIndex((guild) => guild.id === id)
  if (index < 0) return null
  database.guilds[index] = { ...database.guilds[index], ...input, id }
  await writeDatabase(database)
  return database.guilds[index]
}
export async function deleteGuild(id: string) {
  const database = await readDatabase()
  const previous = database.guilds.length
  database.guilds = database.guilds.filter((guild) => guild.id !== id)
  if (database.guilds.length === previous) return false
  await writeDatabase(database)
  return true
}
export async function listChannels(guildId: string) { return (await getGuild(guildId))?.channels || null }
export async function listMessages(guildId: string, channelId: string) { return (await getGuild(guildId))?.messages.filter((message) => message.channel_id === channelId) || null }
export async function createMessage(guildId: string, channelId: string, content: string) {
  const database = await readDatabase(); const guild = database.guilds.find((item) => item.id === guildId)
  if (!guild) return null
  const message = { id: Date.now().toString(), channel_id: channelId, author: { id: '900000000000000001', username: 'api-bot', discriminator: '0000', bot: true }, content, timestamp: new Date().toISOString(), type: 0, mentions: [], mention_roles: [], attachments: [], embeds: [], pinned: false, edited_timestamp: null, flags: 0 }
  guild.messages.push(message); await writeDatabase(database); return message
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
  if (userId === '900000000000000001') return { id: userId, username: 'api-bot', discriminator: '0000', global_name: 'API Bot', bot: true, flags: 0 }
  const database = await readDatabase()
  for (const guild of database.guilds) for (const member of guild.members as Array<Record<string, unknown>>) if (member.user && (member.user as Record<string, unknown>).id === userId) return member.user
  return null
}

export async function updateUser(userId: string, input: Record<string, unknown>) {
  if (userId === '900000000000000001') return { id: userId, username: String(input.username ?? 'api-bot'), discriminator: '0000', global_name: input.global_name ?? input.username ?? 'API Bot', bot: true, flags: 0, ...input }
  const database = await readDatabase()
  let updated: Record<string, unknown> | null = null
  for (const guild of database.guilds) for (const member of guild.members as Array<Record<string, unknown>>) {
    const user = member.user as Record<string, unknown> | undefined
    if (user?.id === userId) { member.user = { ...user, ...input, id: userId }; updated = member.user }
  }
  if (updated) await writeDatabase(database)
  return updated
}

export async function listUserGuilds(userId: string) {
  return (await readDatabase()).guilds.filter((guild) => guild.owner_id === userId || (guild.members as Array<Record<string, unknown>>).some((member) => (member.user as Record<string, unknown> | undefined)?.id === userId))
} 


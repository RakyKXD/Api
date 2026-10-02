import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
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
  appendAuditLog,
  consumeRateLimit,
} from '@/lib/discord-store'
import {
  cloneDefaultUserSettings,
  DEFAULT_USER_GUILD_SETTINGS,
  validateAudioSettings,
  validateUserGuildSettings,
  validateUserSettings,
  validateVideoFilterAsset,
} from '@/lib/discord-settings'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ path: string[] }> }
type Item = Record<string, unknown>

const id = () => `${Date.now()}${Math.floor(Math.random() * 10000)}`
const now = () => new Date().toISOString()
const json = (body: unknown, status = 200, headers?: HeadersInit) => {
  const response = NextResponse.json(body, { status, headers })
  response.headers.set('X-RateLimit-Limit', '50')
  response.headers.set('X-RateLimit-Remaining', '49')
  response.headers.set('X-RateLimit-Reset-After', '1')
  response.headers.set('X-RateLimit-Bucket', 'discord-http-mock')
  return response
}
const error = (code: number, message: string, status: number) => json({ code, message }, status)

// Discord's client decodes /users/@me/settings-proto payloads with a protobuf
// decoder, so responses must be base64 protobuf messages. An empty message is a
// valid PreloadedUserSettings (all defaults); legacy JSON blobs such as "e30="
// ("{}") make the client throw and leave the settings UI broken.
function settingsProtoPayload(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return ''
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return ''
  let bytes: Buffer
  try {
    bytes = Buffer.from(value, 'base64')
  } catch {
    return ''
  }
  if (bytes.length === 0) return ''
  const text = bytes.toString('utf8')
  if (text.startsWith('{') || text.startsWith('[') || text.startsWith('"')) return ''
  const fieldNumber = bytes[0] >> 3
  const wireType = bytes[0] & 0x07
  if (fieldNumber === 0 || wireType > 5) return ''
  return value
}


function collectionFor(resource: string): keyof Omit<import('@/lib/discord-store').Database, 'guilds'> | null {
  const map: Record<string, keyof Omit<import('@/lib/discord-store').Database, 'guilds'>> = {
    users: 'users', invites: 'invites', webhooks: 'webhooks', audit: 'audit_logs', 'audit-logs': 'audit_logs', applications: 'applications', sessions: 'sessions',
    ai: 'ai', connections: 'connections', experiments: 'experiments', relationships: 'relationships', 'payment-sources': 'payment_sources', invoices: 'invoices',
    'application-directory': 'application_directory', 'audit-log': 'audit_logs', 'auto-moderation': 'automod_rules',
    captcha: 'captcha', 'client-distribution': 'client_distribution', collectibles: 'collectibles', checkpoints: 'checkpoints', components: 'components', 'connected-accounts': 'connections',
    'directory-entries': 'directory_entries', discovery: 'discovery', entitlements: 'entitlements', 'family-center': 'family_center',
    'game-invites': 'game_invites', games: 'games', 'guild-analytics': 'guild_analytics', 'guild-templates': 'guild_templates',
    integrations: 'integrations', lobbies: 'lobbies', 'notification-center': 'notification_center', payments: 'payments',
    'premium-referrals': 'premium_referrals', presences: 'presences', promotions: 'promotions', quests: 'quests',
    soundboard: 'soundboard', 'stage-instances': 'stage_instances', store: 'store', subscriptions: 'subscriptions', teams: 'teams',
    widgets: 'widgets', oauth2: 'oauth2_data', 'remote-auth': 'remote_auth', 'push-notifications': 'push_notifications',
    'read-state': 'read_state', reports: 'reports', rpc: 'rpc', threads: 'threads', 'voice-connections': 'voice_connections',
    'cloud-uploads': 'cloud_uploads', 'cloud-upload': 'cloud_uploads', verification: 'verification', 'billing-events': 'billing_events',
    'permission-calculations': 'permission_calculations', 'voice-gateway': 'voice_gateway', interactions: 'interactions',
  }
  return map[resource] ?? null
}

async function bodyOf(request: NextRequest): Promise<Item> {
  try { return await request.json() as Item } catch { return {} }
}

const guildResourceNames = new Set(['bans', 'stickers', 'scheduled-events', 'automod-rules', 'emojis', 'voice-states', 'onboarding'])
const guildResource = (name: string) => name === 'automod' ? 'automod-rules' : name
const validLimit = (value: string | null) => Math.min(Math.max(Number(value ?? 50) || 50, 1), 100)
const defaultSettingsProto = {
  versions: { settings: 1, client: 1 },
  inbox: { current_tab: 0, viewed_tutorial: false },
  guilds: { guilds: {}, leaderboards_disabled: false },
  user_content: { dismissed_contents: [], recurring_dismissible_content_states: {} },
  voice_and_video: { always_preview_video: false, afk_timeout: 60, stream_notifications_enabled: true, native_phone_integration_enabled: true, disable_stream_previews: false, soundmoji_volume: 100 },
  text_and_images: { use_thread_sidebar: true, show_command_suggestions: true, inline_attachment_media: true, inline_embed_media: true, gif_auto_play: true, render_embeds: true, render_reactions: true, animate_emoji: true, animate_stickers: 0 },
  notifications: { custom_status: 0, reaction: 0, game_activity: 0 },
  privacy: { friend_source_flags: 0, friend_discovery_flags: 0 },
  debug: {},
  game_library: {},
  status_settings: { custom_status: null },
  localization: { locale: 'en-US', timezone_offset: 0 },
  appearance: { theme: 'dark', ui_density: 0 },
  guild_folders: { folders: [] },
  favorites: {},
  audio_context_settings: {},
  communities: {},
  broadcast: {},
  clips: {},
  for_later: {},
  safety_settings: {},
  icymi_settings: {},
  applications: {},
  ads: {},
  in_app_feedback_settings: {},
  app_version_settings: {},
  locale: 'en-US',
  theme: 'dark',
  status: 'online',
  afk_timeout: 600,
  animate_emoji: true,
  animate_stickers: 0,
  render_embeds: true,
  render_reactions: true,
  inline_attachment_media: true,
  inline_embed_media: true,
  gif_auto_play: true,
  message_display_compact: false,
  view_nsfw_guilds: false,
  view_nsfw_commands: false,
  convert_emoticons: true,
  expression_suggestions_enabled: true,
  include_stickers_in_autocomplete: false,
  include_soundmoji_in_autocomplete: true,
  soundboard_picker_collapsed_sections: [],
  search_provider: 0,
  timestamp_hour_cycle: 0,
  ui_density: 0,
}
const settingVersion = (value: string | undefined) => value && /^\d+$/.test(value) ? value : '1'
const encodeProto = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
const decodeProto = (value: string) => {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1) return null
  const decoded = Buffer.from(value, 'base64')
  try {
    const parsed = JSON.parse(decoded.toString('utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Item : null
  } catch {
    // Private Discord protobuf schemas are not part of this project. Keep
    // binary payloads opaque but valid so clients can round-trip them.
    return decoded.length > 0 ? { raw_base64: value } : null
  }
}
const requiredString = (input: Item, field: string) => typeof input[field] === 'string' && String(input[field]).trim().length > 0
const requiredArray = (input: Item, field: string) => Array.isArray(input[field])
const isIsoDate = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const itemPage = (items: Item[], query: URLSearchParams) => {
  let result = items
  const before = query.get('before'); const after = query.get('after')
  if (before) result = result.filter((item) => String(item.id) < before)
  if (after) result = result.filter((item) => String(item.id) > after)
  return result.slice(0, validLimit(query.get('limit')))
}
const invalidUploadData = (value: unknown) => typeof value === 'string' && decodeBase64(value) === null
function decodeBase64(value: string) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1) return null
  try { return Buffer.from(value, 'base64') } catch { return null }
}
function validateEmoji(input: Item) {
  if (!requiredString(input, 'name') || String(input.name).length > 32) return 'name is required and must be 1-32 characters'
  if (!requiredString(input, 'image')) return 'image is required'
  if (!String(input.image).startsWith('data:image/')) return 'image must be a data URI'
  return null
}
function validateAutoModRule(input: Item) {
  if (!requiredString(input, 'name')) return 'name is required'
  if (!Number.isInteger(input.event_type) || ![1, 2].includes(Number(input.event_type))) return 'event_type must be 1 or 2'
  if (!Number.isInteger(input.trigger_type) || Number(input.trigger_type) < 1) return 'trigger_type must be an integer'
  if (!requiredArray(input, 'actions')) return 'actions must be an array'
  if (input.enabled !== undefined && typeof input.enabled !== 'boolean') return 'enabled must be boolean'
  return null
}
function validateScheduledEvent(input: Item) {
  if (!requiredString(input, 'name')) return 'name is required'
  if (!isIsoDate(input.scheduled_start_time)) return 'scheduled_start_time must be an ISO date'
  if (![1, 2, 3].includes(Number(input.entity_type))) return 'entity_type must be 1, 2, or 3'
  if (Number(input.entity_type) === 3 && !isIsoDate(input.scheduled_end_time)) return 'scheduled_end_time is required for external events'
  return null
}
function validateThread(input: Item) {
  if (!requiredString(input, 'name') || String(input.name).length > 100) return 'name is required and must be 1-100 characters'
  if (input.auto_archive_duration !== undefined && ![60, 1440, 4320, 10080].includes(Number(input.auto_archive_duration))) return 'invalid auto_archive_duration'
  if (input.type !== undefined && ![10, 11, 12].includes(Number(input.type))) return 'type must be 10, 11, or 12'
  return null
}
function validateReport(input: Item) {
  if (input.type === undefined || !['string', 'number'].includes(typeof input.type)) return 'type is required'
  if (!requiredString(input, 'reason') && !requiredString(input, 'description')) return 'reason or description is required'
  return null
}
function validateAI(input: Item) {
  if (!requiredString(input, 'model')) return 'model is required'
  if (!requiredString(input, 'prompt')) return 'prompt is required'
  if (String(input.prompt).length > 10000) return 'prompt must be 10000 characters or fewer'
  return null
}
function validateCheckpoint(input: Item) {
  if (!requiredString(input, 'name')) return 'name is required'
  if (input.metadata !== undefined && (typeof input.metadata !== 'object' || input.metadata === null || Array.isArray(input.metadata))) return 'metadata must be an object'
  return null
}
function validateCaptcha(input: Item) {
  if (!requiredString(input, 'challenge_id')) return 'challenge_id is required'
  if (!requiredString(input, 'captcha_key') && !requiredString(input, 'token')) return 'captcha_key or token is required'
  return null
}
function validateClientDistribution(input: Item) {
  if (!requiredString(input, 'platform')) return 'platform is required'
  if (!requiredString(input, 'version')) return 'version is required'
  if (input.download_url !== undefined && (!requiredString(input, 'download_url') || !isHttpUrl(String(input.download_url)))) return 'download_url must be an HTTP(S) URL'
  return null
}
function validateVerification(input: Item, channel: string) {
  const field = channel === 'phone' ? 'phone' : 'email'
  if (!requiredString(input, field)) return `${field} is required`
  if (channel === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(input[field]))) return 'email must be valid'
  if (channel === 'phone' && !/^\+?[0-9 ()-]{7,20}$/.test(String(input[field]))) return 'phone must be valid'
  return null
}
function validatePush(input: Item) {
  if (!requiredString(input, 'token')) return 'token is required'
  if (!requiredString(input, 'platform')) return 'platform is required'
  if (!['ios', 'android', 'web', 'desktop'].includes(String(input.platform).toLowerCase())) return 'unsupported platform'
  return null
}
function validateRpc(input: Item) {
  if (!requiredString(input, 'method') && !requiredString(input, 'command')) return 'method or command is required'
  return null
}
function validateVoiceConnection(input: Item) {
  if (!requiredString(input, 'guild_id')) return 'guild_id is required'
  if (!requiredString(input, 'channel_id')) return 'channel_id is required'
  return null
}
function validateGatewayIdentify(input: Item) {
  if (!requiredString(input, 'token')) return 'token is required'
  if (input.intents !== undefined && (!Number.isInteger(input.intents) || Number(input.intents) < 0)) return 'intents must be a non-negative integer'
  if (input.properties !== undefined && (typeof input.properties !== 'object' || input.properties === null || Array.isArray(input.properties))) return 'properties must be an object'
  return null
}
function validateRemoteAuthRegister(input: Item) {
  if (!requiredString(input, 'public_key') && !requiredString(input, 'device_id') && !requiredString(input, 'client_id')) return 'public_key, device_id, or client_id is required'
  return null
}
function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
function parsePermissionValue(value: unknown) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (typeof value === 'string' && /^\d+$/.test(value)) return value
  return null
}
function calculatePermissions(input: Item) {
  const base = input.base_permissions ?? input.permissions ?? 0
  const parsedBase = parsePermissionValue(base)
  if (parsedBase === null) return null
  let permissions = Number(parsedBase)
  for (const role of Array.isArray(input.roles) ? input.roles : []) {
    const value = typeof role === 'object' && role !== null ? (role as Item).permissions : role
    const normalized = String(value).toLowerCase()
    if (normalized === 'administrator' || normalized === '8') permissions |= 8
    if (normalized === 'manage_guild' || normalized === '32') permissions |= 32
    if (normalized === 'manage_channels' || normalized === '16') permissions |= 16
  }
  if (permissions === 0) permissions = 1024 | 2048
  return String(permissions)
}
function validateSignature(input: Item) {
  if (!requiredString(input, 'signature')) return 'signature is required'
  if (!requiredString(input, 'timestamp')) return 'timestamp is required'
  if (input.body !== undefined && typeof input.body !== 'string') return 'body must be a string'
  return null
}
function validateInteractionHeaders(request: NextRequest) {
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')
  if (!signature || !/^[0-9a-f]{128}$/i.test(signature)) return 'x-signature-ed25519 must be a 128-character hexadecimal value'
  if (!timestamp || !/^\d+$/.test(timestamp)) return 'x-signature-timestamp must be a Unix timestamp'
  return null
}
const collectionItems = async (name: keyof Omit<import('@/lib/discord-store').Database, 'guilds'>, query: URLSearchParams) => itemPage(await listCollection(name), query)
const verificationChannel = (value: string | undefined) => value === 'phone' || value === 'phone-verification' ? 'phone' : 'email'
const maskedValue = (value: string, channel: string) => channel === 'phone' ? `${value.slice(0, 3)}***${value.slice(-2)}` : value.replace(/^(.{2})[^@]*(@.*)$/, '$1***$2')
const publicUserSetting = (value: Item) => {
  const { id: _id, user_id: _userId, ...settings } = value
  return settings
}
const userSettingCollection = ['user_settings', 'email_settings', 'notification_settings', 'user_consents'] as const
type UserSettingCollection = typeof userSettingCollection[number]

async function getUserSetting(collection: UserSettingCollection, userId: string) {
  return (await listCollection(collection)).find((item) => item.user_id === userId)
}

async function saveUserSetting(collection: UserSettingCollection, userId: string, input: Item) {
  const existing = await getUserSetting(collection, userId)
  const defaults = collection === 'user_settings'
    ? cloneDefaultUserSettings()
    : collection === 'email_settings'
      ? { initialized: true, categories: {} }
      : collection === 'notification_settings'
        ? { flags: 0 }
        : {}
  const value = { ...defaults, ...(existing ?? {}), ...input, user_id: userId }
  return existing
    ? updateCollectionItem(collection, String(existing.id), value)
    : createCollectionItem(collection, value)
}

async function saveGuildSetting(userId: string, guildId: string, input: Item) {
  const existing = (await listCollection('user_guild_settings')).find((item) => item.user_id === userId && item.guild_id === guildId)
  const value = { ...(existing ?? DEFAULT_USER_GUILD_SETTINGS(userId, guildId)), ...input, user_id: userId, guild_id: guildId }
  return existing
    ? updateCollectionItem('user_guild_settings', String(existing.id), value)
    : createCollectionItem('user_guild_settings', value)
}

async function getGuildSetting(userId: string, guildId: string) {
  return (await listCollection('user_guild_settings')).find((item) => item.user_id === userId && item.guild_id === guildId)
    ?? DEFAULT_USER_GUILD_SETTINGS(userId, guildId)
}

async function guildArray(guildId: string, name: string) {
  const guild = await getGuild(guildId)
  if (!guild) return null
  return Array.isArray(guild[guildResource(name)]) ? guild[guildResource(name)] as Item[] : []
}

async function saveGuildArray(guildId: string, name: string, values: Item[]) {
  return updateGuild(guildId, { [guildResource(name)]: values })
}

function validationError(message: string) { return error(50035, message, 400) }
async function validateAuthorization(request: NextRequest) {
  const value = request.headers.get('authorization')
  const token = value?.replace(/^(Bearer|Bot)\s+/i, '') ?? 'anonymous'
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const state = await consumeRateLimit(`${request.nextUrl.pathname}:${tokenHash}`)
  if (!state.allowed) {
    const response = error(20016, 'You are being rate limited.', 429)
    response.headers.set('Retry-After', state.retryAfter.toFixed(3))
    response.headers.set('X-RateLimit-Limit', String(state.limit))
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset-After', state.retryAfter.toFixed(3))
    response.headers.set('X-RateLimit-Bucket', 'discord-http-mock')
    return response
  }
  return null
}

function gatewayData(input: Item) {
  return input.d && typeof input.d === 'object' && !Array.isArray(input.d) ? input.d as Item : input
}

async function identifyGateway(currentUser: string, input: Item) {
  const problem = validateGatewayIdentify(input); if (problem) return validationError(problem)
  const session = await createCollectionItem('sessions', {
    user_id: currentUser,
    token_hint: `${String(input.token).slice(0, 4)}***`,
    status: 'identified',
    heartbeat_interval: 41250,
    sequence: 0,
    intents: Number(input.intents ?? 0),
    properties: input.properties ?? {},
    presence: input.presence ?? null,
    events: [],
    created_at: now(),
  })
  return json({
    op: 0,
    t: 'READY',
    s: 0,
    d: {
      v: 10,
      session_id: session.id,
      resume_gateway_url: '/api/v10/gateway',
      user: { id: currentUser, username: 'api-bot', discriminator: '0000', bot: true },
      guilds: [],
      private_channels: [],
      session_type: 'normal',
    },
  })
}

async function resumeGateway(input: Item) {
  if (!requiredString(input, 'session_id')) return validationError('session_id is required')
  const sequence = Number.isInteger(input.seq) && Number(input.seq) >= 0 ? Number(input.seq) : undefined
  const session = await updateCollectionItem('sessions', String(input.session_id), {
    ...(sequence === undefined ? {} : { sequence }),
    status: 'resumed',
    resumed_at: now(),
  })
  return session ? json({ op: 6, s: sequence ?? Number(session.sequence ?? 0), d: { resumed: true, session_id: input.session_id } }) : error(10013, 'Unknown session', 404)
}

async function heartbeatGateway(input: Item) {
  if (!requiredString(input, 'session_id')) return validationError('session_id is required')
  const sequence = Number.isInteger(input.seq) && Number(input.seq) >= 0 ? Number(input.seq) : undefined
  const session = await updateCollectionItem('sessions', String(input.session_id), {
    ...(sequence === undefined ? {} : { sequence }),
    last_heartbeat_at: now(),
    status: 'alive',
  })
  return session ? json({ op: 11, d: null, acknowledged: true, session_id: input.session_id }) : error(10013, 'Unknown session', 404)
}

/* ---------------------------------------------------------------------------
 * Store catalog
 *
 * The Discord client (Nitro panel, gift flows and store settings) requests
 * these endpoints. Before this catalog existed,
 * /store/published-listings/skus/{sku.id}/subscription-plans fell through to
 * the generic collection handler and answered HTTP 500 / `Unknown store`,
 * which is exactly the failing request reported from the browser devtools.
 * ------------------------------------------------------------------------- */
const STORE_MONTH = 1
const STORE_YEAR = 2
const STORE_PUBLISHED_AT = '2026-01-01T00:00:00.000Z'

// Plan ids are the real Discord ones where they are public knowledge (the
// legacy Nitro monthly plan 511651871736201216 is the one the mocked
// subscription below points at, so the Nitro page can resolve it); the
// remaining plans fall back to a snowflake derived from their SKU.
type StorePlanTemplate = { id?: string; interval: number; interval_count: number; amount: number; label: string }
type StoreSkuTemplate = { id: string; name: string; slug: string; summary: string; description: string; plans: StorePlanTemplate[] }

const STORE_SKU_TEMPLATES: StoreSkuTemplate[] = [
  {
    id: '521847234246082599', name: 'Discord Nitro', slug: 'nitro', summary: 'Nitro monthly and yearly',
    description: 'Full Nitro membership with HD streaming, bigger uploads and two Server Boosts.',
    plans: [
      { id: '511651880837840896', interval: STORE_MONTH, interval_count: 1, amount: 999, label: 'Monthly' },
      { id: '511651885459963904', interval: STORE_YEAR, interval_count: 1, amount: 9999, label: 'Yearly' },
      { id: '642251038925127690', interval: STORE_MONTH, interval_count: 3, amount: 2499, label: '3 Months' },
      { id: '944037208325619722', interval: STORE_MONTH, interval_count: 6, amount: 4999, label: '6 Months' },
    ],
  },
  {
    id: '978380684370378762', name: 'Discord Nitro Basic', slug: 'nitro-basic', summary: 'Nitro Basic monthly and yearly',
    description: 'Nitro Basic membership with bigger uploads and custom emoji everywhere.',
    plans: [
      { id: '978380692553465866', interval: STORE_MONTH, interval_count: 1, amount: 299, label: 'Monthly' },
      { id: '1024422698568122368', interval: STORE_YEAR, interval_count: 1, amount: 2999, label: 'Yearly' },
    ],
  },
  {
    id: '521846918637420545', name: 'Discord Nitro Classic', slug: 'nitro-classic', summary: 'Legacy Nitro Classic',
    description: 'Legacy Nitro Classic membership kept for compatibility.',
    plans: [
      { id: '511651871736201216', interval: STORE_MONTH, interval_count: 1, amount: 499, label: 'Monthly' },
      { id: '511651876987469824', interval: STORE_YEAR, interval_count: 1, amount: 2999, label: 'Yearly' },
    ],
  },
  {
    id: '590663762298667008', name: 'Server Boost', slug: 'server-boost', summary: 'Server Boost subscriptions',
    description: 'Boost your favourite servers with Nitro perks.',
    plans: [
      { id: '590665532894740483', interval: STORE_MONTH, interval_count: 1, amount: 499, label: '1 Month' },
      { id: '590665538238152709', interval: STORE_YEAR, interval_count: 1, amount: 4999, label: '1 Year' },
      { id: '944037355453415424', interval: STORE_MONTH, interval_count: 3, amount: 1497, label: '3 Months' },
      { id: '944037391444738048', interval: STORE_MONTH, interval_count: 6, amount: 2994, label: '6 Months' },
    ],
  },
  {
    id: '628379670982688768', name: 'None', slug: 'none', summary: 'None tier',
    description: 'None tier',
    plans: [
      { id: '628379151761408000', interval: STORE_MONTH, interval_count: 1, amount: 0, label: 'Monthly' },
      { id: '628381571568631808', interval: STORE_YEAR, interval_count: 1, amount: 0, label: 'Yearly' },
      { id: '944265614527037440', interval: STORE_MONTH, interval_count: 3, amount: 0, label: '3 Months' },
      { id: '944265636643602432', interval: STORE_MONTH, interval_count: 6, amount: 0, label: '6 Months' },
    ],
  },
]

function storeSkuTemplate(skuId: string): StoreSkuTemplate {
  return STORE_SKU_TEMPLATES.find((template) => template.id === skuId) ?? {
    id: skuId,
    name: 'Discord Store Item',
    slug: `sku-${skuId}`,
    summary: 'Mock store item',
    description: 'Mock store item served by the local Discord API.',
    plans: [{ interval: STORE_MONTH, interval_count: 1, amount: 499, label: 'Monthly' }],
  }
}

function snowflakeWithOffset(value: string, offset: number) {
  return /^\d+$/.test(value) ? (BigInt(value) + BigInt(offset)).toString() : `${value}-${offset}`
}

function storeSkuResource(skuId: string) {
  const template = storeSkuTemplate(skuId)
  return {
    id: template.id,
    type: 1,
    application_id: null,
    application: null,
    product_line: 1,
    product_id: null,
    flags: 0,
    name: template.name,
    summary: template.summary,
    description: template.description,
    legal_notice: null,
    slug: template.slug,
    thumbnail_asset_id: null,
    dependent_sku_id: null,
    access_type: 1,
    features: [],
    genres: [],
    available_regions: ['us', 'es', 'gb'],
    locales: ['en-US', 'es-ES'],
    price_tier: 0,
    created_at: STORE_PUBLISHED_AT,
    deleted_at: null,
  }
}

/* ---------------------------------------------------------------------------
 * Subscription plan pricing
 *
 * `SubscriptionPlan.createFromServer()` on the client walks `plan.prices`
 * (an object keyed by payment source *type*) and reads
 * `<entry>.country_prices.country_code` plus `<entry>.payment_source_prices`.
 * While this mock answered a flat `{ usd: { amount, currency } }` map, that
 * reduce callback dereferenced `undefined` and aborted
 * SUBSCRIPTION_PLANS_FETCH_SUCCESS with
 * `TypeError: Cannot read properties of undefined (reading 'country_code')`.
 * The Nitro member hub then had no plan/dates for the active subscription and
 * its render blew up with `RangeError: Invalid time value`.
 * ------------------------------------------------------------------------- */
const STORE_PLAN_CURRENCY = 'eur'
const STORE_PLAN_EXPONENT = 2
const STORE_PLAN_COUNTRY_CODE = 'ES'
const STORE_MOCK_PAYMENT_SOURCE_ID = '500000000000000001'
const STORE_PAYMENT_SOURCE_TYPES = [0, 1, 2, 3, 4, 5]

function storePrice(amount: number, currency = 'eur') {
  return { currency, amount, exponent: STORE_PLAN_EXPONENT }
}

function storePricesFor(amount: number) {
  const prices: Record<string, unknown> = {}
  for (const type of STORE_PAYMENT_SOURCE_TYPES) {
    prices[String(type)] = {
      country_prices: {
        country_code: 'ES',
        prices: [
          storePrice(amount, 'eur'),
          storePrice(amount, 'usd'),
        ],
      },
      payment_source_prices: {
        [STORE_MOCK_PAYMENT_SOURCE_ID]: [
          storePrice(amount, 'eur'),
          storePrice(amount, 'usd'),
        ],
      },
    }
  }
  return prices
}

function storeSubscriptionPlansFor(skuIds: string[]) {
  const ids = skuIds.length > 0 ? skuIds : STORE_SKU_TEMPLATES.map((template) => template.id)
  return ids.flatMap((skuId) => storeSkuTemplate(skuId).plans.map((_plan, index) => storeSubscriptionPlan(skuId, index)))
}

// `/users/@me/billing/subscription-plans` and the Nitro store accept `sku_ids`
// (comma separated, repeatable) or `skus`.
function skuIdsFromQuery(query: URLSearchParams) {
  return [...query.getAll('sku_ids'), ...query.getAll('skus'), `${query.get('skus') ?? query.get('sku_ids') ?? ''}`]
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
}

function storeSubscriptionPlan(skuId: string, index: number) {
  const template = storeSkuTemplate(skuId)
  const plan = template.plans[index] ?? template.plans[0]
  const id = plan.id ?? snowflakeWithOffset(skuId, index + 1)
  return {
    id,
    sku_id: template.id,
    name: `${template.name} — ${plan.label}`,
    description: template.description,
    sku: storeSkuResource(skuId),
    interval: plan.interval,
    interval_count: plan.interval_count,
    tax_inclusive: true,
    price: plan.amount,
    price_tier: 0,
    currency: STORE_PLAN_CURRENCY,
    prices: storePricesFor(plan.amount),
    discounts: [],
    trial_period_days: null,
    fallback_plan_id: null,
    tenant_metadata: { subscription_plan_group_id: snowflakeWithOffset(skuId, 1000) },
    created_at: STORE_PUBLISHED_AT,
    published_at: STORE_PUBLISHED_AT,
    deleted_at: null,
  }
}

function storeListingResource(skuId: string) {
  const template = storeSkuTemplate(skuId)
  const plans = template.plans.map((_plan, index) => storeSubscriptionPlan(skuId, index))
  return {
    id: snowflakeWithOffset(skuId, 200),
    application_id: null,
    sku_flags: 0,
    published: true,
    name: template.name,
    description: template.description,
    price_tier: 0,
    sku: storeSkuResource(skuId),
    subscription_listings_ids: [skuId],
    subscription_listings: [
      {
        id: skuId,
        application_id: null,
        published: true,
        soft_deleted: false,
        sku_flags: 0,
        image_asset: null,
        subscription_plans: plans,
        store_listing_benefits: [],
      },
    ],
    subscription_plans: plans,
  }
}

function storeListingsFor(skuIds: string[]) {
  const ids = skuIds.length > 0 ? skuIds : STORE_SKU_TEMPLATES.map((template) => template.id)
  return ids.map((skuId) => storeListingResource(skuId))
}

// `/store/published-listings/subscriptions/{listing.id}` addresses a listing by
// the id generated in storeListingResource (`{sku_id} + 200`), so it has to be
// resolved back to its SKU before answering listings or subscription plans.
function skuIdFromListingId(listingId: string) {
  return STORE_SKU_TEMPLATES.find((template) => snowflakeWithOffset(template.id, 200) === listingId)?.id ?? listingId
}

/* ---------------------------------------------------------------------------
 * Stable defaults for background endpoints
 *
 * The client fetches these in parallel while it boots and while the user opens
 * settings panels. They used to fall through to the generic handler and answer
 * 404 objects, which the client's stores iterate (`TypeError: e is not
 * iterable`) and turn into a full-screen error page.
 * ------------------------------------------------------------------------- */
const USER_ME_DEFAULTS: Record<string, unknown> = {
  harvest: {},
  survey: {},
  devices: [],
  'application-identities': { identities: [], application_identities: [], profiles: [], users: [], applications: [] },
  'application-identities/v2': { identities: [], application_identities: [], profiles: [], users: [], applications: [] },
  'mfa/webauthn/credentials': [],
  'mfa/totp': {},
  mfa: {},
  'burst-credits': { credits: [] },
  'country-codes': [],
  'virtual-currency/balance': { balance: 0, virtual_currency_balance: 0, virtual_currency: { balance: 0 } },
  'collectibles-marketing': { marketings: [], collectibles_marketing: [] },
  'meaningfully-online': {},
  'referrals/eligibility': { eligible: false, referral_code: null },
  referrals: {},
  'gift-intents': [],
  'payment-sources': [],
  'billing-events': [],
  'billing/payment-sources': [],
  'billing/subscriptions': [],
  'billing/invoices': [],
  applications: [],
  activities: [],
  'guardian-consent-requests': [],
  'restricted-guilds': [],
  'safety-hub/classifications': [],
  clan: { identity_guild_id: null, identity_enabled: false },
  notes: {},
  'badges/settings': {},
  'custom-themes': [],
  'guilds/premium/subscriptions': [],
  'guilds/premium/subscription-slots': [
    {
      id: '700000000000000001',
      subscription_id: '600000000000000001',
      premium_guild_subscription: null,
      canceled: false,
      cooldown_ends_at: null,
    },
    {
      id: '700000000000000002',
      subscription_id: '600000000000000001',
      premium_guild_subscription: null,
      canceled: false,
      cooldown_ends_at: null,
    },
  ],
  'guilds/premium/subscriptions/cooldown': { cooldown_ends_at: null },
  'guilds/integration-application-ids': [],
  'join-request-guilds': [],
  library: [],
  'linked-users': [],
  'parental-consent/warning': {},
  'partner-perks': [],
  'perks-demos': [],
  'premium-group/membership': {},
  'premium-group/invites': [],
  'premium-usage': {},
  'program-rewards': [],
  'scheduled-events': [],
  'scheduled-messages': [],
  'tenure-reward/sync': {},
  'unclaimed-games': [],
  'valid-collectibles-gift-recipients-batch': [],
  widgets: [],
  'wishlist/items': [],
  'quickswitcher': {},
  'presences': [],
  'sessions': [],
}

function userMeDefaults(subresource: string, subId: string | undefined, subpath?: string) {
  if (subpath && subpath in USER_ME_DEFAULTS) return USER_ME_DEFAULTS[subpath]
  const key = subId ? `${subresource}/${subId}` : subresource
  if (key in USER_ME_DEFAULTS) return USER_ME_DEFAULTS[key]
  if (subresource in USER_ME_DEFAULTS) return USER_ME_DEFAULTS[subresource]
  // Unknown panels: an empty list keeps `for..of`/`.map` working client-side.
  return []
}

/* ---------------------------------------------------------------------------
 * Content inventory feed
 *
 * ContentInventoryActivityStore (the player activity feed shown on profiles)
 * reads `GET /content-inventory/users/@me` and does `for (const entry of
 * body.entries)`; it then reschedules itself from `wait_ms_until_next_fetch` /
 * `expired_at`. While this mock answered the previous 404 object (or a bare
 * `[]`), `entries` was undefined, so the client logged
 * `TypeError: e is not iterable` for every channel it opened and - because
 * `expired_at` was unusable too - re-issued the request in a tight loop that
 * spammed client-errors.log. The envelope below mirrors the real payload of
 * https://discord.com/api/v9/content-inventory/users/@me, so the store iterates
 * an empty feed and waits an hour before refreshing again.
 * ------------------------------------------------------------------------- */
const CONTENT_INVENTORY_REFRESH_MS = 3_600_000

function contentInventoryFeed() {
  return {
    request_id: id(),
    entries: [],
    entries_hash: 0,
    expired_at: new Date(Date.now() + CONTENT_INVENTORY_REFRESH_MS).toISOString(),
    refresh_stale_inbox_after_ms: 30_000,
    refresh_token: id(),
    wait_ms_until_next_fetch: CONTENT_INVENTORY_REFRESH_MS,
  }
}

const MISC_GET_DEFAULTS: Record<string, unknown> = {
  'games/autocomplete': [],
  'games/detectable/exclusions': [],
  'games/detectable': [],
  'partner-sdk/storefront-config': { config: {}, skus: [], published_listings: [] },
  // The client indexes these lists, so they must stay JSON arrays (an object
  // here produces `TypeError: e.body.map is not a function` client side).
  'storefront/promotions': [],
  'storefront/featured': [],
  'widget-configs/featured': [],
  'applications/detectable': [],
  'application-directory/applications': [],
}

function miscGetDefault(resource: string | undefined, resourceId: string | undefined, subresource: string | undefined, subId: string | undefined, action: string | undefined) {
  const key = [resource, resourceId, subresource, subId, action].filter((value): value is string => typeof value === 'string' && value.length > 0).join('/')
  if (key in MISC_GET_DEFAULTS) return MISC_GET_DEFAULTS[key]
  // `/discovery/{guild.id}` feeds the app-discovery ("content inventory") store,
  // which iterates the response and crashed on the previous 404 object.
  if (resource === 'discovery' && resourceId) return { guild: null, primary_category_id: 1, categories: [], category_ids: [], guilds: [], feed: [], items: [] }
  if (resource === 'metrics' || resource === 'science') return {}
  return undefined
}

/* ---------------------------------------------------------------------------
 * Experiments helpers
 *
 * A fingerprint/installation id look like `{snowflake}.{hash}` and the Apex
 * payload has to carry one so the client can persist it (see
 * docs.discord.food -> Topics -> Experiments -> Fingerprints/Installations).
 * The apex assignment below uses a name that cannot collide with a real
 * experiment, so the mock never silently enables client features.
 * ------------------------------------------------------------------------- */
const MOCK_FINGERPRINT = '900000000000000001.mockfingerprint'
const MOCK_INSTALLATION_ID = '900000000000000002.mockinstallation'
const MOCK_APEX_EXPERIMENT = 'apex_mock_noop'

async function handleGet(request: NextRequest, { params }: Params) {
  const authError = await validateAuthorization(request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId, action, extraAction] = path
  const query = request.nextUrl.searchParams
  const currentUser = getUserIdFromAuth(request)

  // Store endpoints used by the Nitro panel, the gift flows and store settings.
  if (resource === 'store') {
    const requestedSkus = skuIdsFromQuery(query)
    if (resourceId === 'published-listings' && subresource === 'skus' && subId) {
      const listing = storeListingResource(subId)
      if (action === 'subscription-plans') return json(listing.subscription_listings[0].subscription_plans)
      return json(listing)
    }
    if (resourceId === 'published-listings' && subresource === 'subscriptions' && subId) {
      const listing = storeListingResource(skuIdFromListingId(subId))
      if (action === 'subscription-plans') return json(listing.subscription_listings[0].subscription_plans)
      return json(listing)
    }
    if (resourceId === 'published-listings' && subresource === 'skus') return json(storeListingsFor(requestedSkus))
    if (resourceId === 'published-listings') return json(storeListingsFor(requestedSkus))
    if (resourceId === 'skus' && subresource && subId === 'purchase') {
      const skuId = subresource
      const planId = query.get('subscription_plan_id') || (skuId === '978380684370378762' ? '978380692553465866' : '511651880837840896')
      const isBasic = skuId === '978380684370378762' || planId === '978380692553465866' || planId === '1024422698568122368'
      const isClassic = skuId === '521846918637420545' || planId === '511651871736201216' || planId === '511651876987469824'
      const isYearly = planId === '1024422698568122368' || planId === '511651885459963904' || planId === '511651876987469824'
      const price = isYearly ? (isBasic ? 2999 : isClassic ? 2999 : 9999) : (isBasic ? 299 : isClassic ? 499 : 999)
      return json({
        id: '700000000000000001',
        invoice_items: [
          {
            id: '700000000000000002',
            subscription_plan_id: planId,
            subscription_plan_price: price,
            amount: price,
            quantity: 1,
            discounts: [],
            unit_price: { amount: price, currency: 'eur' },
            tax: 0,
            sku_id: skuId,
          },
        ],
        total: price,
        subtotal: price,
        currency: 'eur',
        tax: 0,
        tax_inclusive: true,
        subscription_period_start: now(),
        subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 1,
      })
    }
    if (resourceId === 'skus' && subresource && !subId) return json(storeSkuResource(subresource))
    if (resourceId === 'skus' && !subresource) {
      const ids = requestedSkus.length > 0 ? requestedSkus : STORE_SKU_TEMPLATES.map((template) => template.id)
      return json(ids.map((skuId) => storeSkuResource(skuId)))
    }
    if (resourceId === 'storefront') return json({ published_listings: storeListingsFor([]), skus: [] })
  }

  /* ---------------------------------------------------------------------------
   * Promotions
   *
   * https://docs.discord.food/resources/promotion: `/promotions`,
   * `/bogo-promotions`, `/outbound-promotions` and
   * `/users/@me/outbound-promotions/codes` all answer with a plain JSON list,
   * and the client iterates the response body itself (PromotionsStore's
   * ACTIVE_PROMOTIONS_FETCH_SUCCESS handler runs `body.forEach`). Answering the
   * catch-all object made the Nitro hub throw
   * `TypeError: t.forEach is not a function`.
   * ------------------------------------------------------------------------- */
  if (resource === 'promotions' || resource === 'bogo-promotions' || resource === 'outbound-promotions') return json([])
  if (resource === 'users' && resourceId === '@me' && subresource === 'outbound-promotions') return json([])
  // El cliente pide también las promociones del storefront por aplicación; sin
  // esta rama caía en el catch-all y PromotionsStore volvía a romper.
  if (resource === 'storefront' && resourceId === 'promotions') return json([])

  /* ---------------------------------------------------------------------------
   * Respuestas cuyo CONTENEDOR importa tanto como el contenido
   *
   * El cliente no siempre hace `body.map`/`body.forEach` sobre el cuerpo: hay
   * stores que leen una propiedad concreta
   * (`Cannot read properties of undefined (reading 'length' | 'map' |
   * 'reduce')`) y otros que recorren una lista anidada
   * (`TypeError: i.applications is not iterable`). En esos casos un `[]`
   * genérico rompe el store igual que un objeto: la propiedad esperada no
   * existe. Se devuelven por eso objetos con la(s) clave(s) que el cliente
   * consume, todas como listas vacías (las claves de más son ignoradas).
   * ------------------------------------------------------------------------- */
  if (resource === 'users' && resourceId === '@me' && subresource === 'application-command-index') {
    return json({ applications: [], application_commands: [], version: `${Date.now()}` })
  }
  if (resource === 'guilds' && resourceId && subresource === 'application-command-index') {
    return json({ applications: [], application_commands: [], version: `${Date.now()}` })
  }
  if (path.includes('top-games')) {
    return json({ top_games: [] })
  }
  if (path.includes('top-emojis')) {
    return json({ items: [], emojis: [], top_emojis: [] })
  }
  if (resource === 'family-center') {
    if (resourceId === '@me' && !subresource) {
      return json({
        teen_audit_log: null,
        linked_users: [],
        users: [],
        age_group: null,
      })
    }
    if (subresource === 'link-code') {
      return json({ link_code: '000000' })
    }
    if (resourceId === 'connection-prerequisites') {
      return json({ prerequisites: [] })
    }
    return json({})
  }
  if (resource === 'sticker-packs' && resourceId && resourceId !== 'directory-v2') {
    return json({
      id: resourceId,
      name: 'Wumpus Beyond',
      sku_id: '753016829956423701',
      description: 'Take your Nitro expressiveness beyond with Wumpus!',
      stickers: [],
      cover_sticker_id: null
    })
  }
  if (resource === 'stickers' && resourceId) {
    return json({
      id: resourceId,
      pack_id: '753016829956423700',
      name: 'Wumpus',
      description: '',
      tags: 'wumpus',
      type: 1,
      format_type: 1,
      available: true
    })
  }
  if (resource === 'widget-configs' && resourceId === 'featured') {
    return json({ widget_configs: [], featured: [], featured_widget_configs: [], configs: [], applications: [] })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'mfa' && subId === 'webauthn' && action === 'credentials') {
    // El cliente hace `body.map`: debe ser un array plano, no un objeto.
    return json([])
  }
  if (resource === 'users' && resourceId && subresource === 'application-identities') {
    // El cliente lee `body.identities` (USER_APPLICATION_IDENTITY_FETCH_USER_SUCCESS
    // -> `identities` -> `.map`). Devolviendo sólo `application_identities` la
    // store de identidades reventaba con "Cannot read properties of undefined
    // (reading 'map')" al abrir perfiles.
    return json({ identities: [], application_identities: [], profiles: [], users: [], applications: [] })
  }
  // /promotions -> /users/@me/outbound-promotions ya está arriba; los enlaces de
  // afiliación y las suscripciones premium de un gremio también son listas.
  if (resource === 'guilds' && resourceId && subresource === 'premium' && subId === 'subscriptions') return json([])
  if (resource === 'applications' && resourceId === 'detectable') return json([])
  // `GET /applications/{id}/skus`: el cliente lo recorre con `for (const sku of
  // body)` en SKUS_FETCH_SUCCESS, así que la respuesta debe ser una LISTA. Al caer
  // en el objeto genérico lanzaba "TypeError: n is not iterable" y se llevaba por
  // delante la tienda, la wishlist y los regalos (parte de las "funciones Nitro").
  if (resource === 'applications' && resourceId && subresource === 'skus') return json([])

  /* ---------------------------------------------------------------------------
   * Experiments (legacy) and Apex experiments
   *
   * docs.discord.food -> Topics -> Experiments documents the contracts:
   *   GET /experiments               -> { fingerprint?, assignments: [assignment],
   *                                       guild_experiments?: [assignment] }
   *   GET /apex/experiments?surface= -> apex experiments object (+ installation,
   *                                       which carries the new installation id)
   *   GET /apex/experiments/metadata -> { experiments: [metadata] }
   *
   * Note the Apex URL: it is `/apex/experiments`, not `/apex-experiments`, so the
   * client's request used to fall through to the catch-all and receive an ARRAY.
   * ExperimentStore and ApexExperimentStore then threw inside the client's boot
   * wait-queue (EXPERIMENTS_FETCH_SUCCESS -> `TypeError: e is not iterable`,
   * APEX_EXPERIMENTS_FETCH_SUCCESS -> `Cannot read properties of undefined
   * (reading '1')`) and the promise chain that finishes app initialisation was
   * rejected: friends, member list, settings, DMs and the Nitro panel all stayed
   * dead at once. These branches have to stay ahead of the generic collection
   * handler below.
   * ------------------------------------------------------------------------- */
  if (resource === 'experiments' || resource === 'apex-experiments' || resource === 'apex_experiments') {
    return json({
      fingerprint: MOCK_FINGERPRINT,
      assignments: [],
      guild_experiments: [],
      apex_experiments: [],
      experiments: [],
      installation: MOCK_INSTALLATION_ID,
      ttl: 0,
      hash: 'mock',
      preload: false,
    })
  }
  if (resource === 'apex' && resourceId === 'experiments') {
    if (subresource === 'metadata') return json({ experiments: [] })
    // `assignments` stays a real array of [name, bucket] pairs: the client both
    // destructures it and indexes it (`assignments[...][1]`), so an absent value
    // is what produced `Cannot read properties of undefined (reading '1')`. The
    // single pair is a no-op name that cannot collide with a real experiment.
    return json({
      assignments: [[MOCK_APEX_EXPERIMENT, 1]],
      apex_experiments: [[MOCK_APEX_EXPERIMENT, 1]],
      experiments: [],
      installation: MOCK_INSTALLATION_ID,
    })
  }

  /* ---------------------------------------------------------------------------
   * Quests
   *
   * QuestsStore reads `/quests/@me` (the payload is an envelope with `quests` /
   * `excluded_quests`) and the guild/client ad placement resolvers read
   * `/quests/decision` and `/quests/get-decisions`. Before this branch existed
   * all of them hit the catch-all and answered 404 `Unknown quests`, which the
   * client reported as an unhandled rejection on every boot.
   * ------------------------------------------------------------------------- */
  if (resource === 'quests') {
    if (resourceId === '@me') return json({ quests: [], excluded_quests: [], excluded_quests_v2: [], quest_enrollment_blocked_until: null })
    if (resourceId === 'decision' || resourceId === 'get-decisions') return json({ decisions: [], quests: [] })
    if (resourceId) return error(10013, 'Unknown quest', 404)
    return json({ quests: [] })
  }

  if (resource === 'billing' && !resourceId) {
    return json({ country_code: 'US', currency: 'USD', payment_sources: (await listCollection('payment_sources')).length, subscriptions: (await listCollection('subscriptions')).length })
  }
  if (resource === 'billing' && resourceId && ['payment-sources', 'subscriptions', 'invoices', 'billing-events'].includes(resourceId)) {
    const names = { 'payment-sources': 'payment_sources', subscriptions: 'subscriptions', invoices: 'invoices', 'billing-events': 'billing_events' } as const
    const values = await collectionItems(names[resourceId as keyof typeof names], query)
    if (subresource) {
      const item = values.find((value) => value.id === subresource)
      return item ? json(item) : error(10013, `Unknown ${resourceId}`, 404)
    }
    return json(values)
  }
  if (resource === 'captcha' && resourceId === 'challenge') {
    const challengeId = query.get('challenge_id') ?? id()
    const existing = (await listCollection('captcha')).find((item) => item.id === challengeId)
    const challenge = existing ?? await createCollectionItem('captcha', {
      id: challengeId, provider: 'mock', sitekey: 'discord-mock', status: 'pending',
      expires_at: new Date(Date.now() + 300000).toISOString(),
    })
    return json(challenge)
  }
  if (resource === 'client-distribution' && resourceId) {
    const values = await listCollection('client_distribution')
    const item = values.find((value) => value.platform === resourceId || value.id === resourceId)
    return item ? json(item) : json({ platform: resourceId, version: 'stable', channel: 'stable', download_url: null })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'verification') {
    return json((await listCollection('verification')).filter((item) => item.user_id === currentUser))
  }
  if (resource === 'verification') {
    const values = await listCollection('verification')
    if (!resourceId) return json(itemPage(values, query))
    const item = values.find((value) => value.id === resourceId)
    return item ? json(item) : error(10013, 'Unknown verification', 404)
  }
  if (resource === 'permissions') {
    const guildId = query.get('guild_id') ?? undefined
    const userId = query.get('user_id') ?? currentUser
    const stored = (await listCollection('permission_calculations')).find((item) => item.guild_id === guildId && item.user_id === userId)
    return json(stored ?? { guild_id: guildId, user_id: userId, permissions: '0', source: 'mock' })
  }
  if (resource === 'guilds' && resourceId && subresource === 'permissions' && subId) {
    const stored = (await listCollection('permission_calculations')).find((item) => item.guild_id === resourceId && item.user_id === subId)
    return json(stored ?? { guild_id: resourceId, user_id: subId, permissions: '0', source: 'mock' })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'push-notifications') {
    return json((await listCollection('push_notifications')).filter((item) => item.user_id === currentUser))
  }
  if (resource === 'gateway' && resourceId === 'sessions' && subresource) {
    const session = (await listCollection('sessions')).find((item) => item.id === subresource)
    return session ? json(session) : error(10013, 'Unknown session', 404)
  }
  if (resource === 'gateway' && (resourceId === 'sessions' || resourceId === 'events')) {
    const requestedSession = query.get('session_id')
    const sessions = (await listCollection('sessions')).filter((item) => !requestedSession || item.id === requestedSession)
    if (resourceId === 'sessions') return json(sessions)
    const after = Number(query.get('after') ?? 0)
    const events = sessions.flatMap((item) => Array.isArray(item.events) ? item.events : [])
    return json(events.filter((item) => !Number.isInteger(after) || Number(item.s ?? 0) > after))
  }
  if (resource === 'voice-gateway') {
    const sessions = await listCollection('voice_gateway')
    return resourceId ? json(sessions.find((item) => item.id === resourceId) ?? error(10013, 'Unknown voice gateway session', 404)) : json(itemPage(sessions, query))
  }
  if (resource === 'remote-auth' && resourceId === 'v1') {
    const items = await listCollection('remote_auth')
    if (subresource === 'sessions') return json(itemPage(items, query))
    if (subresource) {
      const item = items.find((value) => value.id === subresource)
      return item ? json(item) : error(10013, 'Unknown remote auth session', 404)
    }
  }

  // Promotions: the client store iterates the payload directly, so list responses
  // have to stay plain arrays instead of the generic collection envelope.
  if (resource === 'users' && resourceId === '@me' && String(subresource ?? '').includes('promotion')) {
    return json(await listCollection('promotions'))
  }
  if (resource === 'promotions') {
    const stored = await listCollection('promotions')
    if (!resourceId || resourceId === 'active') return json(stored)
    const item = stored.find((value) => value.id === resourceId)
    return item ? json(item) : error(10013, 'Unknown promotion', 404)
  }


  if (resource === 'users' && resourceId === '@me' && (subresource === 'settings-proto' || subresource === 'settings_proto')) {
    const version = settingVersion(subId)
    const stored = (await listCollection('user_settings_proto')).find((item) => item.user_id === currentUser && item.version === version)
    const data = settingsProtoPayload(stored?.data)
    return json({ version, encoding: 'base64', data, settings: data })
  }
  if (resource === 'users' && resourceId === '@me' && (subresource === 'read-states' || subresource === 'read-state')) {
    const states = (await listCollection('read_state')).filter((item) => item.user_id === currentUser)
    if (subId) return json(states.find((item) => item.channel_id === subId) ?? { channel_id: subId, mention_count: 0, last_message_id: null, flags: 0 })
    return json(itemPage(states, query))
  }
  if (resource === 'guilds' && resourceId && subresource === 'audit-logs') {
    const entries = (await listCollection('audit_logs')).filter((item) => item.guild_id === resourceId)
    const filtered = entries.filter((item) => !query.get('user_id') || item.user_id === query.get('user_id'))
      .filter((item) => !query.get('action_type') || String(item.action_type) === query.get('action_type'))
    return json({ audit_log_entries: itemPage(filtered, query), users: [], webhooks: [] })
  }
  if (resource === 'guilds' && resourceId && subresource === 'auto-moderation' && subId === 'rules') {
    const rules = (await listCollection('automod_rules')).filter((item) => item.guild_id === resourceId)
    if (action) {
      const rule = rules.find((item) => item.id === action)
      return rule ? json(rule) : error(10011, 'Unknown Auto Moderation Rule', 404)
    }
    return json(itemPage(rules, query))
  }
  if (resource === 'guilds' && resourceId && subresource === 'scheduled-events') {
    const events = (await listCollection('scheduled_events')).filter((item) => item.guild_id === resourceId)
    if (subId) {
      const event = events.find((item) => item.id === subId)
      return event ? json(event) : error(10070, 'Unknown Scheduled Event', 404)
    }
    return json(itemPage(events, query))
  }
  if (resource === 'guilds' && resourceId && subresource === 'emojis') {
    const values = await guildArray(resourceId, 'emojis')
    if (!values) return error(10004, 'Unknown Guild', 404)
    if (subId) {
      const emoji = values.find((item) => item.id === subId)
      return emoji ? json(emoji) : error(10014, 'Unknown Emoji', 404)
    }
    return json(itemPage(values, query))
  }
  if (resource === 'applications' && resourceId && subresource === 'emojis') {
    const values = (await listCollection('emojis')).filter((item) => item.application_id === resourceId)
    if (subId) {
      const emoji = values.find((item) => item.id === subId)
      return emoji ? json(emoji) : error(10014, 'Unknown Emoji', 404)
    }
    return json(itemPage(values, query))
  }
  if (resource === 'guilds' && resourceId && subresource === 'threads') {
    const allThreads = await listCollection('threads')
    const guildThreads = allThreads.filter((t) => t.guild_id === resourceId && (t as any).archived !== true)
    const allMembers = await listCollection('thread_members')
    const threadIds = new Set(guildThreads.map((t) => t.id))
    const members = allMembers.filter((m) => threadIds.has((m as any).thread_id || (m as any).id))
    return json({ threads: guildThreads, members, has_more: false })
  }
  if (resource === 'channels' && resourceId && subresource === 'threads') {
    const allThreads = await listCollection('threads')
    if (subId === 'active') {
      const channelThreads = allThreads.filter((t) => t.parent_id === resourceId && (t as any).archived !== true)
      const allMembers = await listCollection('thread_members')
      const threadIds = new Set(channelThreads.map((t) => t.id))
      const members = allMembers.filter((m) => threadIds.has((m as any).thread_id || (m as any).id))
      return json({ threads: channelThreads, members, has_more: false })
    }
    if (subId === 'archived') {
      const channelThreads = allThreads.filter((t) => t.parent_id === resourceId && (t as any).archived === true && (!action || action === 'public'))
      return json({ threads: channelThreads, members: [], has_more: false })
    }
    if (subId === 'search') {
      const forumThreads = allThreads.filter((t) => t.parent_id === resourceId)
      const allMembers = await listCollection('thread_members')
      const threadIds = new Set(forumThreads.map((t) => t.id))
      const members = allMembers.filter((m) => threadIds.has((m as any).thread_id || (m as any).id))
      const db = await (await import('@/lib/discord-store')).readDatabase()
      const allMsgs: any[] = []
      for (const g of db.guilds) {
        if (Array.isArray(g.messages)) {
          for (const m of g.messages) {
            if (threadIds.has(m.channel_id)) allMsgs.push(m)
          }
        }
      }
      return json({
        threads: forumThreads,
        members,
        has_more: false,
        first_messages: allMsgs,
        most_recent_messages: allMsgs,
        total_results: forumThreads.length,
      })
    }
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'threads' && subId === 'archived') {
    const threads = (await listCollection('threads')).filter((item) => item.owner_id === currentUser && item.archived === true)
    return json({ threads })
  }
  if (resource === 'channels' && resourceId && subresource === 'users' && subId === '@me' && action === 'threads') {
    return json({ threads: [], members: [], has_more: false })
  }
  if (resource === 'channels' && resourceId && subresource === 'thread-members') {
    const members = (await listCollection('thread_members')).filter((item) => item.thread_id === resourceId)
    if (subId) {
      const member = members.find((item) => item.user_id === subId)
      return member ? json(member) : error(10007, 'Unknown Thread Member', 404)
    }
    return json(members)
  }
  if (resource === 'channels' && resourceId && !subresource) {
    const thread = (await listCollection('threads')).find((item) => item.id === resourceId)
    if (thread) {
      return json({
        ...thread,
        thread_metadata: (thread as any).thread_metadata || {
          archived: false,
          auto_archive_duration: 4320,
          archive_timestamp: (thread as any).created_at || now(),
          locked: false,
          create_timestamp: (thread as any).created_at || now(),
          invitable: true,
        },
        member: (thread as any).member || {
          id: thread.id,
          user_id: currentUser,
          join_timestamp: (thread as any).created_at || now(),
          flags: 0,
        },
      })
    }
  }

  // Batch 1: persistent guild/channel/message/relationship/application reads.
  if (resource === 'channels' && resourceId && subresource === 'messages') {
    const guilds = await listGuilds()
    let guild = guilds.find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) {
      const thread = (await listCollection('threads')).find((t) => t.id === resourceId)
      if (thread) {
        guild = guilds.find((g) => g.id === thread.guild_id)
      }
    }
    if (!guild) return error(10003, 'Unknown Channel', 404)
    const messages = (await import('@/lib/discord-store')).listMessages(guild.id, resourceId)
    const values = (await messages) ?? []
    if (subId) return json(values.find((item) => item.id === subId) ?? error(10008, 'Unknown Message', 404))
    const before = query.get('before'); const after = query.get('after')
    return json(values.filter((item) => (!before || String(item.id) < before) && (!after || String(item.id) > after)).slice(0, validLimit(query.get('limit'))))
  }
  if (resource === 'guilds' && resourceId && subresource === 'channels' && !subId) {
    const channels = await (await import('@/lib/discord-store')).listChannels(resourceId)
    return channels ? json(channels) : error(10004, 'Unknown Guild', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships') {
    const { listRelationships } = await import('@/lib/discord-store')
    return json(await listRelationships(currentUser))
  }
  if (resource === 'applications' && resourceId && subresource === 'commands') return json((await listCollection('application_commands')).filter((item) => item.application_id === resourceId))

  if (resource === 'users' && resourceId === '@me' && subresource === 'settings') {
    const stored = await getUserSetting('user_settings', currentUser)
    return json(stored ? publicUserSetting(stored) : cloneDefaultUserSettings())
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'consent') {
    const stored = await getUserSetting('user_consents', currentUser)
    return json(stored ? publicUserSetting(stored) : { personalization: { consented: false }, usage_statistics: { consented: false } })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'email-settings') {
    const stored = await getUserSetting('email_settings', currentUser)
    return json(stored ? publicUserSetting(stored) : { initialized: true, categories: {} })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings' && !subId) {
    const stored = await getUserSetting('notification_settings', currentUser)
    return json(stored ? publicUserSetting(stored) : { flags: 0 })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings' && subId === 'snapshots') {
    const snapshots = (await listCollection('notification_settings_snapshots')).filter((item) => item.user_id === currentUser)
    if (action) return json(snapshots.find((item) => item.id === action) ?? error(10013, 'Unknown notification settings snapshot', 404))
    return json(snapshots)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'video-filters' && subId === 'assets') {
    return json((await listCollection('video_filter_assets')).filter((item) => item.user_id === currentUser))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'audio-settings' && subId && action) {
    const setting = (await listCollection('audio_settings')).find((item) => item.user_id === currentUser && item.context_type === subId && item.target_user_id === action)
    return setting ? json(setting) : json({ context_type: subId, user_id: action })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && subId === 'settings') {
    const stored = (await listCollection('user_guild_settings')).filter((item) => item.user_id === currentUser)
    const storedByGuild = new Map(stored.map((item) => [String(item.guild_id), item]))
    const values = (await listUserGuilds(currentUser)).map((guild) => storedByGuild.get(guild.id) ?? DEFAULT_USER_GUILD_SETTINGS(currentUser, guild.id))
    return json(values.map(({ id: _id, user_id: _userId, ...value }) => value))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && subId && action === 'settings') {
    const value = await getGuildSetting(currentUser, subId)
    const { id: _id, user_id: _userId, ...settings } = value
    return json(settings)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections') return json((await listCollection('connections')).filter((item) => !item.user_id || item.user_id === currentUser))
  if (resource === 'users' && resourceId === '@me' && subresource === 'billing') {
    // `/users/@me/billing/nitro-affinity` (BILLING_NITRO_AFFINITY) lo consume el
    // cliente con `body.map(...)` desde BILLING_PREMIUM_AFFINITY_FETCH. Con el
    // objeto de país que devolvíamos lanzaba "TypeError: e.body.map is not a
    // function" y dejaba a medias la carga de las funciones de Nitro.
    if (subId === 'nitro-affinity') return json([])
    if (subId === 'subscriptions') {
      const { getUserSubscriptions } = await import('@/lib/discord-store')
      const userSubs = await getUserSubscriptions(currentUser)
      if (action === 'preview') {
        const sub = userSubs[0]
        const planId = (sub?.plan_id as string) || '511651880837840896'
        const skuId = (sub?.sku_id as string) || '521847234246082599'
        const price = skuId === '521846918637420545' ? 299 : 999
        return json({
          id: '700000000000000001',
          invoice_items: [
            {
              id: '700000000000000002',
              subscription_plan_id: planId,
              subscription_plan_price: price,
              amount: price,
              quantity: 1,
              discounts: [],
              unit_price: { amount: price, currency: 'eur' },
              tax: 0,
              sku_id: skuId,
            },
          ],
          total: price,
          subtotal: price,
          currency: (sub?.currency as string) || 'eur',
          tax: 0,
          tax_inclusive: true,
          subscription_period_start: (sub?.current_period_start as string) || new Date().toISOString(),
          subscription_period_end: (sub?.current_period_end as string) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 1,
        })
      }
      if (action && extraAction === 'preview') {
        const sub = userSubs.find((s) => s.id === action) || userSubs[0]
        const planId = (sub?.plan_id as string) || '511651880837840896'
        const skuId = (sub?.sku_id as string) || '521847234246082599'
        const price = skuId === '521846918637420545' ? 299 : 999
        return json({
          id: '700000000000000001',
          invoice_items: [
            {
              id: '700000000000000002',
              subscription_plan_id: planId,
              subscription_plan_price: price,
              amount: price,
              quantity: 1,
              discounts: [],
              unit_price: { amount: price, currency: 'eur' },
              tax: 0,
              sku_id: skuId,
            },
          ],
          total: price,
          subtotal: price,
          currency: (sub?.currency as string) || 'eur',
          tax: 0,
          tax_inclusive: true,
          subscription_period_start: (sub?.current_period_start as string) || new Date().toISOString(),
          subscription_period_end: (sub?.current_period_end as string) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 1,
        })
      }
      if (action && extraAction === 'invoices') return json([])
      if (action) {
        const found = userSubs.find((s) => s.id === action)
        return found ? json(found) : error(10013, 'Unknown Subscription', 404)
      }
      return json(userSubs)
    }
    if (subId === 'payment-sources') {
      return json([
        {
          id: '500000000000000001',
          type: 1,
          invalid: false,
          flags: 0,
          default: true,
          billing_address: {
            name: 'User',
            line_1: 'Street 123',
            line_2: null,
            city: 'Madrid',
            state: 'MD',
            country: 'ES',
            postal_code: '28001',
          },
          brand: 'visa',
          last_4: '4242',
          expires_month: 12,
          expires_year: 2030,
        },
      ])
    }
    if (subId === 'invoices') return json([])
    if (subId === 'payments') return json([])
    // The Nitro panel/wishlist also asks for plans through billing; answer with
    // the same objects as /store/published-listings/skus/{sku}/subscription-plans
    // so SubscriptionPlanStore always has a plan for the active subscription.
    if (subId === 'subscription-plans') return json(storeSubscriptionPlansFor(skuIdsFromQuery(query)))
    return json({ country_code: 'US', subdivision_code: null })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && subId === 'premium') {
    if (action === 'subscription-slots') {
      const { getUserGuildBoostSlots } = await import('@/lib/discord-store')
      return json(await getUserGuildBoostSlots(currentUser))
    }
    if (action === 'subscriptions') {
      if (extraAction === 'cooldown') return json({ cooldown_ends_at: null })
      const { getUserGuildBoosts } = await import('@/lib/discord-store')
      return json(await getUserGuildBoosts(currentUser))
    }
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'entitlements') {
    if (subId === 'gift-codes') {
      const { getUserGiftCodes } = await import('@/lib/discord-store')
      return json(await getUserGiftCodes(currentUser))
    }
    return json([])
  }
  if (resource === 'entitlements' && resourceId === 'gift-codes' && subresource) {
    const { getGiftCode } = await import('@/lib/discord-store')
    const gift = await getGiftCode(subresource)
    return gift ? json(gift) : error(10038, 'Unknown Gift Code', 404)
  }
  if (resource === 'guilds' && resourceId && subresource === 'premium' && subId === 'subscriptions') {
    const { getGuildBoosts } = await import('@/lib/discord-store')
    return json(await getGuildBoosts(resourceId))
  }
  if (resource === 'applications' && subresource === 'entitlements') return json([])
  if (resource === 'users' && resourceId === '@me' && subresource === 'affinities') {
    if (subId === 'guilds') return json({ guild_affinities: [] })
    return json({ user_affinities: [], inverse_user_affinities: [] })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'library') return json([])
  if (resource === 'users' && resourceId === '@me' && subresource === 'notes') return json({})
  if (resource === 'users' && resourceId === '@me' && subresource === 'profile-effects') return json([])
  if (resource === 'voice' && resourceId === 'regions') return json([{ id: 'us-west', name: 'US West', optimal: true, deprecated: false, custom: false }, { id: 'us-east', name: 'US East', optimal: false, deprecated: false, custom: false }])
  if (resource === 'guilds' && resourceId && subresource === 'regions') return json([{ id: 'us-west', name: 'US West', optimal: true, deprecated: false, custom: false }])
  if (resource === 'billing' && resourceId === 'popup-bridge') return json({ state: crypto.randomUUID() })
  if (resource === 'channels' && resourceId && subresource === 'pins') {
    const pinned = await listPinnedMessages('', resourceId)
    return pinned ? json(pinned) : error(10003, 'Unknown Channel', 404)
  }
  if (!resource) return json({ message: 'Discord-compatible API', version: 10 })
  if (resource === 'safety-hub' && resourceId === '@me') return json(await getSafetyHub(currentUser))
  if (resource === 'safety-hub' && resourceId === 'suspended') return error(10013, 'Suspended user token required', 401)
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && !subId) {
    const guilds = await listUserGuilds(currentUser)
    return json(guilds.map((g) => ({
      ...g,
      owner: g.owner_id === currentUser,
      permissions: g.permissions ?? '1071698660929',
      approximate_member_count: Array.isArray(g.members) ? g.members.length : 1,
      approximate_presence_count: 1,
    })))
  }
  // GET /users/@me/channels: la lista de canales privados. Sin esta rama caía en
  // los defaults de /users/@me/* (un array vacío) y los mensajes directos que el
  // gateway anuncia en READY no aparecían en el cliente.
  if (resource === 'users' && resourceId === '@me' && subresource === 'channels' && !subId) {
    const { listPrivateChannels } = await import('@/lib/discord-store')
    return json(await listPrivateChannels())
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'personas') {
    const { getUserPersonas } = await import('@/lib/raky-service')
    return json(await getUserPersonas(currentUser))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'accounts') {
    const { getUserMultiAccounts } = await import('@/lib/raky-service')
    return json(await getUserMultiAccounts(currentUser))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'security' && subId === 'suspicious-dms') {
    const { getSuspiciousDMs } = await import('@/lib/raky-service')
    return json(await getSuspiciousDMs(currentUser))
  }
  // Settings sub-pages live under /users/@me/*: answering `Unknown User` (404)
  // here is what broke panels such as Privacy (/harvest), Security
  // (/mfa/webauthn/credentials) or the Nitro store (virtual currency).
  if (resource === 'users' && resourceId === '@me' && subresource) {
    return json(userMeDefaults(subresource, subId, path.slice(2).join('/')))
  }
  if (resource === 'users' && resourceId === '@me' && !subresource) {
    const user = (await getUser(currentUser)) ?? {
      id: currentUser,
      username: `user_${currentUser.slice(-4)}`,
      discriminator: '0',
      global_name: `User ${currentUser.slice(-4)}`,
      avatar: null,
      bot: false,
      flags: 0,
    }
    // `/users/@me` used to answer the raw record, which could be `undefined`
    // for an unknown token id (the client shows an error screen when it cannot
    // load its own account), and it never reported the premium state that the
    // mocked subscription below assumes.
    const userPrem = typeof (user as any).premium_type === 'number' ? (user as any).premium_type : 0
    return json({
      ...user,
      premium_type: userPrem,
      premium_since: userPrem > 0 ? (((user as any).premium_since as string) || '2026-01-01T00:00:00.000Z') : null,
    })
  }
  if (resource === 'users' && resourceId === 'nearby') {
    const { getNearbyUsers } = await import('@/lib/raky-service')
    const lat = parseFloat(query.get('lat') || '40.4168')
    const lon = parseFloat(query.get('lon') || '-3.7038')
    const radius = parseFloat(query.get('radius') || query.get('radius_km') || '50')
    const q = query.get('q') || query.get('query') || ''
    const users = await getNearbyUsers(currentUser, lat, lon, radius, q)
    return json({ users, total: users.length })
  }
  if (resource === 'users' && resourceId) {
    const user = await getUser(resourceId)
    return user ? json(user) : error(10013, 'Unknown User', 404)
  }
  /* ---------------------------------------------------------------------------
   * Guild sub-resources that answer an OBJECT (not a list)
   *
   * The generic guild branch below answers `guild[subresource] ?? []`, which is
   * right for members/roles/emojis/invites but wrong for these documented
   * objects: a client reading `body.welcome_channels` (or `body.options`,
   * `body.form_fields`, ...) out of an array gets `undefined` and crashes while
   * rendering the guild.
   * ------------------------------------------------------------------------- */
  const GUILD_OBJECT_DEFAULTS: Record<string, unknown> = {
    'welcome-screen': { description: null, welcome_channels: [], default_channels: [] },
    onboarding: { guild_id: null, prompt: null, options: [], default_channel_ids: [], enabled: false, mode: 0 },
    widget: { enabled: false, channel_id: null },
    'widget.json': { id: null, name: null, instant_invite: null, channels: [], members: [], presence_count: 0 },
    'vanity-url': { code: null, uses: 0 },
    'member-verification': { version: 0, form_fields: [], description: null },
    'new-member-welcome': { welcome_message: null, rules: [], guidelines: [] },
    'guild-holiday-channel': {},
  }
  if (resource === 'guilds' && resourceId && subresource && subresource in GUILD_OBJECT_DEFAULTS && !subId) {
    const guild = await getGuild(resourceId)
    if (!guild) return error(10004, 'Unknown Guild', 404)
    return json(GUILD_OBJECT_DEFAULTS[subresource])
  }
  if (resource === 'guilds' && resourceId && guildResourceNames.has(subresource ?? '') ) {
    const values = await guildArray(resourceId, subresource as string)
    if (!values) return error(10004, 'Unknown Guild', 404)
    if (subId) return json(values.find((item) => item.id === subId) ?? { id: subId, guild_id: resourceId, name: subId })
    return json(values.slice(0, validLimit(query.get('limit'))))
  }
  if (resource === 'guilds' && resourceId && subresource === 'clyde-settings') {
    const { getGuildClydeSettings } = await import('@/lib/raky-service')
    return json(await getGuildClydeSettings(resourceId))
  }
  if (resource === 'guilds' && resourceId && subresource === 'encryption-key') {
    const { generateChannelEncryptionKey } = await import('@/lib/raky-service')
    return json({ key: generateChannelEncryptionKey(resourceId) })
  }
  if (resource === 'channels' && resourceId && subresource === 'encryption-key') {
    const { getChannelEncryptionKey } = await import('@/lib/raky-service')
    return json(await getChannelEncryptionKey(resourceId, currentUser))
  }
  if (resource === 'channels' && resourceId && subresource === 'messages' && subId && action === 'karma') {
    const { getForumMessageKarma } = await import('@/lib/raky-service')
    return json(await getForumMessageKarma(resourceId, subId))
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
  if (resource === 'gateway' || (resource === 'gateway' && resourceId === 'bot')) {
    const version = Number(query.get('v') ?? 10)
    const gatewayVersion = Number.isInteger(version) && version > 0 ? version : 10
    const encoding = query.get('encoding') === 'etf' ? 'etf' : 'json'
    const compress = query.get('compress')
    return json({
    url: `/api/v10/gateway?v=${gatewayVersion}&encoding=${encoding}${compress ? `&compress=${encodeURIComponent(compress)}` : ''}`,
    shards: 1,
    v: gatewayVersion,
    encoding,
    transport: 'http-mock',
    session_start_limit: { total: 1000, remaining: 1000, reset_after: 86400000, max_concurrency: 1 },
    })
  }
  // Feeds every /content-inventory/* sub-route (users/@me, users/@me/outbox,
  // users/@me/spotify, users/@me/similar-games/…); see contentInventoryFeed().
  if (resource === 'content-inventory') return json(contentInventoryFeed())

  const miscDefault = miscGetDefault(resource, resourceId, subresource, subId, action)
  if (miscDefault !== undefined) return json(miscDefault)

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

async function handlePost(request: NextRequest, { params }: Params) {
  const authError = await validateAuthorization(request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId, action, extraAction] = path
  const input = await bodyOf(request)
  const mappedCollection = collectionFor(resource)
  const currentUser = getUserIdFromAuth(request)

  // POST /auth/fingerprint (docs: Experiments -> Create Fingerprint). The client
  // asks for a fingerprint before authentication; the catch-all used to answer
  // 404 "Unknown auth", which is one more rejected promise inside the boot chain.
  if (resource === 'auth' && resourceId === 'fingerprint') {
    return json({ fingerprint: MOCK_FINGERPRINT })
  }
  if (resource === 'apex' && resourceId === 'experiments' && subresource === 'metadata') {
    return json({ experiments: [] })
  }
  // `POST /guilds/{id}/members-search` (member safety) y su `members/supplemental`:
  // antes caían en la rama genérica de sub-recursos de servidor y quedaban
  // guardados como campos basura dentro del objeto guild (`members-search`,
  // `delete`...). Además la store del cliente espera estas claves concretas.
  if (resource === 'guilds' && resourceId && subresource === 'members-search') {
    return json({ members: [], page_result_count: 0, total_result_count: 0 })
  }
  if (resource === 'guilds' && resourceId && subresource === 'members' && subId === 'supplemental') {
    return json({ guild_join_requests: [] })
  }
  // `POST /users/@me/channels` abre un mensaje directo (botón "Enviar mensaje" del
  // perfil). Antes caía en la rama genérica, devolvía un 201 sin `recipients` y sin
  // CHANNEL_CREATE: el DM no se abría ni aparecía en la barra lateral.
  if (resource === 'users' && resourceId === '@me' && subresource === 'channels' && !subId) {
    const recipientId =
      (typeof input.recipient_id === 'string' && input.recipient_id) ||
      (Array.isArray(input.recipients) && typeof input.recipients[0] === 'string' && input.recipients[0]) ||
      ''
    if (!recipientId) return validationError('recipient_id is required')
    const { ensureDirectChannelForRecipient } = await import('@/lib/discord-store')
    const channel = await ensureDirectChannelForRecipient(recipientId)
    await broadcastGatewayEvent('CHANNEL_CREATE', channel)
    return json(channel)
  }

  if (resource === 'gateway' && !resourceId && Number.isInteger(input.op)) {
    const data = gatewayData(input)
    if (Number(input.op) === 1) return heartbeatGateway(data)
    if (Number(input.op) === 2) return identifyGateway(currentUser, data)
    if (Number(input.op) === 6) return resumeGateway(data)
    if (Number(input.op) === 3) {
      if (!requiredString(data, 'session_id')) return validationError('session_id is required')
      const session = await updateCollectionItem('sessions', String(data.session_id), { presence: data, status: 'alive', updated_at: now() })
      return session ? new NextResponse(null, { status: 204 }) : error(10013, 'Unknown session', 404)
    }
    return validationError(`unsupported gateway opcode ${String(input.op)}`)
  }

  if (resource === 'ai' && !resourceId) {
    const problem = validateAI(input); if (problem) return validationError(problem)
    return json(await createCollectionItem('ai', { ...input, status: 'completed', response: { content: `Mock response for ${String(input.model)}`, model: input.model }, created_at: now() }), 201)
  }
  if (resource === 'billing' && resourceId && ['payment-sources', 'subscriptions', 'invoices'].includes(resourceId)) {
    if (resourceId === 'payment-sources' && !requiredString(input, 'type')) return validationError('type is required')
    if (resourceId === 'subscriptions' && (!requiredString(input, 'user_id') || !requiredString(input, 'sku_id'))) return validationError('user_id and sku_id are required')
    if (resourceId === 'invoices' && (input.amount === undefined || !requiredString(input, 'currency'))) return validationError('amount and currency are required')
    const names = { 'payment-sources': 'payment_sources', subscriptions: 'subscriptions', invoices: 'invoices' } as const
    return json(await createCollectionItem(names[resourceId as keyof typeof names], { ...input, status: input.status ?? 'active', created_at: now() }), 201)
  }
  if (resource === 'billing' && (resourceId === 'portal-session' || resourceId === 'portal')) {
    const session = await createCollectionItem('billing_events', { ...input, type: 'portal_session', status: 'created', url: '/api/v10/billing/portal-session/mock', created_at: now() })
    return json({ id: session.id, url: session.url, status: session.status }, 201)
  }
  if (resource === 'checkpoints' && resourceId && ['restore', 'commit'].includes(resourceId)) {
    const checkpointId = typeof input.checkpoint_id === 'string' ? input.checkpoint_id : String(input.id ?? '')
    if (!checkpointId) return validationError('checkpoint_id is required')
    const checkpoint = (await listCollection('checkpoints')).find((item) => item.id === checkpointId)
    if (!checkpoint) return error(10013, 'Unknown checkpoint', 404)
    const updated = await updateCollectionItem('checkpoints', checkpointId, { status: resourceId === 'restore' ? 'restored' : 'committed', completed_at: now() })
    return json(updated)
  }
  if (resource === 'captcha' && (resourceId === 'verify' || resourceId === 'validate')) {
    const problem = validateCaptcha(input); if (problem) return validationError(problem)
    const challenge = (await listCollection('captcha')).find((item) => item.id === input.challenge_id)
    if (!challenge) return error(10013, 'Unknown CAPTCHA challenge', 404)
    const item = await createCollectionItem('captcha', { ...input, status: 'verified', valid: true, verified_at: now() })
    return json({ success: true, valid: true, challenge_id: input.challenge_id, verification_id: item.id, provider: 'mock' })
  }
  if (resource === 'client-distribution') {
    const problem = validateClientDistribution(input); if (problem) return validationError(problem)
    return json(await createCollectionItem('client_distribution', { ...input, channel: input.channel ?? 'stable', published_at: now() }), 201)
  }
  const verificationRequest = resource === 'users' && resourceId === '@me' && subresource === 'verify'
    ? verificationChannel(subId)
    : resource === 'verification' && (resourceId === 'email' || resourceId === 'phone' || resourceId === 'email-verification' || resourceId === 'phone-verification')
      ? verificationChannel(resourceId)
      : null
  if (verificationRequest) {
    const problem = validateVerification(input, verificationRequest); if (problem) return validationError(problem)
    const target = String(input[verificationRequest])
    const item = await createCollectionItem('verification', {
      user_id: currentUser, channel: verificationRequest, target, masked_target: maskedValue(target, verificationRequest),
      status: 'pending', verification_code: '000000', expires_at: new Date(Date.now() + 600000).toISOString(), created_at: now(),
    })
    return json({ id: item.id, channel: verificationRequest, target: item.masked_target, status: 'pending', sent: true, verification_code: '000000' }, 201)
  }
  if (resource === 'verification' && resourceId === 'verify') {
    if (!requiredString(input, 'verification_id') || !requiredString(input, 'code')) return validationError('verification_id and code are required')
    const item = (await listCollection('verification')).find((value) => value.id === input.verification_id)
    if (!item) return error(10013, 'Unknown verification', 404)
    if (item.status !== 'pending' || (typeof item.expires_at === 'string' && Date.parse(item.expires_at) <= Date.now())) return error(10013, 'Verification has expired or was already completed', 400)
    const valid = String(input.code) === String(item.verification_code)
    const updated = await updateCollectionItem('verification', String(item.id), { status: valid ? 'verified' : 'failed', verified_at: valid ? now() : null })
    return json({ success: valid, status: updated?.status ?? 'failed' }, valid ? 200 : 400)
  }
  if (resource === 'permissions' && (!resourceId || resourceId === 'calculate')) {
    const guildId = typeof input.guild_id === 'string' ? input.guild_id : ''
    const userId = typeof input.user_id === 'string' ? input.user_id : currentUser
    if (!guildId) return validationError('guild_id is required')
    const permissions = calculatePermissions(input)
    if (permissions === null) return validationError('permissions or base_permissions must be a non-negative integer')
    const existing = (await listCollection('permission_calculations')).find((item) => item.guild_id === guildId && item.user_id === userId && item.channel_id === (input.channel_id ?? null))
    const value = { guild_id: guildId, user_id: userId, channel_id: input.channel_id ?? null, permissions, source: 'mock', calculated_at: now() }
    const saved = existing ? await updateCollectionItem('permission_calculations', String(existing.id), value) : await createCollectionItem('permission_calculations', value)
    if (!saved) return error(10013, 'Unable to persist permission calculation', 500)
    return json({ id: saved.id, guild_id: guildId, user_id: userId, permissions: saved.permissions }, 201)
  }
  if (resource === 'guilds' && resourceId && subresource === 'permissions' && subId) {
    const permissions = parsePermissionValue(input.permissions ?? (1024 | 2048))
    if (permissions === null) return validationError('permissions must be a non-negative integer')
    const saved = await createCollectionItem('permission_calculations', { guild_id: resourceId, user_id: subId, permissions, source: 'mock', calculated_at: now() })
    return json(saved, 201)
  }
  if ((resource === 'push-notifications' && !resourceId) || (resource === 'users' && resourceId === '@me' && subresource === 'push-notifications')) {
    const problem = validatePush(input); if (problem) return validationError(problem)
    return json(await createCollectionItem('push_notifications', { ...input, user_id: currentUser, enabled: input.enabled ?? true, created_at: now() }), 201)
  }
  if (resource === 'rpc') {
    const problem = validateRpc(input); if (problem) return validationError(problem)
    const item = await createCollectionItem('rpc', { ...input, user_id: currentUser, status: 'completed', result: { ok: true }, created_at: now() })
    return json({ id: item.id, ok: true, method: input.method ?? input.command, result: item.result }, 201)
  }
  if (resource === 'voice-connections' && !resourceId) {
    const problem = validateVoiceConnection(input); if (problem) return validationError(problem)
    return json(await createCollectionItem('voice_connections', { ...input, user_id: currentUser, status: 'connecting', endpoint: 'voice.mock.discord.test', session_id: crypto.randomUUID(), created_at: now() }), 201)
  }
  if (resource === 'voice-connections' && resourceId && ['connect', 'disconnect'].includes(subresource ?? '')) {
    const updated = await updateCollectionItem('voice_connections', resourceId, { status: subresource === 'connect' ? 'connected' : 'disconnected', updated_at: now() })
    return updated ? json(updated) : error(10013, 'Unknown voice connection', 404)
  }
  if (resource === 'gateway' && resourceId === 'identify') {
    return identifyGateway(currentUser, input)
  }
  if (resource === 'gateway' && resourceId === 'resume') {
    return resumeGateway(input)
  }
  if (resource === 'gateway' && resourceId === 'heartbeat') {
    return heartbeatGateway(input)
  }
  if (resource === 'gateway' && resourceId === 'sessions' && subresource && subId === 'events') {
    const session = (await listCollection('sessions')).find((item) => item.id === subresource)
    if (!session) return error(10013, 'Unknown session', 404)
    const sequence = Number(session.sequence ?? 0) + 1
    const event = {
      op: Number(input.op ?? 0),
      t: typeof input.type === 'string' ? input.type : (typeof input.event === 'string' ? input.event : 'DISPATCH'),
      s: sequence,
      d: input.d ?? input.data ?? {},
    }
    const events = Array.isArray(session.events) ? session.events : []
    await updateCollectionItem('sessions', subresource, { events: [...events, event], sequence, last_event_at: now(), status: 'alive' })
    return json(event, 201)
  }
  if (resource === 'voice-gateway' && subresource === 'identify') {
    if (!requiredString(input, 'guild_id') || !requiredString(input, 'channel_id')) return validationError('guild_id and channel_id are required')
    return json(await createCollectionItem('voice_gateway', { ...input, status: 'ready', protocol: 'udp-mock', session_id: crypto.randomUUID(), created_at: now() }), 201)
  }
  if (resource === 'voice-gateway' && subresource === 'heartbeat') {
    if (!requiredString(input, 'session_id')) return validationError('session_id is required')
    const session = await updateCollectionItem('voice_gateway', String(input.session_id), { last_heartbeat_at: now(), status: 'alive' })
    return session ? json({ acknowledged: true, session_id: input.session_id }) : error(10013, 'Unknown voice gateway session', 404)
  }
  if (resource === 'interactions' && (resourceId === 'verify' || subresource === 'verify')) {
    const headerProblem = validateInteractionHeaders(request); if (headerProblem) return validationError(headerProblem)
    const problem = validateSignature(input); if (problem) return validationError(problem)
    return json({ valid: true, algorithm: 'Ed25519-mock', verified_at: now(), public_key: input.public_key ?? null })
  }
  if (resource === 'interactions') {
    const headerProblem = validateInteractionHeaders(request); if (headerProblem) return validationError(headerProblem)
    const item = await createCollectionItem('interactions', {
      ...input, verified: true, signature_algorithm: 'Ed25519-mock',
      received_at: now(), signature: request.headers.get('x-signature-ed25519'),
      timestamp: request.headers.get('x-signature-timestamp'),
    })
    return json(item, 201)
  }
  if (resource === 'remote-auth' && resourceId === 'v1' && ['register', 'heartbeat', 'finish', 'cancel'].includes(subresource ?? '')) {
    if (subresource === 'register') {
      const problem = validateRemoteAuthRegister(input); if (problem) return validationError(problem)
      const item = await createCollectionItem('remote_auth', { ...input, user_id: currentUser, status: 'pending', created_at: now(), expires_at: new Date(Date.now() + 600000).toISOString() })
      return json({ id: item.id, status: item.status, remote_auth_token: `mock-${item.id}` }, 201)
    }
    if (!requiredString(input, 'session_id')) return validationError('session_id is required')
    const status = subresource === 'heartbeat' ? 'alive' : subresource === 'finish' ? 'completed' : 'cancelled'
    const updated = await updateCollectionItem('remote_auth', String(input.session_id), { status, updated_at: now() })
    return updated ? json({ id: input.session_id, status }) : error(10013, 'Unknown remote auth session', 404)
  }

  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings' && subId === 'snapshots' && !action) {
    const snapshot = await createCollectionItem('notification_settings_snapshots', {
      user_id: currentUser,
      name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : 'Notification settings snapshot',
      guilds: (await listCollection('user_guild_settings')).filter((item) => item.user_id === currentUser),
      created_at: now(),
    })
    return json(snapshot, 201)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings' && subId === 'snapshots' && action && extraAction === 'restore-guilds') {
    const snapshot = (await listCollection('notification_settings_snapshots')).find((item) => item.id === action && item.user_id === currentUser)
    if (!snapshot) return error(10013, 'Unknown notification settings snapshot', 404)
    const guilds = snapshot.guilds && typeof snapshot.guilds === 'object' && !Array.isArray(snapshot.guilds) ? snapshot.guilds as Item : null
    const restored = Array.isArray(snapshot.guilds)
      ? snapshot.guilds
      : Object.entries(guilds ?? {}).map(([guildId, value]) => ({ guild_id: guildId, ...(value as Item) }))
    const results = []
    for (const value of restored) {
      if (!value || typeof value !== 'object') continue
      const guildId = typeof (value as Item).guild_id === 'string' ? String((value as Item).guild_id) : ''
      if (!guildId) continue
      const saved = await saveGuildSetting(currentUser, guildId, value as Item)
      if (saved) results.push(saved)
    }
    return json(results.map((value) => {
      const { id: _id, user_id: _userId, ...settings } = value
      return settings
    }))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'video-filters' && subId === 'assets' && !action) {
    const problem = validateVideoFilterAsset(input); if (problem) return validationError(problem)
    return json(await createCollectionItem('video_filter_assets', { ...input, user_id: currentUser, last_used: false, created_at: now() }), 201)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'video-filters' && subId === 'assets' && action && extraAction === 'last-used') {
    const existing = (await listCollection('video_filter_assets')).find((item) => item.id === action && item.user_id === currentUser)
    if (!existing) return error(10013, 'Unknown video filter asset', 404)
    const assets = await listCollection('video_filter_assets')
    for (const asset of assets) {
      if (asset.user_id === currentUser) await updateCollectionItem('video_filter_assets', String(asset.id), { last_used: asset.id === action })
    }
    return json({ ...existing, last_used: true })
  }

  if (resource === 'users' && resourceId === '@me' && (subresource === 'settings-proto' || subresource === 'settings_proto')) {
    const version = settingVersion(subId)
    // El cliente real manda un protobuf binario en base64 (no el JSON-en-base64
    // que produce encodeProto), así que la validación estricta con decodeProto
    // rechazaba TODOS los cambios de ajustes con 400
    // (`PATCH /users/@me/settings-proto/1 -> 400` en client-api-calls.log) y el
    // cliente revertía el ajuste: la pantalla de ajustes parecía no guardar nada.
    const raw = typeof input.data === 'string' ? input.data : (typeof input.settings === 'string' ? input.settings : null)
    const data = raw ?? encodeProto(input.settings ?? input)
    if (typeof data !== 'string' || data.length === 0) return validationError('data must be a base64 encoded protobuf payload')
    const existing = (await listCollection('user_settings_proto')).find((item) => item.user_id === currentUser && item.version === version)
    const value = { user_id: currentUser, version, encoding: 'base64', data }
    const saved = existing ? await updateCollectionItem('user_settings_proto', String(existing.id), value) : await createCollectionItem('user_settings_proto', value)
    await broadcastGatewayEvent('USER_SETTINGS_PROTO_UPDATE', {
      settings: {
        type: Number(version),
        proto: data,
      },
      partial: false,
    })
    return json({ version, encoding: 'base64', data, settings: data }, existing ? 200 : 201)
  }
  if (resource === 'users' && resourceId === '@me' && (subresource === 'read-states' || subresource === 'read-state')) {
    const channelId = subId ?? (typeof input.channel_id === 'string' ? input.channel_id : '')
    if (!channelId) return validationError('channel_id is required')
    if (input.mention_count !== undefined && (!Number.isInteger(input.mention_count) || Number(input.mention_count) < 0)) return validationError('mention_count must be a non-negative integer')
    const value = { ...input, id: `${currentUser}:${channelId}`, user_id: currentUser, channel_id: channelId, updated_at: now() }
    const existing = (await listCollection('read_state')).find((item) => item.user_id === currentUser && item.channel_id === channelId)
    if (existing) {
      const updated = await updateCollectionItem('read_state', String(existing.id), value)
      return json(updated ?? value)
    }
    return json(await createCollectionItem('read_state', value), 201)
  }
  if (resource === 'guilds' && resourceId && subresource === 'auto-moderation' && subId === 'rules') {
    if (!(await getGuild(resourceId))) return error(10004, 'Unknown Guild', 404)
    const problem = validateAutoModRule(input); if (problem) return validationError(problem)
    const item = await createCollectionItem('automod_rules', {
      ...input, guild_id: resourceId, enabled: input.enabled ?? true, exempt_roles: input.exempt_roles ?? [], exempt_channels: input.exempt_channels ?? [],
    })
    await appendAuditLog({ guild_id: resourceId, action_type: 121, target_id: item.id, action: 'AUTO_MODERATION_RULE_CREATE' })
    return json(item, 201)
  }
  if (resource === 'guilds' && resourceId && subresource === 'scheduled-events') {
    if (!(await getGuild(resourceId))) return error(10004, 'Unknown Guild', 404)
    const problem = validateScheduledEvent(input); if (problem) return validationError(problem)
    const item = await createCollectionItem('scheduled_events', {
      ...input, guild_id: resourceId, entity_type: Number(input.entity_type), status: Number(input.status ?? 1), creator_id: currentUser,
    })
    await appendAuditLog({ guild_id: resourceId, action_type: 1, target_id: item.id, action: 'GUILD_SCHEDULED_EVENT_CREATE' })
    return json(item, 201)
  }
  if (resource === 'guilds' && resourceId && subresource === 'emojis') {
    if (!(await getGuild(resourceId))) return error(10004, 'Unknown Guild', 404)
    const problem = validateEmoji(input); if (problem) return validationError(problem)
    const values = await guildArray(resourceId, 'emojis'); if (!values) return error(10004, 'Unknown Guild', 404)
    const item = { id: String(input.id ?? id()), guild_id: resourceId, ...input, roles: input.roles ?? [], managed: input.managed ?? false }
    await saveGuildArray(resourceId, 'emojis', [...values, item])
    await appendAuditLog({ guild_id: resourceId, action_type: 60, target_id: item.id, action: 'EMOJI_CREATE' })
    return json(item, 201)
  }
  if (resource === 'applications' && resourceId && subresource === 'emojis') {
    const problem = validateEmoji(input); if (problem) return validationError(problem)
    return json(await createCollectionItem('emojis', { ...input, application_id: resourceId, roles: input.roles ?? [], managed: false }), 201)
  }
  if (resource === 'channels' && resourceId && subresource === 'threads') {
    const problem = validateThread(input); if (problem) return validationError(problem)
    const guilds = await listGuilds()
    const guild = guilds.find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) return error(10003, 'Unknown Channel', 404)

    const threadId = id()
    const threadNow = now()
    const starterMsgContent = (input.message && typeof (input.message as any).content === 'string')
      ? (input.message as any).content
      : (typeof input.content === 'string' ? input.content : '')

    const threadItem: any = {
      id: threadId,
      type: Number(input.type ?? 11),
      name: String(input.name || 'Nuevo Comentario'),
      guild_id: guild.id,
      parent_id: resourceId,
      owner_id: currentUser,
      last_message_id: null,
      message_count: starterMsgContent ? 1 : 0,
      member_count: 1,
      rate_limit_per_user: Number(input.rate_limit_per_user ?? 0),
      total_message_sent: starterMsgContent ? 1 : 0,
      applied_tags: Array.isArray(input.applied_tags) ? input.applied_tags : [],
      thread_metadata: {
        archived: false,
        auto_archive_duration: Number(input.auto_archive_duration ?? 4320),
        archive_timestamp: threadNow,
        locked: false,
        create_timestamp: threadNow,
        invitable: true,
      },
      member: {
        id: threadId,
        user_id: currentUser,
        join_timestamp: threadNow,
        flags: 0,
      },
      created_at: threadNow,
    }

    await createCollectionItem('threads', threadItem)
    await createCollectionItem('thread_members', {
      id: `${threadId}:${currentUser}`,
      thread_id: threadId,
      user_id: currentUser,
      join_timestamp: threadNow,
      flags: 0,
    })

    let starterMsg: any = null
    if (starterMsgContent) {
      const { createMessage } = await import('@/lib/discord-store')
      starterMsg = await createMessage(guild.id, threadId, starterMsgContent, currentUser, { authorId: currentUser })
      if (starterMsg) {
        threadItem.last_message_id = starterMsg.id
      }
    }

    await broadcastGatewayEvent('THREAD_CREATE', threadItem)
    await broadcastGatewayEvent('THREAD_MEMBERS_UPDATE', {
      id: threadId,
      guild_id: guild.id,
      member_count: 1,
      added_members: [threadItem.member],
    })

    const responsePayload = starterMsg ? { ...threadItem, message: starterMsg } : threadItem
    return json(responsePayload, 201)
  }
  if (resource === 'channels' && resourceId && subresource === 'post-data') {
    const threadIds: string[] = Array.isArray(input.thread_ids) ? (input.thread_ids as string[]) : []
    const allThreads = await listCollection('threads')
    const { readDatabase } = await import('@/lib/discord-store')
    const database = await readDatabase()
    const resultThreads: Record<string, any> = {}

    for (const tId of threadIds) {
      const thr = allThreads.find((t) => t.id === tId)
      if (thr) {
        const guild = database.guilds.find((g) => g.id === thr.guild_id)
        const msgs = (guild?.messages ?? []).filter((m: any) => m.channel_id === tId)
        msgs.sort((a: any, b: any) => (String(a.id) > String(b.id) ? 1 : -1))
        const firstMsg = msgs[0] ?? null
        const lastMsg = msgs[msgs.length - 1] ?? firstMsg
        const ownerMember = (guild?.members as any[] ?? []).find((m: any) => (m.user?.id === thr.owner_id || m.user_id === thr.owner_id))
        resultThreads[tId] = {
          first_message: firstMsg,
          most_recent_message: lastMsg,
          owner: ownerMember ?? null,
        }
      } else {
        resultThreads[tId] = {
          first_message: null,
          most_recent_message: null,
          owner: null,
        }
      }
    }
    return json({ threads: resultThreads }, 200)
  }
  if (resource === 'channels' && resourceId && subresource === 'messages' && action === 'threads') {
    const problem = validateThread(input); if (problem) return validationError(problem)
    const guilds = await listGuilds()
    const guild = guilds.find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) return error(10003, 'Unknown Channel', 404)
    return json(await createCollectionItem('threads', {
      ...input, guild_id: guild.id, parent_id: resourceId, owner_id: currentUser, message_id: subId, type: Number(input.type ?? 11),
      archived: false, locked: false, message_count: 1, member_count: 1, created_at: now(),
    }), 201)
  }
  if (resource === 'reports') {
    const problem = validateReport(input); if (problem) return validationError(problem)
    return json(await createCollectionItem('reports', { ...input, reporter_id: currentUser, status: 'submitted', created_at: now() }), 201)
  }
  if ((resource === 'cloud-uploads' || resource === 'cloud-upload') && !resourceId) {
    if (!requiredString(input, 'filename')) return validationError('filename is required')
    const contentType = input.content_type ?? input.contentType
    if (!requiredString({ content_type: contentType }, 'content_type')) return validationError('content_type is required')
    if (input.data !== undefined && invalidUploadData(input.data)) return validationError('data must be valid base64')
    const data = typeof input.data === 'string' ? input.data : null
    const item = await createCollectionItem('cloud_uploads', {
      filename: input.filename, content_type: contentType, size: Number(input.size ?? (data ? decodeBase64(data)?.byteLength : 0)),
      data, status: 'pending', created_at: now(), upload_url: `/api/v10/cloud-uploads/${id()}`,
    })
    return json(item, 201)
  }
  if ((resource === 'cloud-uploads' || resource === 'cloud-upload') && resourceId && subresource === 'complete') {
    const updated = await updateCollectionItem('cloud_uploads', resourceId, { status: 'completed', completed_at: now() })
    return updated ? json(updated) : error(10013, 'Unknown cloud upload', 404)
  }
  if (mappedCollection && !resourceId) {
    const required: Record<string, string[]> = {
      ai: ['model', 'prompt'],
      'application-directory': ['application_id'],
      checkpoints: ['name'],
      components: ['type'],
      'directory-entries': ['guild_id'],
      entitlements: ['sku_id', 'user_id'],
      'game-invites': ['application_id', 'user_id'],
      'guild-templates': ['name', 'code'],
      integrations: ['type'],
      lobbies: ['application_id'],
      payments: ['amount', 'currency'],
      subscriptions: ['user_id', 'sku_id'],
      teams: ['name'],
    }
    if (resource === 'checkpoints') {
      const problem = validateCheckpoint(input); if (problem) return validationError(problem)
    }
    const missing = (required[resource] ?? []).filter((field) => input[field] === undefined || input[field] === null || input[field] === '')
    if (missing.length) return validationError(`Missing required fields: ${missing.join(', ')}`)
  }
  if (resource === 'guilds' && !resourceId) {
    const { createGuild } = await import('@/lib/discord-store')
    const name = typeof input.name === 'string' && input.name ? input.name : 'Nuevo Servidor'
    const newGuild = await createGuild({ ...input, name }, currentUser)
    return json(newGuild, 201)
  }
  if (resource === 'channels' && resourceId && subresource === 'messages' && subId && action === 'karma') {
    const { voteForumMessage } = await import('@/lib/raky-service')
    const vote = Number(input.vote ?? 1) as 1 | -1 | 0
    const result = await voteForumMessage(resourceId, subId, currentUser, vote)
    return json(result)
  }
  if (resource === 'channels' && resourceId && subresource === 'messages') {
    const { listGuilds, readDatabase, crosspostMessage } = await import('@/lib/discord-store')
    const { checkSpamViolation, inspectMessageSafety, triggerClydeReply, CLYDE_USER_ID } = await import('@/lib/raky-service')

    const db = await readDatabase()
    const currentUserObj = (db.users || []).find((u: any) => u.id === currentUser) || {}
    const hasPhone = Boolean((currentUserObj as any).phone || (currentUserObj as any).phone_verified)

    // Comprobar anti-spam
    const contentStr = typeof input.content === 'string' ? input.content : ''
    const spamCheck = checkSpamViolation(currentUser, contentStr, resourceId, hasPhone)
    if (!spamCheck.allowed) {
      return error(20028, spamCheck.reason || 'Spam detectado. Requiere Captcha.', 400)
    }

    const allGuilds = await listGuilds()
    let guild = allGuilds.find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) {
      const thread = (await listCollection('threads')).find((t) => t.id === resourceId)
      if (thread) {
        guild = allGuilds.find((g) => g.id === thread.guild_id)
      }
    }
    const isEncrypted = guild ? Boolean((guild as any).is_encrypted) : false
    const channelObj = guild?.channels.find((c) => c.id === resourceId)
    const isNsfw = Boolean(channelObj?.nsfw)

    // Inspección de seguridad en chats NO cifrados (Gore / Menores)
    const safetyCheck = await inspectMessageSafety(contentStr, resourceId, currentUser, isEncrypted, isNsfw)
    if (safetyCheck.flagged && safetyCheck.strike) {
      console.warn(`[Raky Safety] Strike/Advertencia al usuario ${currentUser}: ${safetyCheck.reason}`)
    }

    if (!guild) {
      // Mensaje en canal DM
      const dm = (db.dm_channels as any[] | undefined)?.find((c) => c.id === resourceId)
      if (dm) {
        if (typeof input.content !== 'string' || input.content.length > 2000) return validationError('content must be a string of 2000 characters or fewer')
        const created = await (await import('@/lib/discord-store')).createMessage(
          dm.id,
          resourceId,
          input.content,
          currentUser,
          { ...input, authorId: currentUser }
        )
        if (contentStr.toLowerCase().includes('clyde') || contentStr.includes(CLYDE_USER_ID)) {
          triggerClydeReply(null, resourceId, contentStr, (currentUserObj as any).global_name || 'Amigo').catch(() => {})
        }
        return created ? json(created, 201) : error(10003, 'Unknown Channel', 404)
      }
      return error(10003, 'Unknown Channel', 404)
    }

    if (subId && action === 'crosspost') return json((await crosspostMessage(guild.id, resourceId, subId)) ?? error(10008, 'Unknown Message', 404))
    if (subId) return json((await (await import('@/lib/discord-store')).updateMessage(guild.id, resourceId, subId, input)) ?? error(10008, 'Unknown Message', 404))
    if (typeof input.content !== 'string' || input.content.length > 2000) return validationError('content must be a string of 2000 characters or fewer')

    const created = await (await import('@/lib/discord-store')).createMessage(guild.id, resourceId, input.content, currentUser, { ...input, authorId: currentUser })

    // Invocación a Clyde AI si es mencionado
    const clydeSettings = (guild as any).clyde_settings
    const clydeMentioned = contentStr.toLowerCase().includes('@clyde') || contentStr.includes(CLYDE_USER_ID) || contentStr.toLowerCase().startsWith('clyde')
    if (created && (clydeMentioned || (clydeSettings && clydeSettings.auto_reply_all))) {
      triggerClydeReply(guild.id, resourceId, contentStr, (currentUserObj as any).global_name || 'Amigo').catch(() => {})
    }

    return created ? json(created, 201) : error(10003, 'Unknown Channel', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'personas' && subId === 'active') {
    const { switchActivePersona } = await import('@/lib/raky-service')
    const personaId = (input.active_persona || input.persona_id || 'gaming') as 'gaming' | 'professional' | 'intimate'
    return json(await switchActivePersona(currentUser, personaId))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'personas') {
    const { updatePersona } = await import('@/lib/raky-service')
    const personaId = (input.persona_id || subId || 'gaming') as 'gaming' | 'professional' | 'intimate'
    return json(await updatePersona(currentUser, personaId, input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'security' && subId === 'close-compromised-dms') {
    const { closeCompromisedDMs } = await import('@/lib/raky-service')
    const channelIds = Array.isArray(input.channel_ids) ? (input.channel_ids as string[]) : []
    return json(await closeCompromisedDMs(currentUser, channelIds))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'security' && subId === 'resolve-captcha') {
    const { resolveSpamCaptcha } = await import('@/lib/raky-service')
    resolveSpamCaptcha(currentUser)
    return json({ success: true, message: 'Captcha verificado con éxito' })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'accounts' && subId === 'switch') {
    const { switchLinkedAccount } = await import('@/lib/raky-service')
    try {
      const targetId = String(input.target_account_id || input.account_id || '')
      return json(await switchLinkedAccount(currentUser, targetId))
    } catch (err: any) {
      return error(40001, err.message, 400)
    }
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'accounts') {
    const { addLinkedAccount } = await import('@/lib/raky-service')
    try {
      return json(await addLinkedAccount(currentUser, input as any), 201)
    } catch (err: any) {
      return error(40001, err.message, 400)
    }
  }
  if (resource === 'applications' && resourceId && subresource === 'verify-bot') {
    const { verifyBotApplication } = await import('@/lib/raky-service')
    return json(await verifyBotApplication(resourceId, String(input.repo_url || ''), String(input.dni_doc || 'DNI_VERIFIED')))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships') {
    if (typeof input.id !== 'string' || typeof input.type !== 'number') return validationError('id and type are required')
    return json(await createCollectionItem('relationships', { ...input, user_id: currentUser }), 201)
  }
  if (resource === 'applications' && resourceId && subresource === 'commands') {
    if (typeof input.name !== 'string' || !input.name) return validationError('name is required')
    return json(await createCollectionItem('application_commands', { ...input, application_id: resourceId, type: input.type ?? 1 }), 201)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'consent') {
    const current = await getUserSetting('user_consents', currentUser) ?? {}
    const next = { ...current }
    for (const key of Array.isArray(input.grant) ? input.grant : []) next[String(key)] = { consented: true }
    for (const key of Array.isArray(input.revoke) ? input.revoke : []) next[String(key)] = { consented: false }
    return json(publicUserSetting((await saveUserSetting('user_consents', currentUser, next)) ?? next))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'billing') {
    if (subId === 'subscriptions') {
      const { getUser, saveUserSubscription, updateUser } = await import('@/lib/discord-store')
      const user = await getUser(currentUser)
      const email = (user?.email as string)?.toLowerCase()
      if (email !== 'test@raky.es') {
        return json({
          message: 'Solo la cuenta test@raky.es puede suscribirse de forma gratuita.',
          code: 50000,
        }, 402)
      }
      const items = Array.isArray(input.items) ? input.items : []
      const firstItem = items[0] as Record<string, unknown> | undefined
      const planId = (firstItem?.plan_id as string) || (input.plan_id as string) || '511651880837840896'
      let skuId = '521847234246082599'
      let premiumType = 2
      if (
        planId === '978380692553465866' ||
        planId === '1024422698568122368' ||
        planId === '978387023482069042'
      ) {
        skuId = '978380684370378762'
        premiumType = 3
      } else if (planId === '511651871736201216' || planId === '511651876987469824') {
        skuId = '521846918637420545'
        premiumType = 1
      } else if (planId === '511651885459963904' || planId === '511651880837840897') {
        skuId = '521847234246082599'
        premiumType = 2
      }
      const newSub = {
        id: `sub_${Date.now()}`,
        type: 1,
        status: 1,
        created_at: now(),
        canceled_at: null,
        current_period_start: now(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        plan_id: planId,
        sku_id: skuId,
        items: [{ id: `item_${Date.now()}`, plan_id: planId, quantity: 1 }],
        payment_source_id: (input.payment_source_id as string) || '500000000000000001',
        payment_gateway: 1,
        flags: 0,
        user_id: currentUser,
        country_code: 'ES',
        currency: (input.currency as string) || 'eur',
      }
      await saveUserSubscription(currentUser, newSub)
      const premiumSince = (user?.premium_since as string) || now()
      await updateUser(currentUser, { premium_type: premiumType, premium_since: premiumSince })
      await broadcastGatewayEvent('USER_UPDATE', { id: currentUser, premium_type: premiumType, premium_since: premiumSince })
      await broadcastGatewayEvent('USER_SUBSCRIPTIONS_UPDATE', {})
      await broadcastGatewayEvent('BILLING_SUBSCRIPTION_UPDATE', newSub)
      return json(newSub, 201)
    }
    return json({ id: id(), ...input, created_at: now() }, 201)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && subId === 'premium') {
    if (action === 'subscription-slots' && extraAction) {
      const slotId = extraAction
      const isCancel = path[6] === 'cancel'
      const isUncancel = path[6] === 'uncancel'
      const { updateGuildBoostSlot } = await import('@/lib/discord-store')
      const updated = await updateGuildBoostSlot(currentUser, slotId, { canceled: isCancel })
      return updated ? json(updated) : error(10000, 'Unknown Slot', 404)
    }
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'entitlements' && subId === 'gift-codes') {
    const { getUser, createGiftCode } = await import('@/lib/discord-store')
    const user = await getUser(currentUser)
    const email = (user?.email as string)?.toLowerCase()
    if (email !== 'test@raky.es') {
      return json({ message: 'Solo la cuenta test@raky.es puede regalar suscripciones de forma gratuita.', code: 50000 }, 402)
    }
    const skuId = String(input.sku_id || '521847234246082599')
    const planId = input.subscription_plan_id as string | undefined
    const giftStyle = Number(input.gift_style) || 0
    const gift = await createGiftCode(currentUser, skuId, planId, giftStyle)
    return json(gift, 201)
  }
  if (resource === 'store' && resourceId === 'skus' && subId === 'purchase') {
    const { getUser, createGiftCode } = await import('@/lib/discord-store')
    const user = await getUser(currentUser)
    const email = (user?.email as string)?.toLowerCase()
    if (email !== 'test@raky.es') {
      return json({ message: 'Solo la cuenta test@raky.es puede regalar suscripciones de forma gratuita.', code: 50000 }, 402)
    }
    const skuId = subresource || '521847234246082599'
    const planId = (input.subscription_plan_id as string) || (skuId === '978380684370378762' ? '978380692553465866' : '511651880837840896')
    const giftStyle = Number(input.gift_style) || 0
    const gift = await createGiftCode(currentUser, skuId, planId, giftStyle)
    return json({ entitlements: [], gift_code: gift.code, library_applications: [] })
  }
  if (resource === 'entitlements' && resourceId === 'gift-codes' && subresource && subId === 'redeem') {
    const { redeemGiftCode } = await import('@/lib/discord-store')
    try {
      const gift = await redeemGiftCode(subresource, currentUser)
      return json(gift)
    } catch (e: any) {
      return json({ message: e.message, code: e.code || 50000 }, e.status || 400)
    }
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections') return json(await createCollectionItem('connections', input), 201)
  if (resource === 'voice' && resourceId === 'public-keys') return new NextResponse(null, { status: 204 })
  if (resource === 'channels' && resourceId && (subresource === 'voice-channel-effects' || subresource === 'custom-call-sounds')) return new NextResponse(null, { status: 204 })
  if (resource === 'users' && resourceId === '@me' && subresource === 'settings') {
    const problem = validateUserSettings(input); if (problem) return validationError(problem)
    return json(publicUserSetting((await saveUserSetting('user_settings', currentUser, input)) ?? input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'email-settings') {
    return json(publicUserSetting((await saveUserSetting('email_settings', currentUser, input)) ?? input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings') {
    return json(publicUserSetting((await saveUserSetting('notification_settings', currentUser, input)) ?? input))
  }
  if (resource === 'safety-hub' && resourceId === 'suspended' && subresource === '@me') {
    if (typeof input.token !== 'string' || !input.token) return error(50035, 'token is required', 400)
    return json(await getSafetyHub(currentUser))
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

async function handlePatch(request: NextRequest, { params }: Params) {
  const authError = await validateAuthorization(request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId, action, extraAction] = path
  const input = await bodyOf(request)
  const currentUser = getUserIdFromAuth(request)
  if (resource === 'guilds' && resourceId && subresource === 'clyde-settings') {
    const { updateGuildClydeSettings } = await import('@/lib/raky-service')
    return json(await updateGuildClydeSettings(resourceId, input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'personas' && subId === 'active') {
    const { switchActivePersona } = await import('@/lib/raky-service')
    const personaId = (input.active_persona || input.persona_id || 'gaming') as 'gaming' | 'professional' | 'intimate'
    return json(await switchActivePersona(currentUser, personaId))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'personas') {
    const { updatePersona } = await import('@/lib/raky-service')
    const personaId = (input.persona_id || subId || 'gaming') as 'gaming' | 'professional' | 'intimate'
    return json(await updatePersona(currentUser, personaId, input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'security' && subId === 'close-compromised-dms') {
    const { closeCompromisedDMs } = await import('@/lib/raky-service')
    const channelIds = Array.isArray(input.channel_ids) ? (input.channel_ids as string[]) : []
    return json(await closeCompromisedDMs(currentUser, channelIds))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'security' && subId === 'resolve-captcha') {
    const { resolveSpamCaptcha } = await import('@/lib/raky-service')
    resolveSpamCaptcha(currentUser)
    return json({ success: true, message: 'Captcha verificado con éxito' })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'accounts' && subId) {
    const { updateLinkedAccount } = await import('@/lib/raky-service')
    try {
      return json(await updateLinkedAccount(currentUser, subId, input))
    } catch (err: any) {
      return error(40001, err.message, 400)
    }
  }
  if (resource === 'gateway' && resourceId === 'sessions' && subresource) {
    const updated = await updateCollectionItem('sessions', subresource, { ...input, updated_at: now() })
    return updated ? json(updated) : error(10013, 'Unknown session', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'settings') {
    const problem = validateUserSettings(input); if (problem) return validationError(problem)
    return json(publicUserSetting((await saveUserSetting('user_settings', currentUser, input)) ?? input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'email-settings') {
    return json(publicUserSetting((await saveUserSetting('email_settings', currentUser, input)) ?? input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings' && !subId) {
    return json(publicUserSetting((await saveUserSetting('notification_settings', currentUser, input)) ?? input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && subId === 'settings') {
    if (!input.guilds || typeof input.guilds !== 'object' || Array.isArray(input.guilds)) return validationError('guilds must be an object')
    const results = []
    for (const [guildId, value] of Object.entries(input.guilds as Item)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return validationError(`guilds.${guildId} must be an object`)
      const problem = validateUserGuildSettings(value as Item); if (problem) return validationError(problem)
      const saved = await saveGuildSetting(currentUser, guildId, value as Item)
      if (saved) results.push(saved)
    }
    return json(results.map((value) => {
      const { id: _id, user_id: _userId, ...settings } = value
      return settings
    }))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && subId && action === 'settings') {
    const problem = validateUserGuildSettings(input); if (problem) return validationError(problem)
    const value = await saveGuildSetting(currentUser, subId, input)
    if (!value) return error(10013, 'Unable to persist guild settings', 500)
    const { id: _id, user_id: _userId, ...settings } = value
    return json(settings)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'guilds' && subId && action === 'member') {
    const user = (await getUser(currentUser)) || (await getUser('900000000000000001'))
    const { updateMember } = await import('@/lib/discord-store')
    const updated = await updateMember(subId, currentUser, input)
    const member = updated || {
      user,
      nick: typeof input.nick === 'string' ? input.nick : null,
      avatar: input.avatar ?? null,
      banner: input.banner ?? null,
      bio: typeof input.bio === 'string' ? input.bio : '',
      roles: [],
      joined_at: new Date().toISOString(),
      deaf: false,
      mute: false,
      pending: false
    }
    await broadcastGatewayEvent('GUILD_MEMBER_UPDATE', {
      guild_id: subId,
      user,
      nick: (member as Record<string, unknown>).nick,
      avatar: (member as Record<string, unknown>).avatar,
      banner: (member as Record<string, unknown>).banner,
      roles: (member as Record<string, unknown>).roles,
      joined_at: (member as Record<string, unknown>).joined_at,
    })
    return json(member)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections') {
    if (subId && action) {
      await updateCollectionItem('connections', `${subId}:${action}`, { ...input, type: subId, id: action, user_id: currentUser })
    }
    return json({ id: action || id(), type: subId || 'connection', ...input })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'audio-settings' && subId && action) {
    const problem = validateAudioSettings(input); if (problem) return validationError(problem)
    const existing = (await listCollection('audio_settings')).find((item) => item.user_id === currentUser && item.context_type === subId && item.target_user_id === action)
    const value = { ...input, user_id: currentUser, context_type: subId, target_user_id: action, updated_at: now() }
    if (existing) await updateCollectionItem('audio_settings', String(existing.id), value)
    else await createCollectionItem('audio_settings', value)
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'video-filters' && subId === 'assets' && action && extraAction === 'last-used') {
    const existing = (await listCollection('video_filter_assets')).find((item) => item.id === action && item.user_id === currentUser)
    if (!existing) return error(10013, 'Unknown video filter asset', 404)
    const assets = await listCollection('video_filter_assets')
    for (const asset of assets) {
      if (asset.user_id === currentUser) await updateCollectionItem('video_filter_assets', String(asset.id), { last_used: asset.id === action })
    }
    return json({ ...existing, last_used: true })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'billing' && subId === 'subscriptions') {
    if (action === 'preview' || extraAction === 'preview') {
      const { getUserSubscriptions } = await import('@/lib/discord-store')
      const userSubs = await getUserSubscriptions(currentUser)
      const sub = userSubs[0]
      const items = Array.isArray(input.items) ? input.items : []
      const firstItem = items[0] as Record<string, unknown> | undefined
      const planId = (firstItem?.plan_id as string) || (input.plan_id as string) || (sub?.plan_id as string) || '511651880837840896'
      let skuId = '521847234246082599'
      let price = 999
      if (
        planId === '978380692553465866' ||
        planId === '1024422698568122368' ||
        planId === '978387023482069042'
      ) {
        skuId = '978380684370378762'
        price = 299
      } else if (planId === '511651871736201216' || planId === '511651876987469824') {
        skuId = '521846918637420545'
        price = 499
      }
      return json({
        id: '700000000000000001',
        invoice_items: [
          {
            id: '700000000000000002',
            subscription_plan_id: planId,
            subscription_plan_price: price,
            amount: price,
            quantity: 1,
            discounts: [],
            unit_price: { amount: price, currency: 'eur' },
            tax: 0,
            sku_id: skuId,
          },
        ],
        total: price,
        subtotal: price,
        currency: (sub?.currency as string) || 'eur',
        tax: 0,
        tax_inclusive: true,
        subscription_period_start: (sub?.current_period_start as string) || now(),
        subscription_period_end: (sub?.current_period_end as string) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 1,
      })
    }
    // Plan switch (e.g. PATCH /users/@me/billing/subscriptions/:id)
    if (action) {
      const subscriptionId = action
      const { getUser, getUserSubscriptions, saveUserSubscription, updateUser } = await import('@/lib/discord-store')
      const user = await getUser(currentUser)
      const email = (user?.email as string)?.toLowerCase()
      if (email !== 'test@raky.es') {
        return json({ message: 'Solo la cuenta test@raky.es puede cambiar de suscripción libremente.', code: 50000 }, 402)
      }
      const items = Array.isArray(input.items) ? input.items : []
      const firstItem = items[0] as Record<string, unknown> | undefined
      const planId = (firstItem?.plan_id as string) || (input.plan_id as string) || '511651880837840896'
      let skuId = '521847234246082599'
      let premiumType = 2
      if (
        planId === '978380692553465866' ||
        planId === '1024422698568122368' ||
        planId === '978387023482069042'
      ) {
        skuId = '978380684370378762'
        premiumType = 3
      } else if (planId === '511651871736201216' || planId === '511651876987469824') {
        skuId = '521846918637420545'
        premiumType = 1
      } else if (planId === '511651885459963904' || planId === '511651880837840897') {
        skuId = '521847234246082599'
        premiumType = 2
      }
      const userSubs = await getUserSubscriptions(currentUser)
      const existingSub = userSubs.find((s) => s.id === subscriptionId) || userSubs[0] || {
        id: subscriptionId,
        type: 1,
        status: 1,
        created_at: now(),
        payment_gateway: 1,
        currency: 'eur',
      }
      const updatedSub = {
        ...existingSub,
        plan_id: planId,
        sku_id: skuId,
        status: 1,
        canceled_at: null,
        items: [
          {
            id: (firstItem?.id as string) || `item_${Date.now()}`,
            plan_id: planId,
            quantity: Number(firstItem?.quantity) || 1,
          },
        ],
      }
      await saveUserSubscription(currentUser, updatedSub)
      await updateUser(currentUser, { premium_type: premiumType })
      await broadcastGatewayEvent('USER_UPDATE', { id: currentUser, premium_type: premiumType })
      await broadcastGatewayEvent('USER_SUBSCRIPTIONS_UPDATE', {})
      await broadcastGatewayEvent('BILLING_SUBSCRIPTION_UPDATE', updatedSub)
      return json(updatedSub)
    }
  }

  // Guild boost apply (PUT /guilds/:guildId/premium/subscriptions)
  if (resource === 'guilds' && resourceId && subresource === 'premium' && subId === 'subscriptions') {
    const { applyGuildBoostSlots } = await import('@/lib/discord-store')
    const slotIds = Array.isArray(input.user_premium_guild_subscription_slot_ids)
      ? (input.user_premium_guild_subscription_slot_ids as string[])
      : []
    if (slotIds.length === 0) return validationError('user_premium_guild_subscription_slot_ids is required')
    try {
      const applied = await applyGuildBoostSlots(currentUser, resourceId, slotIds)
      return json(applied)
    } catch (e: any) {
      return error(50000, e.message, 400)
    }
  }

  if (resource === 'users' && resourceId === '@me' && (subresource === 'settings-proto' || subresource === 'settings_proto')) {
    const version = settingVersion(subId)
    // Ver la nota del POST: el protobuf real del cliente no se puede validar con
    // decodeProto sin rechazar ajustes legítimos.
    const raw = typeof input.data === 'string' ? input.data : (typeof input.settings === 'string' ? input.settings : null)
    const data = raw ?? encodeProto(input.settings ?? input)
    if (typeof data !== 'string' || data.length === 0) return validationError('data must be a base64 encoded protobuf payload')
    const existing = (await listCollection('user_settings_proto')).find((item) => item.user_id === currentUser && item.version === version)
    const value = { user_id: currentUser, version, encoding: 'base64', data }
    if (existing) await updateCollectionItem('user_settings_proto', String(existing.id), value)
    else await createCollectionItem('user_settings_proto', value)
    await broadcastGatewayEvent('USER_SETTINGS_PROTO_UPDATE', {
      settings: {
        type: Number(version),
        proto: data,
      },
      partial: false,
    })
    return json({ version, encoding: 'base64', data, settings: data })
  }
  if (resource === 'users' && resourceId === '@me' && (subresource === 'read-states' || subresource === 'read-state')) {
    const channelId = subId ?? (typeof input.channel_id === 'string' ? input.channel_id : '')
    if (!channelId) return validationError('channel_id is required')
    const existing = (await listCollection('read_state')).find((item) => item.user_id === currentUser && item.channel_id === channelId)
    const value = { ...input, id: `${currentUser}:${channelId}`, user_id: currentUser, channel_id: channelId, updated_at: now() }
    if (existing) return json(await updateCollectionItem('read_state', String(existing.id), value))
    return json(await createCollectionItem('read_state', value), 201)
  }
  if (resource === 'guilds' && resourceId && subresource === 'auto-moderation' && subId === 'rules' && action) {
    const existing = (await listCollection('automod_rules')).find((item) => item.guild_id === resourceId && item.id === action)
    if (!existing) return error(10011, 'Unknown Auto Moderation Rule', 404)
    const problem = validateAutoModRule({ ...existing, ...input }); if (problem) return validationError(problem)
    const updated = await updateCollectionItem('automod_rules', action, { ...input, guild_id: resourceId })
    await appendAuditLog({ guild_id: resourceId, action_type: 122, target_id: action, action: 'AUTO_MODERATION_RULE_UPDATE' })
    return json(updated)
  }
  if (resource === 'guilds' && resourceId && subresource === 'scheduled-events' && subId) {
    const existing = (await listCollection('scheduled_events')).find((item) => item.guild_id === resourceId && item.id === subId)
    if (!existing) return error(10070, 'Unknown Scheduled Event', 404)
    const problem = validateScheduledEvent({ ...existing, ...input }); if (problem) return validationError(problem)
    const updated = await updateCollectionItem('scheduled_events', subId, { ...input, guild_id: resourceId })
    await appendAuditLog({ guild_id: resourceId, action_type: 2, target_id: subId, action: 'GUILD_SCHEDULED_EVENT_UPDATE' })
    return json(updated)
  }
  if (resource === 'guilds' && resourceId && subresource === 'emojis' && subId) {
    const values = await guildArray(resourceId, 'emojis'); if (!values) return error(10004, 'Unknown Guild', 404)
    const index = values.findIndex((item) => item.id === subId)
    if (index < 0) return error(10014, 'Unknown Emoji', 404)
    const problem = validateEmoji({ ...values[index], ...input }); if (problem) return validationError(problem)
    values[index] = { ...values[index], ...input, id: subId, guild_id: resourceId }
    await saveGuildArray(resourceId, 'emojis', values)
    await appendAuditLog({ guild_id: resourceId, action_type: 61, target_id: subId, action: 'EMOJI_UPDATE' })
    return json(values[index])
  }
  if (resource === 'applications' && resourceId && subresource === 'emojis' && subId) {
    const existing = (await listCollection('emojis')).find((item) => item.application_id === resourceId && item.id === subId)
    if (!existing) return error(10014, 'Unknown Emoji', 404)
    const problem = validateEmoji({ ...existing, ...input }); if (problem) return validationError(problem)
    return json(await updateCollectionItem('emojis', subId, { ...input, application_id: resourceId }))
  }
  if (resource === 'channels' && resourceId && !subresource) {
    const existing = (await listCollection('threads')).find((item) => item.id === resourceId)
    if (existing) {
      const problem = validateThread({ ...existing, ...input }); if (problem) return validationError(problem)
      return json(await updateCollectionItem('threads', resourceId, input))
    }
  }
  if (resource === 'channels' && resourceId && subresource === 'thread-members' && subId) {
    const existing = (await listCollection('thread_members')).find((item) => item.thread_id === resourceId && item.user_id === subId)
    if (!existing) {
      await createCollectionItem('thread_members', { id: `${resourceId}:${subId}`, thread_id: resourceId, user_id: subId })
      return new NextResponse(null, { status: 204 })
    }
    return new NextResponse(null, { status: 204 })
  }
  if ((resource === 'cloud-uploads' || resource === 'cloud-upload') && resourceId && subresource === 'complete') {
    if (input.data !== undefined && invalidUploadData(input.data)) return validationError('data must be valid base64')
    const updated = await updateCollectionItem('cloud_uploads', resourceId, { ...input, status: 'completed', completed_at: now() })
    return updated ? json(updated) : error(10013, 'Unknown cloud upload', 404)
  }
  if (resource === 'applications' && resourceId && subresource === 'commands' && subId) {
    const updated = await updateCollectionItem('application_commands', subId, { ...input, application_id: resourceId })
    return updated ? json(updated) : error(10063, 'Unknown Application Command', 404)
  }
  if (resource === 'billing' && resourceId && ['payment-sources', 'subscriptions', 'invoices', 'billing-events'].includes(resourceId) && subresource) {
    const names = { 'payment-sources': 'payment_sources', subscriptions: 'subscriptions', invoices: 'invoices', 'billing-events': 'billing_events' } as const
    const collection = names[resourceId as keyof typeof names]
    const existing = (await listCollection(collection)).find((item) => item.id === subresource)
    if (!existing) return error(10013, `Unknown ${resourceId}`, 404)
    if (resourceId === 'payment-sources' && input.type !== undefined && !requiredString(input, 'type')) return validationError('type is required')
    if (resourceId === 'invoices' && input.currency !== undefined && (!requiredString(input, 'currency') || !/^[A-Za-z]{3}$/.test(String(input.currency)))) return validationError('currency must be a 3-letter code')
    return json(await updateCollectionItem(collection, subresource, input))
  }
  if (resource === 'voice-connections' && resourceId) {
    const existing = (await listCollection('voice_connections')).find((item) => item.id === resourceId)
    if (!existing) return error(10013, 'Unknown voice connection', 404)
    const problem = validateVoiceConnection({ ...existing, ...input }); if (problem) return validationError(problem)
    return json(await updateCollectionItem('voice_connections', resourceId, input))
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships' && subId) {
    // IMPORTANTE: los archivos de `app/api/v10/users/@me/**` NO se ejecutan (Next
    // compila `@me` como "named slot", no como ruta: 0 entradas en
    // app-paths-manifest.json), así que todo el eco del gateway de /users/@me sale
    // desde el catch-all. Sin RELATIONSHIP_ADD, aceptar/añadir un amigo (PUT) se
    // guardaba en la BD pero la lista del cliente no cambiaba hasta recargar.
    const type = typeof input.type === 'number' ? input.type : 1
    const nickname = typeof input.nickname === 'string' ? input.nickname : null
    const user = await getUser(subId)
    await broadcastGatewayEvent('RELATIONSHIP_ADD', {
      id: subId,
      type,
      nickname,
      user: user ?? { id: subId, username: 'user', discriminator: '0', global_name: null, avatar: null, bot: false },
      user_id: currentUser,
    })
    const existing = (await listCollection('relationships')).find((item) => item.id === subId)
    const updated = existing
      ? await updateCollectionItem('relationships', subId, { ...input, type, user_id: currentUser })
      : await createCollectionItem('relationships', { id: subId, user_id: currentUser, type, nickname })
    return updated ? json(updated) : new NextResponse(null, { status: 204 })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'settings') return json(await createCollectionItem('user_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'email-settings') return json(await createCollectionItem('email_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings') return json(await createCollectionItem('notification_settings', input))
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections' && subId) return json(await updateCollectionItem('connections', subId, input))
  if (resource === 'guilds' && resourceId && subresource === 'voice-states') return new NextResponse(null, { status: 204 })
  if (resource === 'safety-hub' && resourceId === 'request-review' && subresource) {
    const signal = Number(input.signal)
    if (![0, 1, 2, 3].includes(signal) || typeof input.user_input !== 'string' || input.user_input.length > 1000) return validationError('Invalid appeal payload')
    return json(await requestSafetyReview(currentUser, subresource, { signal, user_input: input.user_input }))
  }
  if (resource === 'safety-hub' && resourceId === 'suspended' && subresource === 'request-review' && subId) {
    const signal = Number(input.signal)
    if (typeof input.token !== 'string' || !input.token || ![0, 1, 2, 3].includes(signal) || typeof input.user_input !== 'string' || input.user_input.length > 1000) return validationError('Invalid appeal payload')
    return json(await requestSafetyReview(currentUser, subId, { signal, user_input: input.user_input }))
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

async function handlePut(request: NextRequest, context: Params) { return handlePatch(request, context) }

async function handleDelete(request: NextRequest, { params }: Params) {
  const authError = await validateAuthorization(request); if (authError) return authError
  const { path } = await params
  const [resource, resourceId, subresource, subId, action] = path
  const currentUser = getUserIdFromAuth(request)
  if (resource === 'gateway' && resourceId === 'sessions' && subresource) {
    return (await updateCollectionItem('sessions', subresource, { status: 'closed', closed_at: now() }))
      ? new NextResponse(null, { status: 204 })
      : error(10013, 'Unknown session', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'notification-settings' && subId === 'snapshots' && action) {
    const snapshot = (await listCollection('notification_settings_snapshots')).find((item) => item.id === action && item.user_id === currentUser)
    if (!snapshot) return error(10013, 'Unknown notification settings snapshot', 404)
    return (await deleteCollectionItem('notification_settings_snapshots', action))
      ? new NextResponse(null, { status: 204 })
      : error(10013, 'Unknown notification settings snapshot', 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'video-filters' && subId === 'assets' && action) {
    const asset = (await listCollection('video_filter_assets')).find((item) => item.id === action && item.user_id === currentUser)
    if (!asset) return error(10013, 'Unknown video filter asset', 404)
    return (await deleteCollectionItem('video_filter_assets', action))
      ? new NextResponse(null, { status: 204 })
      : error(10013, 'Unknown video filter asset', 404)
  }
  if (resource === 'guilds' && resourceId && subresource === 'auto-moderation' && subId === 'rules' && action) {
    const removed = await deleteCollectionItem('automod_rules', action)
    if (!removed) return error(10011, 'Unknown Auto Moderation Rule', 404)
    await appendAuditLog({ guild_id: resourceId, action_type: 123, target_id: action, action: 'AUTO_MODERATION_RULE_DELETE' })
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'guilds' && resourceId && subresource === 'scheduled-events' && subId) {
    const event = (await listCollection('scheduled_events')).find((item) => item.guild_id === resourceId && item.id === subId)
    if (!event) return error(10070, 'Unknown Scheduled Event', 404)
    await deleteCollectionItem('scheduled_events', subId)
    await appendAuditLog({ guild_id: resourceId, action_type: 3, target_id: subId, action: 'GUILD_SCHEDULED_EVENT_DELETE' })
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'guilds' && resourceId && subresource === 'emojis' && subId) {
    const values = await guildArray(resourceId, 'emojis'); if (!values) return error(10004, 'Unknown Guild', 404)
    const next = values.filter((item) => item.id !== subId)
    if (next.length === values.length) return error(10014, 'Unknown Emoji', 404)
    await saveGuildArray(resourceId, 'emojis', next)
    await appendAuditLog({ guild_id: resourceId, action_type: 62, target_id: subId, action: 'EMOJI_DELETE' })
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'applications' && resourceId && subresource === 'emojis' && subId) {
    return (await deleteCollectionItem('emojis', subId)) ? new NextResponse(null, { status: 204 }) : error(10014, 'Unknown Emoji', 404)
  }
  if (resource === 'channels' && resourceId && !subresource) {
    const thread = (await listCollection('threads')).find((item) => item.id === resourceId)
    if (thread) return (await deleteCollectionItem('threads', resourceId)) ? new NextResponse(null, { status: 204 }) : error(10003, 'Unknown Channel', 404)
  }
  if (resource === 'channels' && resourceId && subresource === 'thread-members' && subId) {
    return (await deleteCollectionItem('thread_members', `${resourceId}:${subId}`)) ? new NextResponse(null, { status: 204 }) : error(10007, 'Unknown Thread Member', 404)
  }
  if (resource === 'channels' && resourceId && subresource === 'messages' && subId) {
    const guild = (await listGuilds()).find((item) => item.channels.some((channel) => channel.id === resourceId))
    if (!guild) return error(10003, 'Unknown Channel', 404)
    const removed = await (await import('@/lib/discord-store')).deleteMessage(guild.id, resourceId, subId)
    return removed ? new NextResponse(null, { status: 204 }) : error(10008, 'Unknown Message', 404)
  }
  if (resource === 'applications' && resourceId && subresource === 'commands' && subId) {
    return (await deleteCollectionItem('application_commands', subId)) ? new NextResponse(null, { status: 204 }) : error(10063, 'Unknown Application Command', 404)
  }
  if (resource === 'billing' && resourceId && ['payment-sources', 'subscriptions', 'invoices', 'billing-events'].includes(resourceId) && subresource) {
    const names = { 'payment-sources': 'payment_sources', subscriptions: 'subscriptions', invoices: 'invoices', 'billing-events': 'billing_events' } as const
    return (await deleteCollectionItem(names[resourceId as keyof typeof names], subresource)) ? new NextResponse(null, { status: 204 }) : error(10013, `Unknown ${resourceId}`, 404)
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'billing' && subId === 'subscriptions') {
    const subscriptionId = action
    const { getUserSubscriptions, deleteUserSubscription, updateUser } = await import('@/lib/discord-store')
    const userSubs = await getUserSubscriptions(currentUser)
    const found = userSubs.find((s) => s.id === subscriptionId) || userSubs[0]

    await deleteUserSubscription(currentUser, subscriptionId)
    await updateUser(currentUser, { premium_type: 0, premium_since: null })

    const canceledPayload = found
      ? {
          ...found,
          status: 4, // ENDED
          canceled_at: now(),
          metadata: { ended_at: now() },
        }
      : { id: subscriptionId, status: 4, canceled_at: now() }

    await broadcastGatewayEvent('USER_UPDATE', { id: currentUser, premium_type: 0, premium_since: null })
    await broadcastGatewayEvent('USER_SUBSCRIPTIONS_UPDATE', {})
    await broadcastGatewayEvent('BILLING_SUBSCRIPTION_UPDATE', canceledPayload)

    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'guilds' && resourceId && subresource === 'premium' && subId === 'subscriptions' && action) {
    const { unapplyGuildBoost } = await import('@/lib/discord-store')
    await unapplyGuildBoost(currentUser, resourceId, action)
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'entitlements' && subId === 'gift-codes' && action) {
    const { revokeGiftCode } = await import('@/lib/discord-store')
    await revokeGiftCode(currentUser, action)
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'connections') {
    if (subId && action) {
      await deleteCollectionItem('connections', `${subId}:${action}`)
    }
    return new NextResponse(null, { status: 204 })
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'accounts' && subId) {
    const { removeLinkedAccount } = await import('@/lib/raky-service')
    try {
      return json(await removeLinkedAccount(currentUser, subId))
    } catch (err: any) {
      return error(40001, err.message, 400)
    }
  }
  if (resource === 'users' && resourceId === '@me' && subresource === 'relationships' && subId) {
    const removed = await deleteCollectionItem('relationships', subId)
    // Las carpetas `users/@me/...` de Next son "named slots" (no rutas), así que
    // esta petición la atiende el catch-all y no el route.ts específico. Los
    // amigos de demo vienen de READY y no son filas de la colección: el borrado
    // devolvía 404 y el cliente no podía quitar a nadie ("no deja quitar de
    // amigos"). Además hay que emitir RELATIONSHIP_REMOVE por el gateway, que es
    // lo que actualiza la lista de amigos en pantalla.
    void removed
    await broadcastGatewayEvent('RELATIONSHIP_REMOVE', { id: subId, type: 1, user_id: currentUser, nickname: null })
    return new NextResponse(null, { status: 204 })
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
  if (resource === 'guilds' && resourceId && !subresource) {
    const { deleteGuild } = await import('@/lib/discord-store')
    const success = await deleteGuild(resourceId, currentUser)
    return success ? new NextResponse(null, { status: 204 }) : error(10004, 'Unknown Guild', 404)
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

/* ---------------------------------------------------------------------------
 * Safety net
 *
 * An unexpected error used to bubble up as Next's HTML 500 page, which the
 * Discord client renders as a full-screen error ("pantallazo"). Every handler
 * now answers with valid JSON (or 204) so one broken endpoint can no longer
 * take the whole UI down. The failure is still logged for debugging.
 * ------------------------------------------------------------------------- */
function crashFallback(request: NextRequest, error: unknown) {
  console.error(`[mock-api] ${request.method} ${request.nextUrl.pathname} failed:`, error)
  if (request.method === 'DELETE' || request.method === 'OPTIONS') return new NextResponse(null, { status: 204 })
  if (request.method === 'GET' || request.method === 'HEAD') return json([])
  return json({ id: `${Date.now()}${Math.floor(Math.random() * 1000)}`, status: 'ok', mock_fallback: true })
}

export async function GET(request: NextRequest, context: Params) {
  try { return await handleGet(request, context) } catch (error) { return crashFallback(request, error) }
}

export async function POST(request: NextRequest, context: Params) {
  try { return await handlePost(request, context) } catch (error) { return crashFallback(request, error) }
}

export async function PATCH(request: NextRequest, context: Params) {
  try { return await handlePatch(request, context) } catch (error) { return crashFallback(request, error) }
}

export async function PUT(request: NextRequest, context: Params) {
  try { return await handlePut(request, context) } catch (error) { return crashFallback(request, error) }
}

export async function DELETE(request: NextRequest, context: Params) {
  try { return await handleDelete(request, context) } catch (error) { return crashFallback(request, error) }
}

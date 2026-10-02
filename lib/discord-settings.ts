export type DiscordItem = Record<string, unknown>

export const DEFAULT_USER_SETTINGS: DiscordItem = {
  activity_restricted_guild_ids: [],
  activity_joining_restricted_guild_ids: [],
  afk_timeout: 600,
  allow_accessibility_detection: true,
  allow_activity_party_privacy_friends: true,
  allow_activity_party_privacy_voice_channel: true,
  animate_emoji: true,
  animate_stickers: 0,
  contact_sync_enabled: false,
  convert_emoticons: true,
  custom_status: null,
  default_guilds_restricted: false,
  detect_platform_accounts: true,
  developer_mode: false,
  disable_games_tab: false,
  enable_tts_command: true,
  explicit_content_filter: 0,
  friend_discovery_flags: 0,
  friend_source_flags: { all: false, mutual_friends: false, mutual_guilds: false },
  gif_auto_play: true,
  guild_folders: [],
  inline_attachment_media: true,
  inline_embed_media: true,
  locale: 'en-US',
  message_display_compact: false,
  native_phone_integration_enabled: false,
  passwordless: false,
  render_embeds: true,
  render_reactions: true,
  restricted_guilds: [],
  show_current_game: true,
  slayer_sdk_receive_dms_in_game: 0,
  soundboard_volume: 1,
  status: 'online',
  stream_notifications_enabled: true,
  theme: 'dark',
  timezone_offset: 0,
  view_nsfw_commands: false,
  view_nsfw_guilds: false,
}

export const DEFAULT_USER_GUILD_SETTINGS = (userId: string, guildId: string): DiscordItem => ({
  user_id: userId,
  guild_id: guildId,
  muted: false,
  mute_config: null,
  message_notifications: 0,
  flags: 0,
  mobile_push: true,
  suppress_everyone: false,
  suppress_roles: false,
  hide_muted_channels: false,
  notify_highlights: 0,
  channel_overrides: [],
  mute_scheduled_events: false,
  version: 0,
})

const arrayFields = new Set([
  'activity_restricted_guild_ids',
  'activity_joining_restricted_guild_ids',
  'restricted_guilds',
  'guild_folders',
])
const booleanFields = new Set([
  'allow_accessibility_detection',
  'allow_activity_party_privacy_friends',
  'allow_activity_party_privacy_voice_channel',
  'animate_emoji',
  'contact_sync_enabled',
  'convert_emoticons',
  'default_guilds_restricted',
  'detect_platform_accounts',
  'developer_mode',
  'disable_games_tab',
  'enable_tts_command',
  'gif_auto_play',
  'inline_attachment_media',
  'inline_embed_media',
  'message_display_compact',
  'native_phone_integration_enabled',
  'passwordless',
  'render_embeds',
  'render_reactions',
  'show_current_game',
  'stream_notifications_enabled',
  'view_nsfw_commands',
  'view_nsfw_guilds',
])
const integerFields = new Set([
  'afk_timeout',
  'animate_stickers',
  'explicit_content_filter',
  'friend_discovery_flags',
  'slayer_sdk_receive_dms_in_game',
  'timezone_offset',
])
const stringFields = new Set(['locale', 'status', 'theme'])

export function cloneDefaultUserSettings() {
  return structuredClone(DEFAULT_USER_SETTINGS)
}

export function validateUserSettings(input: DiscordItem) {
  for (const field of arrayFields) {
    if (input[field] !== undefined && !Array.isArray(input[field])) return `${field} must be an array`
  }
  for (const field of booleanFields) {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') return `${field} must be boolean`
  }
  for (const field of integerFields) {
    if (input[field] !== undefined && (!Number.isInteger(input[field]) || Number(input[field]) < 0)) return `${field} must be a non-negative integer`
  }
  for (const field of stringFields) {
    if (input[field] !== undefined && typeof input[field] !== 'string') return `${field} must be a string`
  }
  if (input.soundboard_volume !== undefined && (typeof input.soundboard_volume !== 'number' || input.soundboard_volume < 0 || input.soundboard_volume > 1)) return 'soundboard_volume must be between 0 and 1'
  if (input.custom_status !== undefined && input.custom_status !== null) {
    if (typeof input.custom_status !== 'object' || Array.isArray(input.custom_status)) return 'custom_status must be an object or null'
    const customStatus = input.custom_status as DiscordItem
    if (customStatus.text !== undefined && (typeof customStatus.text !== 'string' || customStatus.text.length > 128)) return 'custom_status.text must be a string of 128 characters or fewer'
    if (customStatus.emoji_id !== undefined && customStatus.emoji_id !== null && typeof customStatus.emoji_id !== 'string') return 'custom_status.emoji_id must be a snowflake string or null'
    if (customStatus.emoji_name !== undefined && customStatus.emoji_name !== null && typeof customStatus.emoji_name !== 'string') return 'custom_status.emoji_name must be a string or null'
    if (customStatus.expires_at !== undefined && customStatus.expires_at !== null && (typeof customStatus.expires_at !== 'string' || Number.isNaN(Date.parse(customStatus.expires_at)))) return 'custom_status.expires_at must be an ISO date or null'
    if (customStatus.emoji_id != null && customStatus.emoji_name != null) return 'custom_status may include emoji_id or emoji_name, not both'
  }
  if (input.friend_source_flags !== undefined && (typeof input.friend_source_flags !== 'object' || input.friend_source_flags === null || Array.isArray(input.friend_source_flags))) return 'friend_source_flags must be an object or null'
  if (input.friend_source_flags && typeof input.friend_source_flags === 'object' && !Array.isArray(input.friend_source_flags)) {
    for (const field of ['all', 'mutual_friends', 'mutual_guilds']) {
      if ((input.friend_source_flags as DiscordItem)[field] !== undefined && typeof (input.friend_source_flags as DiscordItem)[field] !== 'boolean') return `friend_source_flags.${field} must be boolean`
    }
  }
  if (input.guild_folders !== undefined) {
    for (const folder of input.guild_folders as unknown[]) {
      if (!folder || typeof folder !== 'object' || Array.isArray(folder)) return 'guild_folders entries must be objects'
      const value = folder as DiscordItem
      if (value.guild_ids !== undefined && (!Array.isArray(value.guild_ids) || (value.guild_ids as unknown[]).some((guildId) => typeof guildId !== 'string'))) return 'guild_folders.guild_ids must be an array of snowflake strings'
      if (value.name !== undefined && value.name !== null && typeof value.name !== 'string') return 'guild_folders.name must be a string or null'
      if (value.color !== undefined && value.color !== null && (!Number.isInteger(value.color) || Number(value.color) < 0)) return 'guild_folders.color must be a non-negative integer or null'
    }
  }
  if (input.theme !== undefined && !['dark', 'light', 'darker', 'midnight'].includes(String(input.theme))) return 'theme must be dark, light, darker, or midnight'
  if (input.animate_stickers !== undefined && ![0, 1, 2].includes(Number(input.animate_stickers))) return 'animate_stickers must be 0, 1, or 2'
  if (input.explicit_content_filter !== undefined && ![0, 1, 2].includes(Number(input.explicit_content_filter))) return 'explicit_content_filter must be 0, 1, or 2'
  if (input.status !== undefined && !['online', 'idle', 'dnd', 'invisible'].includes(String(input.status))) return 'status must be online, idle, dnd, or invisible'
  return null
}

export function validateUserGuildSettings(input: DiscordItem) {
  const booleanFields = ['muted', 'mobile_push', 'suppress_everyone', 'suppress_roles', 'hide_muted_channels', 'mute_scheduled_events']
  for (const field of booleanFields) {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') return `${field} must be boolean`
  }
  for (const field of ['message_notifications', 'flags', 'notify_highlights', 'version']) {
    if (input[field] !== undefined && (!Number.isInteger(input[field]) || Number(input[field]) < 0)) return `${field} must be a non-negative integer`
  }
  if (input.channel_overrides !== undefined && !Array.isArray(input.channel_overrides) && (typeof input.channel_overrides !== 'object' || input.channel_overrides === null)) return 'channel_overrides must be an array or object'
  const overrides = Array.isArray(input.channel_overrides)
    ? input.channel_overrides
    : input.channel_overrides && typeof input.channel_overrides === 'object'
      ? Object.entries(input.channel_overrides as DiscordItem).map(([channel_id, value]) => ({ channel_id, ...(value as DiscordItem) }))
      : []
  for (const override of overrides) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) return 'channel_overrides entries must be objects'
    const value = override as DiscordItem
    if (!value.channel_id || typeof value.channel_id !== 'string') return 'channel_overrides.channel_id must be a snowflake string'
    for (const field of ['collapsed', 'muted']) {
      if (value[field] !== undefined && typeof value[field] !== 'boolean') return `channel_overrides.${field} must be boolean`
    }
    for (const field of ['flags', 'message_notifications']) {
      if (value[field] !== undefined && (!Number.isInteger(value[field]) || Number(value[field]) < 0)) return `channel_overrides.${field} must be a non-negative integer`
    }
  }
  if (input.mute_config !== undefined && input.mute_config !== null && (typeof input.mute_config !== 'object' || Array.isArray(input.mute_config))) return 'mute_config must be an object or null'
  return null
}

export function validateAudioSettings(input: DiscordItem) {
  for (const field of ['input_volume', 'output_volume']) {
    if (input[field] !== undefined && (typeof input[field] !== 'number' || input[field] < 0 || input[field] > 200)) return `${field} must be between 0 and 200`
  }
  if (input.input_sensitivity !== undefined && (typeof input.input_sensitivity !== 'number' || input.input_sensitivity < 0 || input.input_sensitivity > 1)) return 'input_sensitivity must be between 0 and 1'
  return null
}

export function validateVideoFilterAsset(input: DiscordItem) {
  if (!Number.isInteger(input.type) || Number(input.type) < 0) return 'type must be a non-negative integer'
  if (input.name !== undefined && (typeof input.name !== 'string' || input.name.length > 100)) return 'name must be a string of 100 characters or fewer'
  if (input.asset !== undefined && typeof input.asset !== 'string') return 'asset must be a string'
  return null
}
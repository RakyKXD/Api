export interface User {
  id: string
  username: string
  discriminator: string
  global_name: string | null
  avatar: string | null
  bot?: boolean
  system?: boolean
  mfa_enabled?: boolean
  banner?: string | null
  accent_color?: number | null
  locale?: string
  verified?: boolean
  email?: string | null
  flags?: number
  premium_type?: number // 0 = None, 1 = Nitro Classic, 2 = Nitro, 3 = Nitro Basic
  public_flags?: number
  avatar_decoration_data?: {
    asset: string
    sku_id?: string
  } | null
  bio?: string
}

export interface ProfileMetadata {
  guild_id?: string | null
  pronouns?: string
  bio?: string
  banner?: string | null
  accent_color?: number | null
  theme_colors?: [number, number] | null
  popout_animation_particle_type?: number | null
  emoji?: Record<string, unknown> | null
  profile_effect?: {
    id: string
    expires_at?: string | null
  } | null
}

export interface UserProfileResponse {
  user: User
  user_profile: ProfileMetadata
  badges: Array<{
    id: string
    description: string
    icon: string | null
    link?: string | null
  }>
  mutual_guilds: Array<{
    id: string
    nick?: string | null
  }>
  connected_accounts: Array<{
    type: string
    id: string
    name: string
    verified: boolean
    friend_sync?: boolean
    show_activity?: boolean
    two_way_link?: boolean
    metadata_visibility?: number
  }>
  premium_since: string | null
  premium_type: number | null
  premium_guild_since?: string | null
}

export interface UserSettings {
  locale: string
  theme: 'dark' | 'light' | 'midnight'
  status: 'online' | 'idle' | 'dnd' | 'invisible'
  custom_status: {
    text?: string | null
    emoji_id?: string | null
    emoji_name?: string | null
    expires_at?: string | null
  } | null
  developer_mode: boolean
  afk_timeout: number
  animate_emoji: boolean
  animate_stickers: number
  convert_emoticons: boolean
  default_guilds_restricted: boolean
  detect_platform_accounts: boolean
  disable_games_tab: boolean
  enable_tts_command: boolean
  explicit_content_filter: number
  friend_source_flags: {
    all?: boolean
    mutual_guilds?: boolean
    mutual_friends?: boolean
  }
  gif_auto_play: boolean
  guild_folders: Array<{
    id: number | string
    name?: string | null
    color?: number | null
    guild_ids: string[]
  }>
  guild_positions: string[]
  inline_attachment_media: boolean
  inline_embed_media: boolean
  message_display_compact: boolean
  render_embeds: boolean
  render_reactions: boolean
  restricted_guilds: string[]
  show_current_game: boolean
  timezone_offset: number
}

export interface Relationship {
  id: string // target user id
  type: number // 1: FRIEND, 2: BLOCKED, 3: INCOMING_REQUEST, 4: OUTGOING_REQUEST, 5: IMPLICIT
  nickname: string | null
  user: User
  user_ignored: boolean
  is_spam_request?: boolean
  stranger_request?: boolean
  since?: string
}

export interface UserNote {
  user_id: string // the target user
  note_user_id: string // the note author / owner (@me)
  note: string
}

export interface Channel {
  id: string
  type: number // 0: GUILD_TEXT, 1: DM, 2: GUILD_VOICE, 3: GROUP_DM, 4: GUILD_CATEGORY, 5: GUILD_ANNOUNCEMENT
  guild_id?: string | null
  position?: number
  name?: string | null
  topic?: string | null
  nsfw?: boolean
  last_message_id?: string | null
  bitrate?: number
  user_limit?: number
  rate_limit_per_user?: number
  recipients?: User[]
  icon?: string | null
  owner_id?: string
  parent_id?: string | null
  last_pin_timestamp?: string | null
  rtc_region?: string | null
  video_quality_mode?: number
  message_count?: number
  member_count?: number
  permission_overwrites?: Array<{
    id: string
    type: number
    allow: string
    deny: string
  }>
}

export interface Message {
  id: string
  channel_id: string
  guild_id?: string | null
  author: User
  content: string
  timestamp: string
  edited_timestamp: string | null
  tts?: boolean
  mention_everyone?: boolean
  mentions: User[]
  mention_roles: string[]
  attachments: Array<Record<string, unknown>>
  embeds: Array<Record<string, unknown>>
  reactions?: Array<{
    count: number
    me: boolean
    emoji: {
      id: string | null
      name: string
    }
  }>
  nonce?: string | number | null
  pinned: boolean
  webhook_id?: string | null
  type: number
  flags?: number
}

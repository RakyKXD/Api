import { NextRequest, NextResponse } from 'next/server'
import { getGuild, listChannels, updateGuild } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  return NextResponse.json(await listChannels(guildId))
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const type = typeof body?.type === 'number' ? body.type : 0
  const rawName = typeof body?.name === 'string' ? body.name.trim() : ''
  const name = rawName || (type === 2 ? 'General' : (type === 4 ? 'Categories' : 'nuevo-canal'))

  const channel: Record<string, unknown> = {
    id: Date.now().toString(),
    guild_id: guildId,
    type,
    name,
    position: Array.isArray(guild.channels) ? guild.channels.length : 0,
    parent_id: body.parent_id ?? null,
    topic: body.topic ?? null,
    nsfw: Boolean(body.nsfw),
    permission_overwrites: Array.isArray(body.permission_overwrites) ? body.permission_overwrites : [],
    rate_limit_per_user: typeof body.rate_limit_per_user === 'number' ? body.rate_limit_per_user : 0,
    bitrate: typeof body.bitrate === 'number' ? body.bitrate : 64000,
    user_limit: typeof body.user_limit === 'number' ? body.user_limit : 0,
    last_message_id: null,
  }

  if (type === 15) {
    channel.available_tags = Array.isArray(body.available_tags) ? body.available_tags : []
    channel.default_reaction_emoji = body.default_reaction_emoji ?? null
    channel.default_sort_order = body.default_sort_order ?? null
    channel.default_forum_layout = typeof body.default_forum_layout === 'number' ? body.default_forum_layout : 0
    channel.default_thread_rate_limit_per_user = typeof body.default_thread_rate_limit_per_user === 'number' ? body.default_thread_rate_limit_per_user : 0
    channel.default_auto_archive_duration = typeof body.default_auto_archive_duration === 'number' ? body.default_auto_archive_duration : 4320
    channel.flags = typeof body.flags === 'number' ? body.flags : 0
    channel.template = typeof body.template === 'string' ? body.template : ''
  }

  guild.channels = Array.isArray(guild.channels) ? guild.channels : []
  guild.channels.push(channel)
  await updateGuild(guildId, { channels: guild.channels })
  await broadcastGatewayEvent('CHANNEL_CREATE', channel)

  return NextResponse.json(channel, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const updates = await request.json().catch(() => [])
  if (!Array.isArray(updates)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const channels = ((guild.channels as Array<Record<string, unknown>>) || []).map((c) => ({ ...c }))
  for (const update of updates) {
    if (!update || typeof update !== 'object') continue
    const ch = channels.find((c) => c.id === update.id)
    if (ch) {
      if (typeof update.position === 'number') ch.position = update.position
      if (update.parent_id !== undefined) ch.parent_id = update.parent_id
      if (update.lock_permissions !== undefined) ch.lock_permissions = update.lock_permissions
      await broadcastGatewayEvent('CHANNEL_UPDATE', { ...ch, guild_id: guildId })
    }
  }

  channels.sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
  await updateGuild(guildId, { channels } as any)
  return NextResponse.json(channels)
}

import { NextRequest, NextResponse } from 'next/server'
import { getGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild || !guild.widget_enabled) {
    return NextResponse.json({ message: 'Widget Disabled', code: 50004 }, { status: 403 })
  }

  return NextResponse.json({
    id: guild.id,
    name: guild.name,
    instant_invite: null,
    channels: (guild.channels || []).filter((c) => c.type === 2 || c.type === 0),
    members: (guild.members || []).map((m: any) => ({
      id: m.user?.id || '0',
      username: m.user?.username || 'member',
      discriminator: '0',
      avatar: null,
      status: 'online',
    })),
    presence_count: Array.isArray(guild.members) ? guild.members.length : 1,
  })
}

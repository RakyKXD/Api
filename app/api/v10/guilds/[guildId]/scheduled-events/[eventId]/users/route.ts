import { NextRequest, NextResponse } from 'next/server'
import { getGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; eventId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId, eventId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  return NextResponse.json([
    {
      guild_scheduled_event_id: eventId,
      user: {
        id: '900000000000000001',
        username: 'api-bot',
        discriminator: '0',
        avatar: null,
      },
      member: {
        roles: [],
        nick: null,
        joined_at: '2026-01-01T00:00:00.000Z',
      },
    },
  ])
}

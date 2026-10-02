import { NextRequest, NextResponse } from 'next/server'
import { getGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  return NextResponse.json({
    guild_id: guildId,
    member_count: Array.isArray(guild.members) ? guild.members.length : 1,
    messages_sent: 420,
    voice_minutes: 1800,
    readers: 85,
    dau: 24,
    mau: 150,
  })
}

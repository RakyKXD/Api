import { NextRequest, NextResponse } from 'next/server'
import { getGuild, listGuildBans } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  const bans = await listGuildBans(guildId)
  return NextResponse.json(bans)
}

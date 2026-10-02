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
    safe_environment: true,
    healthy: true,
    health_score_pending: false,
    size: Array.isArray(guild.members) ? guild.members.length : 1,
    nsfw_properties: {},
    grace_period_end_date: null,
    retention_healthy: true,
    engagement_healthy: true,
    age: 100,
    minimum_size: 1000,
  })
}

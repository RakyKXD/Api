import { NextRequest, NextResponse } from 'next/server'
import { getGuild, getGuildAuditLogs } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') || 50), 1), 100)
  const auditLogs = await getGuildAuditLogs(guildId, limit)
  return NextResponse.json(auditLogs)
}

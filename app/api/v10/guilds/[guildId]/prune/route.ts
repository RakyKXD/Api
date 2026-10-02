import { NextRequest, NextResponse } from 'next/server'
import { executeGuildPrune, getGuild, getGuildPruneCount } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const days = Number(request.nextUrl.searchParams.get('days') || 7)
  const result = await getGuildPruneCount(guildId, days)
  return NextResponse.json(result)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const days = Number(body?.days || 7)
  const result = await executeGuildPrune(guildId, days)
  return NextResponse.json(result)
}

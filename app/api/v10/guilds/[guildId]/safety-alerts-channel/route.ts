import { NextRequest, NextResponse } from 'next/server'
import { getGuild, updateGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  return NextResponse.json({ channel_id: (guild as any).safety_alerts_channel_id || null })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const body = (await request.json().catch(() => ({}))) || {}
  await updateGuild(guildId, { safety_alerts_channel_id: body.channel_id ?? null } as any)
  return NextResponse.json({ channel_id: body.channel_id ?? null })
}

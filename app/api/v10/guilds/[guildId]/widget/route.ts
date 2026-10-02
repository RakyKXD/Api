import { NextRequest, NextResponse } from 'next/server'
import { getGuild, updateGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  return NextResponse.json({
    enabled: Boolean(guild.widget_enabled),
    channel_id: guild.widget_channel_id ?? null,
  })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const updated = await updateGuild(guildId, {
    widget_enabled: body.enabled !== undefined ? Boolean(body.enabled) : undefined,
    widget_channel_id: body.channel_id ?? undefined,
  })

  if (!updated) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  return NextResponse.json({
    enabled: Boolean(updated.widget_enabled),
    channel_id: updated.widget_channel_id ?? null,
  })
}

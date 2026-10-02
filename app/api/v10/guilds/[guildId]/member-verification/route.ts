import { NextRequest, NextResponse } from 'next/server'
import { getGuild, updateGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const mv = (guild as any).member_verification || {
    version: new Date().toISOString(),
    description: null,
    form_fields: [],
    guild_id: guildId,
    enabled: false,
  }

  return NextResponse.json(mv)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) || {}
  const mv = {
    version: new Date().toISOString(),
    description: body.description ?? null,
    form_fields: Array.isArray(body.form_fields) ? body.form_fields : [],
    guild_id: guildId,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
  }

  await updateGuild(guildId, { member_verification: mv } as any)
  return NextResponse.json(mv)
}

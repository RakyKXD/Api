import { NextRequest, NextResponse } from 'next/server'
import { getGuild, updateGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const onboarding = (guild as any).onboarding || {
    guild_id: guildId,
    prompts: [],
    default_channel_ids: [],
    enabled: false,
    mode: 0,
    below_requirements: false,
  }

  return NextResponse.json(onboarding)
}

export async function PUT(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) || {}
  const onboarding = {
    guild_id: guildId,
    prompts: body.prompts || [],
    default_channel_ids: body.default_channel_ids || [],
    enabled: Boolean(body.enabled),
    mode: Number(body.mode || 0),
    below_requirements: false,
  }

  await updateGuild(guildId, { onboarding } as any)
  return NextResponse.json(onboarding)
}

export async function PATCH(request: NextRequest, context: Context) {
  return PUT(request, context)
}

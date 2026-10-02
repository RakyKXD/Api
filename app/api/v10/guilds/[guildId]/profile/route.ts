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
    id: guildId,
    name: guild.name,
    icon: guild.icon,
    description: guild.description || '',
    brand_color_primary: '#5865F2',
    game_application_ids: [],
    tag: 'MOCK',
    badge: 1,
    badge_color_primary: '#5865F2',
    badge_color_secondary: '#EB459E',
    traits: [],
    visibility: 1, // 1: PUBLIC
    custom_banner: guild.banner,
  })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    id: guildId,
    name: body.name ?? guild.name,
    icon: body.icon ?? guild.icon,
    description: body.description ?? guild.description ?? '',
    brand_color_primary: body.brand_color_primary ?? '#5865F2',
    game_application_ids: body.game_application_ids ?? [],
    tag: body.tag ?? 'MOCK',
    badge: body.badge ?? 1,
    badge_color_primary: body.badge_color_primary ?? '#5865F2',
    badge_color_secondary: body.badge_color_secondary ?? '#EB459E',
    traits: body.traits ?? [],
    visibility: body.visibility ?? 1,
    custom_banner: body.custom_banner ?? guild.banner,
  })
}

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
    primary_category_id: 1,
    keywords: ['gaming', 'community', 'friendly'],
    emoji_discoverability_enabled: true,
    is_published: true,
    reasons_to_join: [{ reason: 'Active community' }, { reason: 'Weekly events' }],
    social_links: [],
    about: guild.description || 'Welcome to our discoverable community.',
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
    guild_id: guildId,
    primary_category_id: body.primary_category_id ?? 1,
    keywords: body.keywords ?? ['community'],
    emoji_discoverability_enabled: body.emoji_discoverability_enabled ?? true,
    is_published: body.is_published ?? true,
    reasons_to_join: body.reasons_to_join ?? [],
    social_links: body.social_links ?? [],
    about: body.about ?? guild.description ?? '',
  })
}

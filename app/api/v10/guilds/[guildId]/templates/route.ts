import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, getGuild, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const templates = await listCollection('guild_templates')
  const filtered = templates.filter((t) => t.source_guild_id === guildId)
  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const code = Math.random().toString(36).substring(2, 10)
  const template = await createCollectionItem('guild_templates', {
    code,
    name: body?.name || guild.name,
    description: body?.description ?? null,
    usage_count: 0,
    creator_id: '900000000000000001',
    creator: { id: '900000000000000001', username: 'api-bot', discriminator: '0' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source_guild_id: guildId,
    serialized_source_guild: {
      name: guild.name,
      description: guild.description,
      roles: guild.roles,
      channels: guild.channels,
    },
    is_dirty: false,
  })

  return NextResponse.json(template, { status: 201 })
}

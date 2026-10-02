import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const events = await listCollection('scheduled_events')
  const filtered = events.filter((e) => e.guild_id === guildId)
  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const event = await createCollectionItem('scheduled_events', {
    guild_id: guildId,
    channel_id: body.channel_id ?? null,
    creator_id: '900000000000000001',
    name: body.name.trim(),
    description: body.description ?? null,
    scheduled_start_time: body.scheduled_start_time || new Date().toISOString(),
    scheduled_end_time: body.scheduled_end_time ?? null,
    privacy_level: Number(body.privacy_level || 2), // 2: GUILD_ONLY
    status: 1, // 1: SCHEDULED
    entity_type: Number(body.entity_type || 1), // 1: STAGE_INSTANCE, 2: VOICE, 3: EXTERNAL
    entity_metadata: body.entity_metadata ?? null,
    user_count: 1,
  })

  return NextResponse.json(event, { status: 201 })
}

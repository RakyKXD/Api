import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, deleteCollectionItem, listCollection, updateCollectionItem } from '@/lib/discord-store'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || !body.channel_id || !body.topic) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const stage = await createCollectionItem('stage_instances', {
    channel_id: body.channel_id,
    topic: body.topic,
    privacy_level: Number(body.privacy_level || 1), // 1: PUBLIC, 2: GUILD_ONLY
    guild_id: body.guild_id || '100000000000000001',
    guild_scheduled_event_id: null,
  })

  return NextResponse.json(stage, { status: 201 })
}

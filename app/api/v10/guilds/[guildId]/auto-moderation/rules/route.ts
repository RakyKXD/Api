import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const rules = await listCollection('automod_rules')
  const filtered = rules.filter((r) => r.guild_id === guildId)
  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const rule = await createCollectionItem('automod_rules', {
    guild_id: guildId,
    name: body.name.trim(),
    creator_id: '900000000000000001',
    event_type: Number(body.event_type || 1), // 1: MESSAGE_SEND
    trigger_type: Number(body.trigger_type || 1), // 1: KEYWORD
    trigger_metadata: body.trigger_metadata || {},
    actions: Array.isArray(body.actions) ? body.actions : [{ type: 1 }], // 1: BLOCK_MESSAGE
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
    exempt_roles: body.exempt_roles || [],
    exempt_channels: body.exempt_channels || [],
  })

  return NextResponse.json(rule, { status: 201 })
}

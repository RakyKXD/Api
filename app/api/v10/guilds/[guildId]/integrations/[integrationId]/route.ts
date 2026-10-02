import { NextRequest, NextResponse } from 'next/server'
import { getGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; integrationId: string }> }

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId, integrationId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    id: integrationId,
    name: 'Sample Integration',
    type: 'twitch',
    enabled: body.enabled ?? true,
    syncing: false,
    role_id: body.role_id ?? '100000000000000002',
    enable_emoticons: body.enable_emoticons ?? true,
    expire_behavior: body.expire_behavior ?? 0,
    expire_grace_period: body.expire_grace_period ?? 1,
    user: { id: '900000000000000001', username: 'raky', discriminator: '0', avatar: null },
    account: { id: 'sample_account', name: 'sample_account' },
    synced_at: new Date().toISOString(),
    subscriber_count: 10,
    revoked: false,
  })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    id: 'game_invite_' + Date.now(),
    type: 1,
    code: 'game_' + Math.random().toString(36).slice(2, 8),
    inviter: { id: '900000000000000001', username: 'raky', discriminator: '0', avatar: null },
    application_id: body.application_id || '990000000000000001',
    channel_id: body.channel_id || '200000000000000001',
    created_at: new Date().toISOString(),
  })
}

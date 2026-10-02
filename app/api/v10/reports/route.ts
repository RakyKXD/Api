import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    report_id: 'rep_' + Date.now(),
    channel_id: body.channel_id ?? null,
    message_id: body.message_id ?? null,
    guild_id: body.guild_id ?? null,
    reason: body.reason ?? 0,
    status: 'received',
    created_at: new Date().toISOString(),
  })
}

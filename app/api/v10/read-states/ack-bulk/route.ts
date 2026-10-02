import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    channel_id: body.channel_id,
    message_id: body.message_id,
    read_state_type: 0,
    mention_count: 0,
    last_pin_timestamp: null,
  })
}

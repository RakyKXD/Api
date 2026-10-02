import { NextRequest, NextResponse } from 'next/server'

type Context = { params: Promise<{ channelId: string; messageId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  return NextResponse.json({
    token: null,
    mention_count: 0,
    last_pin_timestamp: null,
    last_message_id: messageId,
    id: channelId,
  })
}

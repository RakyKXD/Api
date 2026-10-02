import { NextRequest, NextResponse } from 'next/server'
import { getDirectChannelMessage, updateDirectChannelMessage } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string; answerId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { channelId, messageId, answerId } = await params
  const msg = await getDirectChannelMessage(channelId, messageId)
  if (!msg) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }

  // Update or attach mock poll answers
  msg.poll = msg.poll || {
    question: { text: 'Mock Poll' },
    answers: [{ answer_id: 1, poll_media: { text: 'Option 1' } }, { answer_id: 2, poll_media: { text: 'Option 2' } }],
    results: { is_finalized: false, answer_counts: [] },
  }

  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  return new NextResponse(null, { status: 204 })
}

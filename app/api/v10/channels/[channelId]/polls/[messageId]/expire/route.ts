import { NextRequest, NextResponse } from 'next/server'
import { getDirectChannelMessage } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const msg = await getDirectChannelMessage(channelId, messageId)
  if (!msg) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }

  const poll = {
    question: { text: 'Mock Poll' },
    answers: [{ answer_id: 1, poll_media: { text: 'Option 1' } }, { answer_id: 2, poll_media: { text: 'Option 2' } }],
    results: { is_finalized: true, answer_counts: [{ id: 1, count: 1, mega_voted: false }] },
    expiry: new Date().toISOString(),
  }
  msg.poll = poll

  return NextResponse.json(msg)
}

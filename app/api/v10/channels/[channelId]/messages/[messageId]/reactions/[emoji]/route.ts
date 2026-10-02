import { NextRequest, NextResponse } from 'next/server'
import { clearMessageReactions, listMessageReactions } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string; emoji: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId, messageId, emoji } = await params
  const decodedEmoji = decodeURIComponent(emoji)
  const users = await listMessageReactions(channelId, messageId, decodedEmoji)
  if (users === null) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return NextResponse.json(users)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, messageId, emoji } = await params
  const decodedEmoji = decodeURIComponent(emoji)
  const result = await clearMessageReactions(channelId, messageId, decodedEmoji)
  if (result === null) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

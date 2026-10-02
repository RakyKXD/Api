import { NextRequest, NextResponse } from 'next/server'
import { addMessageReaction, removeMessageReaction } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string; emoji: string; userId: string }> }

export async function PUT(_: NextRequest, { params }: Context) {
  const { channelId, messageId, emoji, userId } = await params
  const decodedEmoji = decodeURIComponent(emoji)
  const targetUser = userId === '@me' ? '900000000000000001' : userId
  const result = await addMessageReaction(channelId, messageId, decodedEmoji, targetUser)
  if (result === null) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, messageId, emoji, userId } = await params
  const decodedEmoji = decodeURIComponent(emoji)
  const targetUser = userId === '@me' ? '900000000000000001' : userId
  const result = await removeMessageReaction(channelId, messageId, decodedEmoji, targetUser)
  if (result === null) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

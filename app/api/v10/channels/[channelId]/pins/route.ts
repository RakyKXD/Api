import { NextRequest, NextResponse } from 'next/server'
import { getDirectChannelMessages, updateDirectChannelMessage } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId?: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const messages = await getDirectChannelMessages(channelId)
  if (!messages) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }
  const pinned = messages.filter((m) => m.pinned === true)
  return NextResponse.json(pinned)
}

export async function PUT(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  if (!messageId) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  const updated = await updateDirectChannelMessage(channelId, messageId, { pinned: true })
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  if (!messageId) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  const updated = await updateDirectChannelMessage(channelId, messageId, { pinned: false })
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

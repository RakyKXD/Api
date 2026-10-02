import { NextRequest, NextResponse } from 'next/server'
import { updateDirectChannelMessage } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string }> }

export async function PUT(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const updated = await updateDirectChannelMessage(channelId, messageId, { pinned: true })
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const updated = await updateDirectChannelMessage(channelId, messageId, { pinned: false })
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

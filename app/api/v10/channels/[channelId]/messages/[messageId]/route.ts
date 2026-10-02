import { NextRequest, NextResponse } from 'next/server'
import { deleteDirectChannelMessage, getDirectChannelMessage, updateDirectChannelMessage } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const message = await getDirectChannelMessage(channelId, messageId)
  if (!message) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return NextResponse.json(message)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body.content !== 'string') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const updated = await updateDirectChannelMessage(channelId, messageId, { content: body.content })
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const deleted = await deleteDirectChannelMessage(channelId, messageId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

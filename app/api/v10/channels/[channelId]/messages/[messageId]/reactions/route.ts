import { NextRequest, NextResponse } from 'next/server'
import { clearMessageReactions } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string }> }

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const result = await clearMessageReactions(channelId, messageId)
  if (result === null) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

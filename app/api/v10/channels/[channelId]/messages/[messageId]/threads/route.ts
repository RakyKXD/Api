import { NextRequest, NextResponse } from 'next/server'
import { createThread, getDirectChannelMessage } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

type Context = { params: Promise<{ channelId: string; messageId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const msg = await getDirectChannelMessage(channelId, messageId)
  if (!msg) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const authorId = getUserIdFromAuth(request)
  const thread = await createThread(channelId, body, messageId, authorId)
  return NextResponse.json(thread, { status: 201 })
}

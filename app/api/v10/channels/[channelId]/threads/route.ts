import { NextRequest, NextResponse } from 'next/server'
import { createThread, findChannelById } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

type Context = { params: Promise<{ channelId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const authorId = getUserIdFromAuth(request)
  const thread = await createThread(channelId, body, undefined, authorId)
  return NextResponse.json(thread, { status: 201 })
}

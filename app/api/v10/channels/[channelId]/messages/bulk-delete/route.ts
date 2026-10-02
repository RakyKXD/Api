import { NextRequest, NextResponse } from 'next/server'
import { bulkDeleteMessages, findChannelById } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const messages = body?.messages
  if (!Array.isArray(messages) || messages.length < 2 || messages.length > 100) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  await bulkDeleteMessages(channelId, messages.map(String))
  return new NextResponse(null, { status: 204 })
}

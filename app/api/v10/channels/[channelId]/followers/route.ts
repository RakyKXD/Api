import { NextRequest, NextResponse } from 'next/server'
import { findChannelById } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found || !found.guildId) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.webhook_channel_id) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  return NextResponse.json({
    channel_id: channelId,
    webhook_id: `${Date.now()}`,
  }, { status: 201 })
}

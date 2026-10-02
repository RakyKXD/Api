import { NextRequest, NextResponse } from 'next/server'
import { ensureDirectChannelForRecipient, listPrivateChannels, getUser } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

export async function GET() {
  const channels = await listPrivateChannels()
  return NextResponse.json(channels)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const recipientId =
    (typeof body?.recipient_id === 'string' && body.recipient_id) ||
    (Array.isArray(body?.recipients) && typeof body.recipients[0] === 'string' && body.recipients[0]) ||
    null

  if (!recipientId) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const channel = await ensureDirectChannelForRecipient(recipientId)
  await broadcastGatewayEvent('CHANNEL_CREATE', channel)

  return NextResponse.json(channel, { status: 200 })
}

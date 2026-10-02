import { NextRequest, NextResponse } from 'next/server'
import { createDirectChannelMessage, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ webhookId: string; webhookToken: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { webhookId, webhookToken } = await params
  const webhooks = await listCollection('webhooks')
  const webhook = webhooks.find((w) => w.id === webhookId && w.token === webhookToken)
  if (!webhook) {
    return NextResponse.json({ message: 'Invalid Webhook Token', code: 50027 }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.content !== 'string' || body.content.trim().length === 0) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const channelId = String(webhook.channel_id)
  const message = await createDirectChannelMessage(channelId, body.content.trim(), '900000000000000001')
  if (message) {
    message.webhook_id = webhookId
    message.author = {
      id: webhookId,
      username: (webhook.name as string) || 'Webhook',
      discriminator: '0000',
      avatar: (webhook.avatar as string) || null,
      bot: true,
    }
  }

  const wait = request.nextUrl.searchParams.get('wait') === 'true'
  return wait ? NextResponse.json(message, { status: 200 }) : new NextResponse(null, { status: 204 })
}

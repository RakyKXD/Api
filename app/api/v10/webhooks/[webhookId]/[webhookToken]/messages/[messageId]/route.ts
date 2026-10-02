import { NextRequest, NextResponse } from 'next/server'
import { deleteDirectChannelMessage, getDirectChannelMessage, listCollection, updateDirectChannelMessage } from '@/lib/discord-store'

type Context = { params: Promise<{ webhookId: string; webhookToken: string; messageId: string }> }

export async function PATCH(request: NextRequest, { params }: Context) {
  const { webhookId, webhookToken, messageId } = await params
  const webhooks = await listCollection('webhooks')
  const webhook = webhooks.find((w) => w.id === webhookId && w.token === webhookToken)
  if (!webhook) {
    return NextResponse.json({ message: 'Invalid Webhook Token', code: 50027 }, { status: 401 })
  }

  const channelId = String(webhook.channel_id)
  const body = await request.json().catch(() => null)
  const updated = await updateDirectChannelMessage(channelId, messageId, { content: body?.content || '' })
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { webhookId, webhookToken, messageId } = await params
  const webhooks = await listCollection('webhooks')
  const webhook = webhooks.find((w) => w.id === webhookId && w.token === webhookToken)
  if (!webhook) {
    return NextResponse.json({ message: 'Invalid Webhook Token', code: 50027 }, { status: 401 })
  }

  const channelId = String(webhook.channel_id)
  const deleted = await deleteDirectChannelMessage(channelId, messageId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

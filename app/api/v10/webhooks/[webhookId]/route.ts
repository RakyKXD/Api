import { NextRequest, NextResponse } from 'next/server'
import { deleteCollectionItem, listCollection, updateCollectionItem } from '@/lib/discord-store'

type Context = { params: Promise<{ webhookId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { webhookId } = await params
  const webhooks = await listCollection('webhooks')
  const webhook = webhooks.find((w) => w.id === webhookId)
  if (!webhook) {
    return NextResponse.json({ message: 'Unknown Webhook', code: 10015 }, { status: 404 })
  }
  return NextResponse.json(webhook)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { webhookId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const updated = await updateCollectionItem('webhooks', webhookId, body)
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Webhook', code: 10015 }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { webhookId } = await params
  const deleted = await deleteCollectionItem('webhooks', webhookId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Webhook', code: 10015 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

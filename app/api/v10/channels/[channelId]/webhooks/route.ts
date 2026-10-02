import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, findChannelById, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  const webhooks = await listCollection('webhooks')
  const channelWebhooks = webhooks.filter((w) => w.channel_id === channelId)
  return NextResponse.json(channelWebhooks)
}

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

  const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  const webhook = await createCollectionItem('webhooks', {
    name: body.name.trim(),
    avatar: body.avatar ?? null,
    channel_id: channelId,
    guild_id: found.guildId,
    type: 1, // Incoming webhook
    token,
    user: { id: '900000000000000001', username: 'api-bot', discriminator: '0', avatar: null },
  })

  return NextResponse.json(webhook, { status: 201 })
}

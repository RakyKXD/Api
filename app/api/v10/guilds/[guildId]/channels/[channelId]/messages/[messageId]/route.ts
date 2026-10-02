import { NextRequest, NextResponse } from 'next/server'
import { deleteMessage, getMessage, updateMessage } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; channelId: string; messageId: string }> }
const unknownMessage = () => NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId, channelId, messageId } = await params
  const message = await getMessage(guildId, channelId, messageId)
  return message ? NextResponse.json(message) : unknownMessage()
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId, channelId, messageId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || typeof body.content !== 'string') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }
  const message = await updateMessage(guildId, channelId, messageId, { content: body.content })
  return message ? NextResponse.json(message) : unknownMessage()
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId, channelId, messageId } = await params
  const deleted = await deleteMessage(guildId, channelId, messageId)
  if (deleted !== true) return unknownMessage()
  return new NextResponse(null, { status: 204 })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: 'GET, PATCH, DELETE, OPTIONS' } })
}

export async function HEAD() {
  return new NextResponse(null, { status: 204 })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createDirectChannelMessage, ensurePrivateChannel, findChannelById, getDirectChannelMessages } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

type Context = { params: Promise<{ channelId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  let messages = await getDirectChannelMessages(channelId)
  if (!messages) {
    // El canal privado que anuncia READY (p. ej. 800000000000000001) no existe en
    // la BD porque lo construye el gateway. Se registra y se responde lista vacía
    // en lugar de 404 "Unknown Channel" (eran los cuatro `GET .../messages 404`
    // del log, incluido el DM abierto en el cliente).
    await ensurePrivateChannel(channelId)
    messages = []
  }

  const query = request.nextUrl.searchParams
  const limit = Math.min(Math.max(Number(query.get('limit') || 50), 1), 100)
  const before = query.get('before')
  const after = query.get('after')
  const around = query.get('around')

  let values = [...messages].sort((a, b) => {
    try {
      const diff = BigInt(String(b.id)) - BigInt(String(a.id))
      return diff > 0n ? 1 : diff < 0n ? -1 : 0
    } catch {
      return new Date(String(b.timestamp || 0)).getTime() - new Date(String(a.timestamp || 0)).getTime()
    }
  })

  if (before) {
    values = values.filter((message) => {
      try {
        return BigInt(String(message.id)) < BigInt(before)
      } catch {
        return String(message.id) < before
      }
    })
  }
  if (after) {
    values = values.filter((message) => {
      try {
        return BigInt(String(message.id)) > BigInt(after)
      } catch {
        return String(message.id) > after
      }
    })
  }
  if (around) {
    const targetIdx = values.findIndex((m) => String(m.id) === around)
    if (targetIdx !== -1) {
      const half = Math.floor(limit / 2)
      const start = Math.max(0, targetIdx - half)
      values = values.slice(start, start + limit)
    }
  }

  return NextResponse.json(values.slice(0, limit))
}

export async function POST(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const content = typeof payload.content === 'string' ? payload.content : ''
  const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0
  const hasStickers = Array.isArray(payload.sticker_ids) && payload.sticker_ids.length > 0
  const hasEmbeds = Array.isArray(payload.embeds) && payload.embeds.length > 0

  if (content.trim().length === 0 && !hasAttachments && !hasStickers && !hasEmbeds) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }
  if (content.length > 2000) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  // The author must be the authenticated user. Passing a fixed id here made
  // every message look like it had been sent from another account.
  const authorId = getUserIdFromAuth(request)
  // Igual que en el GET: el DM que anuncia el gateway todavía no está en la BD,
  // así que primero se registra y después se escribe (antes el POST devolvía 404
  // y el mensaje directo nunca llegaba a la conversación).
  if (!(await findChannelById(channelId))) await ensurePrivateChannel(channelId)
  const created = await createDirectChannelMessage(channelId, content.trim(), authorId, {
    nonce: payload.nonce,
    tts: payload.tts,
    flags: payload.flags,
    embeds: payload.embeds,
    attachments: payload.attachments,
    mentions: payload.mentions,
    components: payload.components,
    allowed_mentions: payload.allowed_mentions,
    message_reference: payload.message_reference,
  })

  if (!created) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }
  return NextResponse.json(created, { status: 201 })
}

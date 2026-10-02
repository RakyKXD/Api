import { NextRequest, NextResponse } from 'next/server'
import { createGuildSticker, getGuild, listGuildStickers } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  const stickers = await listGuildStickers(guildId)
  return NextResponse.json(stickers)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const sticker = await createGuildSticker(guildId, body)
  return NextResponse.json(sticker, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { deleteGuildSticker, getGuild, getGuildSticker } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; stickerId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId, stickerId } = await params
  const sticker = await getGuildSticker(guildId, stickerId)
  if (!sticker) {
    return NextResponse.json({ message: 'Unknown Sticker', code: 10060 }, { status: 404 })
  }
  return NextResponse.json(sticker)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId, stickerId } = await params
  const deleted = await deleteGuildSticker(guildId, stickerId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Sticker', code: 10060 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

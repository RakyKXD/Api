import { NextRequest, NextResponse } from 'next/server'
import { addGuildResource, getGuild, getGuildResource } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'
import { saveBase64Image } from '@/lib/image-helper'

type Context = { params: Promise<{ guildId: string }> }
const unknownGuild = () => NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const emojis = await getGuildResource(guildId, 'emojis')
  return emojis ? NextResponse.json(emojis) : unknownGuild()
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) return unknownGuild()

  const body = await request.json().catch(() => ({}))
  if (typeof body.name !== 'string' || body.name.trim().length < 1) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const emojiId = Date.now().toString()
  if (typeof body.image === 'string' && body.image.startsWith('data:image/')) {
    saveBase64Image(body.image, 'emojis', emojiId)
  }

  const emoji = await addGuildResource(guildId, 'emojis', {
    id: emojiId,
    name: body.name.trim(),
    roles: Array.isArray(body.roles) ? body.roles : [],
    user: { id: '900000000000000001', username: 'api-bot', discriminator: '0' },
    require_colons: true,
    managed: false,
    animated: Boolean(body.animated),
    available: true,
  })

  if (!emoji) return unknownGuild()

  const allEmojis = (await getGuildResource(guildId, 'emojis')) || []
  await broadcastGatewayEvent('GUILD_EMOJIS_UPDATE', {
    guild_id: guildId,
    emojis: allEmojis,
  })

  return NextResponse.json(emoji, { status: 201 })
}

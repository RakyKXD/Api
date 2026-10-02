import { NextRequest, NextResponse } from 'next/server'
import { getGuild, removeGuildResource, updateGuild } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ guildId: string; emojiId: string }> }

const unknownGuild = () => NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
const unknownEmoji = () => NextResponse.json({ message: 'Unknown Emoji', code: 10014 }, { status: 404 })

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId, emojiId } = await params
  const guild = await getGuild(guildId)
  if (!guild) return unknownGuild()

  const emojis = (guild.emojis as Array<Record<string, unknown>>) ?? []
  const emoji = emojis.find((e) => e.id === emojiId)
  return emoji ? NextResponse.json(emoji) : unknownEmoji()
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId, emojiId } = await params
  const guild = await getGuild(guildId)
  if (!guild) return unknownGuild()

  const emojis = ((guild.emojis as Array<Record<string, unknown>>) ?? []).map((e) => ({ ...e }))
  const emoji = emojis.find((e) => e.id === emojiId)
  if (!emoji) return unknownEmoji()

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  if (body.name !== undefined) emoji.name = String(body.name)
  if (Array.isArray(body.roles)) emoji.roles = body.roles

  await updateGuild(guildId, { emojis } as any)
  await broadcastGatewayEvent('GUILD_EMOJIS_UPDATE', { guild_id: guildId, emojis })

  return NextResponse.json(emoji)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId, emojiId } = await params
  const removed = await removeGuildResource(guildId, 'emojis', emojiId)
  if (removed === null) return unknownGuild()
  if (!removed) return unknownEmoji()

  const guild = await getGuild(guildId)
  await broadcastGatewayEvent('GUILD_EMOJIS_UPDATE', {
    guild_id: guildId,
    emojis: (guild?.emojis as Array<Record<string, unknown>>) || [],
  })

  return new NextResponse(null, { status: 204 })
}

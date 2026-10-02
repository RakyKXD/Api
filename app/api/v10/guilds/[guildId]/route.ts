import { NextRequest, NextResponse } from 'next/server'
import { deleteGuild, getGuild, updateGuild } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'
import { saveBase64Image } from '@/lib/image-helper'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  return guild ? NextResponse.json(guild) : NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const body = (await request.json().catch(() => ({}))) || {}

  // Process base64 uploads for icon, banner, and splash
  if (typeof body.icon === 'string' && body.icon.startsWith('data:image/')) {
    body.icon = saveBase64Image(body.icon, 'icons', guildId)
  }
  if (typeof body.banner === 'string' && body.banner.startsWith('data:image/')) {
    body.banner = saveBase64Image(body.banner, 'banners', guildId)
  }
  if (typeof body.splash === 'string' && body.splash.startsWith('data:image/')) {
    body.splash = saveBase64Image(body.splash, 'splashes', guildId)
  }

  if (body.features !== undefined) {
    body.features = Array.from(body.features || [])
  }
  if (body.rulesChannelId) body.rules_channel_id = body.rulesChannelId
  if (body.publicUpdatesChannelId) body.public_updates_channel_id = body.publicUpdatesChannelId
  if (body.safetyAlertsChannelId) body.safety_alerts_channel_id = body.safetyAlertsChannelId
  if (body.preferredLocale) body.preferred_locale = body.preferredLocale

  const guild = await updateGuild(guildId, body)
  if (!guild) return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })

  await broadcastGatewayEvent('GUILD_UPDATE', guild)
  return NextResponse.json(guild)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const deleted = await deleteGuild(guildId)
  if (!deleted) return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  await broadcastGatewayEvent('GUILD_DELETE', { id: guildId })
  return new NextResponse(null, { status: 204 })
}

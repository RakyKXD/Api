import { NextRequest, NextResponse } from 'next/server'
import { deleteGuild } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ guildId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const deleted = await deleteGuild(guildId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  await broadcastGatewayEvent('GUILD_DELETE', { id: guildId, unavailable: false })
  return new NextResponse(null, { status: 204 })
}

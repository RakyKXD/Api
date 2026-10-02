import { NextRequest, NextResponse } from 'next/server'
import { crosspostMessage, findChannelById } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; messageId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { channelId, messageId } = await params
  const found = await findChannelById(channelId)
  if (!found || !found.guildId) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  const crossposted = await crosspostMessage(found.guildId, channelId, messageId)
  if (!crossposted) {
    return NextResponse.json({ message: 'Unknown Message', code: 10008 }, { status: 404 })
  }
  return NextResponse.json(crossposted)
}

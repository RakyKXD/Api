import { NextRequest, NextResponse } from 'next/server'
import { ensurePrivateChannel, findChannelById, updateGuild, readDatabase, writeDatabase } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ channelId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    const created = await ensurePrivateChannel(channelId)
    return NextResponse.json({ ...created, guild_id: null })
  }
  return NextResponse.json({ ...found.channel, guild_id: found.guildId })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  Object.assign(found.channel, body)

  if (found.guild) {
    await updateGuild(found.guildId!, { channels: found.guild.channels })
  } else {
    const db = await readDatabase()
    const dmList = (db.dm_channels as Array<Record<string, unknown>>) || []
    const idx = dmList.findIndex((c) => c.id === channelId)
    if (idx >= 0) {
      dmList[idx] = { ...dmList[idx], ...found.channel }
      await writeDatabase(db)
    }
  }

  const payload = { ...found.channel, guild_id: found.guildId }
  await broadcastGatewayEvent('CHANNEL_UPDATE', payload)
  return NextResponse.json(payload)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  if (found.guild) {
    found.guild.channels = (found.guild.channels || []).filter((c: any) => c.id !== channelId)
    await updateGuild(found.guildId!, { channels: found.guild.channels })
  } else {
    const db = await readDatabase()
    db.dm_channels = ((db.dm_channels as Array<Record<string, unknown>>) || []).filter((c) => c.id !== channelId)
    await writeDatabase(db)
  }

  const payload = { ...found.channel, guild_id: found.guildId }
  await broadcastGatewayEvent('CHANNEL_DELETE', payload)
  return NextResponse.json(payload)
}

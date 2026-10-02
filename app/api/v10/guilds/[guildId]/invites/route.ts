import { NextRequest, NextResponse } from 'next/server'
import { getGuild, readDatabase, createInvite } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const database = await readDatabase()
  const invites = (database.invites as Array<Record<string, unknown>> | undefined) || []
  const filtered = invites.filter((inv) => {
    const invGuild = inv.guild as Record<string, unknown> | undefined
    return invGuild?.id === guildId
  })

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) || {}
  const channelId = body.channel_id || guild.channels?.[0]?.id || guildId
  const invite = await createInvite(channelId, body)
  return NextResponse.json(invite, { status: 201 })
}

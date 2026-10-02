import { NextRequest, NextResponse } from 'next/server'
import { createGuildBan, getGuild, getGuildBan, removeGuildBan } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; userId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }
  const ban = await getGuildBan(guildId, userId)
  if (!ban) {
    return NextResponse.json({ message: 'Unknown Ban', code: 10026 }, { status: 404 })
  }
  return NextResponse.json(ban)
}

export async function PUT(request: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const deleteSeconds = Number(body.delete_message_seconds || (body.delete_message_days ? body.delete_message_days * 86400 : 0))
  const ban = await createGuildBan(guildId, userId, body.reason, deleteSeconds)
  return NextResponse.json(ban, { status: 201 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const removed = await removeGuildBan(guildId, userId)
  if (!removed) {
    return NextResponse.json({ message: 'Unknown Ban', code: 10026 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

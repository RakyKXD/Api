import { NextRequest, NextResponse } from 'next/server'
import { findChannelById } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; overwriteId: string }> }

export async function PUT(request: NextRequest, { params }: Context) {
  const { channelId, overwriteId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  found.channel.permission_overwrites = Array.isArray(found.channel.permission_overwrites)
    ? found.channel.permission_overwrites
    : []

  const overwrites = found.channel.permission_overwrites as Array<Record<string, unknown>>
  const index = overwrites.findIndex((o) => o.id === overwriteId)
  const item = {
    id: overwriteId,
    type: Number(body?.type || 0), // 0: role, 1: member
    allow: String(body?.allow || '0'),
    deny: String(body?.deny || '0'),
  }

  if (index >= 0) {
    overwrites[index] = item
  } else {
    overwrites.push(item)
  }

  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, overwriteId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  if (Array.isArray(found.channel.permission_overwrites)) {
    found.channel.permission_overwrites = (found.channel.permission_overwrites as Array<Record<string, unknown>>).filter(
      (o) => o.id !== overwriteId
    )
  }

  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createInvite, findChannelById } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    return NextResponse.json({ message: 'Unknown Channel', code: 10003 }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const invite = await createInvite(channelId, body)
  return NextResponse.json(invite, { status: 200 })
}

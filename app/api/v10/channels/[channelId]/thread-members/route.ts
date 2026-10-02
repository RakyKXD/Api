import { NextRequest, NextResponse } from 'next/server'
import { listThreadMembers } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const members = await listThreadMembers(channelId)
  return NextResponse.json(members)
}

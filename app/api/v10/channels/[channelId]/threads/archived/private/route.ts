import { NextRequest, NextResponse } from 'next/server'
import { listChannelThreads } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const threads = await listChannelThreads(channelId)
  return NextResponse.json({
    threads: threads.filter((t) => (t.thread_metadata as Record<string, unknown>)?.archived && t.type === 12),
    members: [],
    has_more: false,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { listChannelThreads, readDatabase } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const threads = await listChannelThreads(channelId)
  const activeThreads = threads.filter((t) => !(t.thread_metadata as Record<string, unknown>)?.archived)
  const threadIds = new Set(activeThreads.map((t) => String(t.id)))
  const database = await readDatabase()
  const allMembers = (database.thread_members as Array<Record<string, unknown>> | undefined) ?? []
  const members = allMembers.filter((m) => threadIds.has(String(m.id || m.thread_id)))

  return NextResponse.json({
    threads: activeThreads,
    members,
    has_more: false,
  })
}

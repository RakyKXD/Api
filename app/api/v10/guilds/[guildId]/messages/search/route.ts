import { NextRequest, NextResponse } from 'next/server'
import { getGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const query = request.nextUrl.searchParams.get('content') || request.nextUrl.searchParams.get('author_id')
  const messages = (guild.messages || []) as Array<Record<string, unknown>>
  const filtered = messages.filter((m) => {
    if (!query) return true
    const matchesContent = typeof m.content === 'string' && m.content.toLowerCase().includes(query.toLowerCase())
    const matchesAuthor = m.author && (m.author as Record<string, unknown>).id === query
    return matchesContent || matchesAuthor
  })

  return NextResponse.json({
    total_results: filtered.length,
    messages: filtered.map((m) => [m]),
  })
}

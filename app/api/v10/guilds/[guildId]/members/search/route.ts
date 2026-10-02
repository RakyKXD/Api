import { NextRequest, NextResponse } from 'next/server'
import { getGuild, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const query = typeof body?.query === 'string' ? body.query.trim().toLowerCase() : ''
  const limit = typeof body?.limit === 'number' && body.limit > 0 ? Math.min(body.limit, 1000) : 1000

  let members = Array.isArray(guild.members) ? [...guild.members] : []
  if (members.length === 0) {
    const allUsers = await listCollection('users')
    members = allUsers.map((u) => ({
      user: u,
      roles: [],
      joined_at: new Date().toISOString(),
      deaf: false,
      mute: false,
    }))
  }

  if (query) {
    members = members.filter((m: any) => {
      const u = m.user as Record<string, unknown> | undefined
      const username = String(u?.username ?? '').toLowerCase()
      const globalName = String(u?.global_name ?? '').toLowerCase()
      const nick = String(m.nick ?? '').toLowerCase()
      return username.includes(query) || globalName.includes(query) || nick.includes(query)
    })
  }

  const paged = members.slice(0, limit)
  const formatted = paged.map((m) => ({
    member: m,
    source_invite_code: null,
    join_type: 0,
    inviter_id: null,
  }))

  return NextResponse.json({
    guild_id: guildId,
    members: formatted,
    page_result_count: formatted.length,
    total_result_count: members.length,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { listUserGuilds } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const guilds = await listUserGuilds(userId)
  // Return partial guild objects expected by Discord client
  const partialGuilds = guilds.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    owner: g.owner_id === userId,
    permissions: g.permissions ?? '1071698660929',
    features: g.features ?? [],
    approximate_member_count: Array.isArray(g.members) ? g.members.length : 1,
    approximate_presence_count: 1,
  }))
  return NextResponse.json(partialGuilds)
}

import { NextRequest, NextResponse } from 'next/server'
import { addGuildResource, getGuildResource } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }
const unknownGuild = () => NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })

export async function GET(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const members = await getGuildResource(guildId, 'members')
  if (!members) return unknownGuild()
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') || 1000), 1), 1000)
  return NextResponse.json(members.slice(0, limit))
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const body = await request.json().catch(() => ({}))
  if (!body.user || typeof body.user.id !== 'string') return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  const member = await addGuildResource(guildId, 'members', { user: body.user, nick: body.nick ?? null, roles: Array.isArray(body.roles) ? body.roles : [], joined_at: new Date().toISOString(), deaf: false, mute: false, flags: 0 })
  return member ? NextResponse.json(member, { status: 201 }) : unknownGuild()
}

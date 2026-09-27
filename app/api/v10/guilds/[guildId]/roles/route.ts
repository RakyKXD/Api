import { NextRequest, NextResponse } from 'next/server'
import { addGuildResource, getGuildResource } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }
const unknownGuild = () => NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })

export async function GET(_: NextRequest, { params }: Context) {
  const roles = await getGuildResource((await params).guildId, 'roles')
  return roles ? NextResponse.json(roles) : unknownGuild()
}

export async function POST(request: NextRequest, { params }: Context) {
  const body = await request.json().catch(() => ({}))
  if (typeof body.name !== 'string' || body.name.trim().length < 1) return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  const role = await addGuildResource((await params).guildId, 'roles', { name: body.name.trim(), color: Number(body.color) || 0, hoist: Boolean(body.hoist), position: 0, permissions: String(body.permissions || '0'), managed: false, mentionable: Boolean(body.mentionable), tags: body.tags ?? undefined })
  return role ? NextResponse.json(role, { status: 201 }) : unknownGuild()
}

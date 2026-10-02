import { NextRequest, NextResponse } from 'next/server'
import { addGuildResource, getGuild, getGuildResource, updateGuild } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ guildId: string }> }
const unknownGuild = () => NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })

export async function GET(_: NextRequest, { params }: Context) {
  const roles = await getGuildResource((await params).guildId, 'roles')
  return roles ? NextResponse.json(roles) : unknownGuild()
}

export async function POST(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) return unknownGuild()

  const body = await request.json().catch(() => ({}))
  const roles = (guild.roles as Array<Record<string, unknown>>) || []
  const name = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : 'new role'

  const role = await addGuildResource(guildId, 'roles', {
    name,
    color: Number(body.color) || 0,
    hoist: Boolean(body.hoist),
    position: roles.length,
    permissions: String(body.permissions || '0'),
    managed: false,
    mentionable: Boolean(body.mentionable),
    tags: body.tags ?? undefined,
  })

  if (!role) return unknownGuild()

  await broadcastGatewayEvent('GUILD_ROLE_CREATE', {
    guild_id: guildId,
    role,
  })

  return NextResponse.json(role, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) return unknownGuild()

  const updates = await request.json().catch(() => [])
  if (!Array.isArray(updates)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const roles = ((guild.roles as Array<Record<string, unknown>>) || []).map((r) => ({ ...r }))
  for (const update of updates) {
    if (!update || typeof update !== 'object') continue
    const r = roles.find((role) => role.id === update.id)
    if (r) {
      if (typeof update.position === 'number') r.position = update.position
      if (typeof update.hoist === 'boolean') r.hoist = update.hoist
      if (typeof update.mentionable === 'boolean') r.mentionable = update.mentionable
      await broadcastGatewayEvent('GUILD_ROLE_UPDATE', { guild_id: guildId, role: r })
    }
  }

  roles.sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
  await updateGuild(guildId, { roles } as any)
  return NextResponse.json(roles)
}

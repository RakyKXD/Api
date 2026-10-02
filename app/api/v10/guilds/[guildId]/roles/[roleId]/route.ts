import { NextRequest, NextResponse } from 'next/server'
import { getGuild, removeGuildResource, updateGuild } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ guildId: string; roleId: string }> }

const unknownGuild = () => NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
const unknownRole = () => NextResponse.json({ message: 'Unknown Role', code: 10011 }, { status: 404 })

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId, roleId } = await params
  const guild = await getGuild(guildId)
  if (!guild) return unknownGuild()
  const roles = (guild.roles as Array<Record<string, unknown>>) ?? []
  const role = roles.find((r) => r.id === roleId)
  return role ? NextResponse.json(role) : unknownRole()
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId, roleId } = await params
  const guild = await getGuild(guildId)
  if (!guild) return unknownGuild()

  const roles = ((guild.roles as Array<Record<string, unknown>>) ?? []).map((r) => ({ ...r }))
  const role = roles.find((r) => r.id === roleId)
  if (!role) return unknownRole()

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  if (body.name !== undefined) role.name = String(body.name)
  if (body.color !== undefined) role.color = Number(body.color)
  if (body.hoist !== undefined) role.hoist = Boolean(body.hoist)
  if (body.permissions !== undefined) role.permissions = String(body.permissions)
  if (body.mentionable !== undefined) role.mentionable = Boolean(body.mentionable)
  if (body.icon !== undefined) role.icon = body.icon
  if (body.unicode_emoji !== undefined) role.unicode_emoji = body.unicode_emoji

  await updateGuild(guildId, { roles } as any)
  await broadcastGatewayEvent('GUILD_ROLE_UPDATE', { guild_id: guildId, role })

  return NextResponse.json(role)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId, roleId } = await params
  const removed = await removeGuildResource(guildId, 'roles', roleId)
  if (removed === null) return unknownGuild()
  if (!removed) return unknownRole()

  await broadcastGatewayEvent('GUILD_ROLE_DELETE', { guild_id: guildId, role_id: roleId })
  return new NextResponse(null, { status: 204 })
}

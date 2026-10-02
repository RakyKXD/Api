import { NextRequest, NextResponse } from 'next/server'
import { getGuildResource, removeMember, updateMember, getUser } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ guildId: string; userId: string }> }
const error = (code: number, message: string, status: number) => NextResponse.json({ code, message }, { status })

async function findMember(guildId: string, userId: string) {
  const members = await getGuildResource(guildId, 'members')
  if (!members) return { members: null, member: null }
  return { members, member: members.find((value) => ((value as Record<string, unknown>).user as Record<string, unknown> | undefined)?.id === userId) ?? null }
}

export async function GET(request: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const targetUserId = userId === '@me' ? getUserIdFromAuth(request) : userId
  const result = await findMember(guildId, targetUserId)
  if (!result.members) return error(10004, 'Unknown Guild', 404)
  return result.member ? NextResponse.json(result.member) : error(10007, 'Unknown Member', 404)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const targetUserId = userId === '@me' ? getUserIdFromAuth(request) : userId
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || (body.nick !== undefined && typeof body.nick !== 'string' && body.nick !== null) || (body.roles !== undefined && !Array.isArray(body.roles))) return error(50035, 'Invalid Form Body', 400)
  const result = await findMember(guildId, targetUserId)
  if (!result.members) return error(10004, 'Unknown Guild', 404)
  let member = result.member
  if (!member) {
    const user = (await getUser(targetUserId)) || (await getUser('900000000000000001'))
    member = {
      user,
      nick: null,
      avatar: null,
      banner: null,
      bio: '',
      roles: [],
      joined_at: new Date().toISOString(),
      deaf: false,
      mute: false,
      pending: false
    }
  }
  const updatedMember = await updateMember(guildId, targetUserId, body as Record<string, unknown>)
  const finalMember = updatedMember || { ...member, ...body }
  await broadcastGatewayEvent('GUILD_MEMBER_UPDATE', {
    guild_id: guildId,
    user: (finalMember as Record<string, unknown>).user,
    nick: (finalMember as Record<string, unknown>).nick,
    avatar: (finalMember as Record<string, unknown>).avatar,
    roles: (finalMember as Record<string, unknown>).roles,
    joined_at: (finalMember as Record<string, unknown>).joined_at,
  })
  return NextResponse.json(finalMember)
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const targetUserId = userId === '@me' ? getUserIdFromAuth(request) : userId
  const removed = await removeMember(guildId, targetUserId)
  if (removed === null) return error(10004, 'Unknown Guild', 404)
  if (!removed) return error(10007, 'Unknown Member', 404)
  return new NextResponse(null, { status: 204 })
}

/* ---------------------------------------------------------------------------
 * PUT /guilds/{id}/members/@me?lurker=true
 *
 * El cliente lo llama al abrir cada servidor y este archivo sólo exportaba
 * GET/PATCH/DELETE, así que Next respondía 405 Method Not Allowed en cada cambio
 * de servidor (visible en client-api-calls.log como `PUT 405 .../members/@me`).
 * El modo lurker no modifica el miembro: basta con confirmar el 204.
 * ------------------------------------------------------------------------- */
export async function PUT(_: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const result = await findMember(guildId, userId)
  if (!result.members) return error(10004, 'Unknown Guild', 404)
  if (!result.member && userId !== '@me') return error(10007, 'Unknown Member', 404)
  return new NextResponse(null, { status: 204 })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

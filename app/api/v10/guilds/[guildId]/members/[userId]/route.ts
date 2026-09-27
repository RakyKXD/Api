import { NextRequest, NextResponse } from 'next/server'
import { getGuildResource, removeMember, updateMember } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; userId: string }> }
const error = (code: number, message: string, status: number) => NextResponse.json({ code, message }, { status })

async function findMember(guildId: string, userId: string) {
  const members = await getGuildResource(guildId, 'members')
  if (!members) return { members: null, member: null }
  return { members, member: members.find((value) => ((value as Record<string, unknown>).user as Record<string, unknown> | undefined)?.id === userId) ?? null }
}

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const result = await findMember(guildId, userId)
  if (!result.members) return error(10004, 'Unknown Guild', 404)
  return result.member ? NextResponse.json(result.member) : error(10007, 'Unknown Member', 404)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || (body.nick !== undefined && typeof body.nick !== 'string' && body.nick !== null) || (body.roles !== undefined && !Array.isArray(body.roles))) return error(50035, 'Invalid Form Body', 400)
  const result = await findMember(guildId, userId)
  if (!result.members) return error(10004, 'Unknown Guild', 404)
  if (!result.member) return error(10007, 'Unknown Member', 404)
  const member = await updateMember(guildId, userId, body as Record<string, unknown>)
  return member ? NextResponse.json(member) : error(10007, 'Unknown Member', 404)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId, userId } = await params
  const removed = await removeMember(guildId, userId)
  if (removed === null) return error(10004, 'Unknown Guild', 404)
  if (!removed) return error(10007, 'Unknown Member', 404)
  return new NextResponse(null, { status: 204 })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

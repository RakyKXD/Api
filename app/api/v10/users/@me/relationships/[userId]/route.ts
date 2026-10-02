import { NextRequest, NextResponse } from 'next/server'
import { deleteRelationship, getUser, setRelationship } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ userId: string }> }

export async function PUT(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  const body = await request.json().catch(() => ({}))
  const type = typeof body?.type === 'number' ? body.type : 1 // 1: Friend, 2: Blocked

  await setRelationship(userId, type, null, currentUserId)
  // La lista de amigos se pinta con el eco del gateway: sin RELATIONSHIP_ADD el
  // amigo aceptado no aparecía hasta recargar la página.
  const user = await getUser(userId)
  await broadcastGatewayEvent('RELATIONSHIP_ADD', {
    id: userId,
    type,
    nickname: null,
    user: user ?? { id: userId, username: 'user', discriminator: '0', global_name: null, avatar: null, bot: false },
    user_id: currentUserId,
  })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  const body = await request.json().catch(() => null)
  const nickname = typeof body?.nickname === 'string' ? body.nickname : null

  await setRelationship(userId, 1, nickname, currentUserId)
  const user = await getUser(userId)
  await broadcastGatewayEvent('RELATIONSHIP_UPDATE', {
    id: userId,
    type: 1,
    nickname,
    user: user ?? { id: userId, username: 'user', discriminator: '0', global_name: null, avatar: null, bot: false },
    user_id: currentUserId,
  })
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  await deleteRelationship(userId, currentUserId)
  // Éste era el caso "no deja quitar amigos": el DELETE sí borraba en la BD, pero
  // sin RELATIONSHIP_REMOVE el cliente seguía mostrando al amigo en la lista.
  await broadcastGatewayEvent('RELATIONSHIP_REMOVE', { id: userId, type: 1, user_id: currentUserId, nickname: null })
  return new NextResponse(null, { status: 204 })
}

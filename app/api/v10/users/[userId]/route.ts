import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

import { saveBase64Image } from '@/lib/image-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ userId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const targetId = userId === '@me' ? getUserIdFromAuth(request) : userId
  const user = (await getUser(targetId)) || (await getUser('900000000000000001'))
  return user ? NextResponse.json(user) : NextResponse.json({ message: 'Unknown User', code: 10013 }, { status: 404 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  const targetId = userId === '@me' ? currentUserId : userId
  if (targetId !== currentUserId) {
    return NextResponse.json({ message: 'Cannot modify another user', code: 50003 }, { status: 403 })
  }
  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  if (typeof input.avatar === 'string' && input.avatar.startsWith('data:image/')) {
    input.avatar = saveBase64Image(input.avatar, 'avatars', targetId)
  }
  if (typeof input.banner === 'string' && input.banner.startsWith('data:image/')) {
    input.banner = saveBase64Image(input.banner, 'banners', targetId)
  }

  const updated = await updateUser(targetId, input)
  if (updated) {
    await broadcastGatewayEvent('USER_UPDATE', updated)
  }
  return NextResponse.json(updated)
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'GET, PATCH, DELETE, OPTIONS' },
  })
}


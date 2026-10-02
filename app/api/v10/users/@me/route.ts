import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { saveBase64Image } from '@/lib/image-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const user = (await getUser(userId)) || (await getUser('900000000000000001'))
  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }
  const userId = getUserIdFromAuth(request)

  if (typeof body.avatar === 'string' && body.avatar.startsWith('data:image/')) {
    body.avatar = saveBase64Image(body.avatar, 'avatars', userId)
  }
  if (typeof body.banner === 'string' && body.banner.startsWith('data:image/')) {
    body.banner = saveBase64Image(body.banner, 'banners', userId)
  }

  const updated = await updateUser(userId, body)
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

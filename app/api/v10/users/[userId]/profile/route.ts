import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile, updateUserProfile } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { saveBase64Image } from '@/lib/image-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ userId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  const targetId = userId === '@me' ? currentUserId : userId
  const profile = await getUserProfile(targetId, currentUserId)

  return profile
    ? NextResponse.json(profile)
    : NextResponse.json({ message: 'Unknown User', code: 10013 }, { status: 404 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  const targetId = userId === '@me' ? currentUserId : userId

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  if (typeof body.banner === 'string' && body.banner.startsWith('data:image/')) {
    body.banner = saveBase64Image(body.banner, 'banners', targetId)
  }

  const updatedProfile = await updateUserProfile(targetId, body)
  if (updatedProfile) {
    await broadcastGatewayEvent('USER_UPDATE', { id: targetId, ...body })
  }

  return NextResponse.json(updatedProfile)
}

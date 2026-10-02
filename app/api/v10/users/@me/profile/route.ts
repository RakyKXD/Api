import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile, updateUserProfile } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { saveBase64Image } from '@/lib/image-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const profile = await getUserProfile(userId, userId)
  return profile
    ? NextResponse.json(profile)
    : NextResponse.json({ message: 'Unknown User', code: 10013 }, { status: 404 })
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const userId = getUserIdFromAuth(request)

  if (typeof body.banner === 'string' && body.banner.startsWith('data:image/')) {
    body.banner = saveBase64Image(body.banner, 'banners', userId)
  }

  const updatedProfile = await updateUserProfile(userId, body)
  if (updatedProfile) {
    await broadcastGatewayEvent('USER_UPDATE', { id: userId, ...body })
  }

  return NextResponse.json(updatedProfile)
}

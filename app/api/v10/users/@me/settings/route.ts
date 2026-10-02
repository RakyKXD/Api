import { NextRequest, NextResponse } from 'next/server'
import { getUserSettings, updateUserSettings } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const settings = await getUserSettings(userId)
  return NextResponse.json(settings)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const userId = getUserIdFromAuth(request)
  const updated = await updateUserSettings(userId, body as Record<string, unknown>)
  return NextResponse.json(updated)
}

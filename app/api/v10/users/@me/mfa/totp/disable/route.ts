import { NextRequest, NextResponse } from 'next/server'
import { updateUser } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.code) {
    return NextResponse.json({ message: 'Invalid Two-Factor Code', code: 60008 }, { status: 400 })
  }

  const userId = getUserIdFromAuth(request)
  await updateUser(userId, { mfa_enabled: false })
  return NextResponse.json({
    token: 'mock_discord_token_' + Date.now(),
  })
}

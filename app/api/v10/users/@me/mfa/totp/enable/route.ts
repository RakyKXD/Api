import { NextRequest, NextResponse } from 'next/server'
import { updateUser } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.code || !body?.secret) {
    return NextResponse.json({ message: 'Invalid Two-Factor Code', code: 60008 }, { status: 400 })
  }

  const userId = getUserIdFromAuth(request)
  await updateUser(userId, { mfa_enabled: true })
  return NextResponse.json({
    token: 'mfa.mock_discord_mfa_token_' + Date.now(),
    backup_codes: [
      { code: 'a1b2c3d4', consumed: false },
      { code: 'e5f6g7h8', consumed: false },
      { code: 'i9j0k1l2', consumed: false },
      { code: 'm3n4o5p6', consumed: false },
    ],
  })
}

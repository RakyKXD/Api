import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/discord-store'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const code = body?.code
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ message: 'Invalid Two-Factor Code', code: 60008 }, { status: 400 })
  }

  const token = 'mfa.mock_discord_mfa_token_' + Date.now()
  const user = await getUser('900000000000000001')
  return NextResponse.json({ token, user_id: '900000000000000001', user })
}

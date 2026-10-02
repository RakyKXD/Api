import { NextRequest, NextResponse } from 'next/server'
import { updateUser } from '@/lib/discord-store'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || !body.username) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const userId = `${Date.now()}`
  await updateUser(userId, {
    username: body.username,
    discriminator: '0',
    global_name: body.global_name || body.username,
    email: body.email || `${body.username}@mock.local`,
    avatar: null,
    bot: false,
    flags: 0,
    verified: true,
    // Nunca Nitro por defecto: la suscripción se obtiene comprándola o canjeando
    // un regalo (GET/POST /entitlements/gift-codes), nunca al crear la cuenta.
    premium_type: 0,
    premium_since: null,
  })

  const { getUser } = await import('@/lib/discord-store')
  const user = await getUser(userId)
  const token = 'mfa.mock_discord_token_' + Buffer.from(userId).toString('base64')
  return NextResponse.json({
    token,
    user_id: userId,
    user,
    user_settings: { locale: 'en-US', theme: 'dark' },
    captcha_key: null,
  }, { status: 201 })
}

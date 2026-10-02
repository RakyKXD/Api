import { NextRequest, NextResponse } from 'next/server'
import { readDatabase, getUser } from '@/lib/discord-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const login = body?.login || body?.email || 'user'
    const password = body?.password

    if (!login || !password) {
      return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
    }

    const database = await readDatabase()
    const loginStr = String(login).toLowerCase()
    const userMatch = (database.users || []).find(
      (u: any) => (typeof u.email === 'string' && u.email.toLowerCase() === loginStr) ||
             (typeof u.username === 'string' && u.username.toLowerCase() === loginStr) ||
             String(u.id) === loginStr
    )

    const userId = userMatch ? String(userMatch.id) : '900000000000000001'
    const user = await getUser(userId)

    const token = 'mfa.mock_discord_token_' + Buffer.from(userId).toString('base64')

    return NextResponse.json({
      token,
      user_id: userId,
      user,
      user_settings: { locale: 'en-US', theme: 'dark' },
      captcha_key: null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auth/login error]:', message)
    return NextResponse.json({ message, error: 'Internal Server Error' }, { status: 500 })
  }
}

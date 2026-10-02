import { NextRequest } from 'next/server'

export function getUserIdFromAuth(request: NextRequest): string {
  const auth = request.headers.get('authorization')
  if (auth) {
    const raw = auth.replace(/^(Bearer|Bot)\s+/i, '').trim()
    // Si ya es un ID numérico directo (snowflake)
    if (/^\d{10,25}$/.test(raw)) {
      return raw
    }

    const tokenPayload = raw.replace(/^mfa\.mock_discord_token_/, '')
    try {
      const decoded = Buffer.from(tokenPayload, 'base64').toString('utf8')
      if (decoded && /^\d{10,25}$/.test(decoded)) {
        return decoded
      }
    } catch {}

    // Si es otro formato numérico
    if (/^\d+$/.test(raw)) {
      return raw
    }
  }
  return '900000000000000001'
}

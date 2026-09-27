import { NextRequest, NextResponse } from 'next/server'

export const BOT_USER = { id: '900000000000000001', username: 'api-bot', discriminator: '0000', global_name: 'API Bot', bot: true, flags: 0 }

export function discordError(message: string, code: number, status = 400, errors?: unknown) {
  return NextResponse.json(errors ? { message, code, errors } : { message, code }, { status })
}

export function json<T>(value: T, status = 200) { return NextResponse.json(value, { status }) }

export function auth(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header) return BOT_USER
  const [scheme, token] = header.split(/\s+/, 2)
  if (scheme?.toLowerCase() !== 'bot' && scheme?.toLowerCase() !== 'bearer') return null
  return token ? BOT_USER : null
}

export async function body(request: NextRequest) { return request.json().catch(() => null) as Promise<Record<string, unknown> | null> }

export function requireAuth(request: NextRequest) { return auth(request) ?? discordError('401: Unauthorized', 0, 401) }

export function id() { return `${Date.now()}${Math.floor(Math.random() * 1000)}` }

export function paginate<T>(items: T[], request: NextRequest) {
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') || 50), 1), 100)
  const before = request.nextUrl.searchParams.get('before')
  const after = request.nextUrl.searchParams.get('after')
  let result = items
  if (before) result = result.filter((item) => String((item as Record<string, unknown>).id) < before)
  if (after) result = result.filter((item) => String((item as Record<string, unknown>).id) > after)
  return result.slice(0, limit)
}

export const headers = { 'X-RateLimit-Limit': '50', 'X-RateLimit-Remaining': '49', 'X-RateLimit-Reset-After': '1' }
export function withHeaders(response: NextResponse) { for (const [key, value] of Object.entries(headers)) response.headers.set(key, value); return response }

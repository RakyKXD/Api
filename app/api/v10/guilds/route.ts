import { NextRequest, NextResponse } from 'next/server'
import { createGuild, listGuilds } from '@/lib/discord-store'

export async function GET() { return NextResponse.json(await listGuilds()) }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  return NextResponse.json(await createGuild(body), { status: 201 })
}

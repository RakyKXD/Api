import { NextRequest, NextResponse } from 'next/server'
import { createGuild, listGuilds } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export async function GET() { return NextResponse.json(await listGuilds()) }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 1) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }
  const userId = getUserIdFromAuth(request)
  const guild = await createGuild(body, userId)
  return NextResponse.json(guild, { status: 201 })
}

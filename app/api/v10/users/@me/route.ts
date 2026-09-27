import { NextResponse } from 'next/server'
import { getUser, listUserGuilds } from '@/lib/discord-store'

export async function GET() {
  return NextResponse.json(await getUser('900000000000000001'))
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ id: '900000000000000001', username: body.username || 'api-bot', discriminator: '0000', global_name: body.global_name || body.username || 'API Bot', bot: true, flags: 0 })
}

export async function DELETE() { return new NextResponse(null, { status: 204 }) }

export async function OPTIONS() { return NextResponse.json({ methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'] }) }

export async function getCurrentUserGuilds() { return listUserGuilds('900000000000000001') }

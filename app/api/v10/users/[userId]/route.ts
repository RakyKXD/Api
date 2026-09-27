import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/discord-store'

type Context = { params: Promise<{ userId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { userId } = await params
  const user = await getUser(userId === '@me' ? '900000000000000001' : userId)
  return user ? NextResponse.json(user) : NextResponse.json({ message: 'Unknown User', code: 10013 }, { status: 404 })
}

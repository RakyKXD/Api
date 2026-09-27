import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser } from '@/lib/discord-store'

type Context = { params: Promise<{ userId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { userId } = await params
  const user = await getUser(userId === '@me' ? '900000000000000001' : userId)
  return user ? NextResponse.json(user) : NextResponse.json({ message: 'Unknown User', code: 10013 }, { status: 404 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { userId } = await params
  if (userId !== '@me') return NextResponse.json({ message: 'Cannot modify another user', code: 50003 }, { status: 403 })
  const input = await request.json().catch(() => null)
  if (!input || typeof input !== 'object' || Array.isArray(input)) return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  const user = await updateUser('900000000000000001', input as Record<string, unknown>)
  return NextResponse.json(user)
}

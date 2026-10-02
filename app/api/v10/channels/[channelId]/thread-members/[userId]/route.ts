import { NextRequest, NextResponse } from 'next/server'
import { addThreadMember, getThreadMember, removeThreadMember } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string; userId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId, userId } = await params
  const targetUser = userId === '@me' ? '900000000000000001' : userId
  const member = await getThreadMember(channelId, targetUser)
  if (!member) {
    return NextResponse.json({ message: 'Unknown Member', code: 10007 }, { status: 404 })
  }
  return NextResponse.json(member)
}

export async function PUT(_: NextRequest, { params }: Context) {
  const { channelId, userId } = await params
  const targetUser = userId === '@me' ? '900000000000000001' : userId
  await addThreadMember(channelId, targetUser)
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId, userId } = await params
  const targetUser = userId === '@me' ? '900000000000000001' : userId
  const removed = await removeThreadMember(channelId, targetUser)
  if (!removed) {
    return NextResponse.json({ message: 'Unknown Member', code: 10007 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

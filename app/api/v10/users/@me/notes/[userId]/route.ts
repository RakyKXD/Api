import { NextRequest, NextResponse } from 'next/server'
import { getUserNote, setUserNote } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

type Context = { params: Promise<{ userId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  const note = await getUserNote(userId, currentUserId)
  return NextResponse.json({
    user_id: userId,
    note_user_id: currentUserId,
    note,
  })
}

export async function PUT(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  const body = await request.json().catch(() => null)
  const noteContent = typeof body?.note === 'string' ? body.note : ''
  await setUserNote(userId, noteContent, currentUserId)
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { userId } = await params
  const currentUserId = getUserIdFromAuth(request)
  await setUserNote(userId, '', currentUserId)
  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'
import { getForumMessageKarma, voteForumMessage } from '@/lib/raky-service'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ channelId: string; messageId: string }> }
) {
  const { channelId, messageId } = await params
  const karma = await getForumMessageKarma(channelId, messageId)
  return NextResponse.json(karma)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string; messageId: string }> }
) {
  const { channelId, messageId } = await params
  const userId = getUserIdFromAuth(request) || '900000000000000001'
  try {
    const body = await request.json()
    const vote = Number(body.vote)
    if (![1, -1, 0].includes(vote)) {
      return NextResponse.json({ error: 'Voto inválido' }, { status: 400 })
    }
    const updated = await voteForumMessage(channelId, messageId, userId, vote as 1 | -1 | 0)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

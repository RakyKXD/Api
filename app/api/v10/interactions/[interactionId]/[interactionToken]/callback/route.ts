import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem } from '@/lib/discord-store'

type Context = { params: Promise<{ interactionId: string; interactionToken: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { interactionId, interactionToken } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body.type !== 'number') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  // Discord interaction response types:
  // 1: PONG, 4: CHANNEL_MESSAGE_WITH_SOURCE, 5: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, 6: DEFERRED_UPDATE_MESSAGE, 7: UPDATE_MESSAGE, 9: MODAL
  await createCollectionItem('interaction_responses', {
    interaction_id: interactionId,
    token: interactionToken,
    type: body.type,
    data: body.data ?? null,
    created_at: new Date().toISOString(),
  })

  return new NextResponse(null, { status: 204 })
}

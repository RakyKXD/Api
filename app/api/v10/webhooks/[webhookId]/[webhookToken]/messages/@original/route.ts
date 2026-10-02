import { NextRequest, NextResponse } from 'next/server'
import { listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ webhookId: string; webhookToken: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { webhookId, webhookToken } = await params
  const responses = await listCollection('interaction_responses')
  const interaction = responses.find((r) => r.token === webhookToken)
  return NextResponse.json({
    id: interaction?.id ?? Date.now().toString(),
    type: 0,
    content: interaction?.data ? ((interaction.data as Record<string, unknown>).content as string) || '' : '',
    channel_id: '200000000000000002',
    author: { id: webhookId, username: 'Application', bot: true },
    attachments: [],
    embeds: [],
    pinned: false,
    mention_everyone: false,
    tts: false,
  })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { webhookId } = await params
  const body = await request.json().catch(() => null)
  return NextResponse.json({
    id: Date.now().toString(),
    type: 0,
    content: body?.content || '',
    channel_id: '200000000000000002',
    author: { id: webhookId, username: 'Application', bot: true },
    attachments: [],
    embeds: [],
    pinned: false,
  })
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'

type Context = { params: Promise<{ questId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { questId } = await params
  return NextResponse.json({
    quest_id: questId,
    claimed: true,
    claimed_at: new Date().toISOString(),
    reward: {
      type: 0,
      code: 'QUEST-REWARD-CODE-DISCORD',
    },
  })
}

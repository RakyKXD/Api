import { NextRequest, NextResponse } from 'next/server'

type Context = { params: Promise<{ questId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { questId } = await params
  return NextResponse.json({
    quest_id: questId,
    enrolled: true,
    user_status: {
      enrolled_at: new Date().toISOString(),
      completed_at: null,
      claimed_at: null,
      progress: {
        current_progress: 1,
        target_progress: 10,
      },
    },
  })
}

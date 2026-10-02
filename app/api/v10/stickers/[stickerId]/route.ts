import { NextRequest, NextResponse } from 'next/server'

type Context = { params: Promise<{ stickerId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { stickerId } = await params
  return NextResponse.json({
    id: stickerId,
    pack_id: '753016829956423700',
    name: 'Wumpus',
    description: '',
    tags: 'wumpus',
    type: 1,
    format_type: 1,
    available: true,
  })
}

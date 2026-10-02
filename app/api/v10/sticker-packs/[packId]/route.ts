import { NextRequest, NextResponse } from 'next/server'

type Context = { params: Promise<{ packId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { packId } = await params
  return NextResponse.json({
    id: packId,
    name: 'Wumpus Beyond',
    sku_id: '753016829956423701',
    description: 'Take your Nitro expressiveness beyond with Wumpus!',
    stickers: [],
    cover_sticker_id: null
  })
}

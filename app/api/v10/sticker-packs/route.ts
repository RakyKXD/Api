import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    sticker_packs: [
      {
        id: '753016829956423700',
        stickers: [],
        name: 'Wumpus Beyond',
        sku_id: '753016829956423701',
        description: 'Take your Nitro expressiveness beyond with Wumpus!',
      },
    ],
  })
}

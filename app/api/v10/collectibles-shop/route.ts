import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    shop: {
      categories: [
        {
          id: '1',
          name: 'Anime',
          sku_ids: ['1001', '1002'],
        },
      ],
    },
  })
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: 'store_listing_1',
      sku: {
        id: '1001',
        name: 'Cyberpunk Avatar Decoration',
        type: 1,
        price: {
          amount: 499,
          currency: 'usd',
        },
      },
    },
  ])
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: 'inv_100000000000000001',
      type: 1,
      status: 1, // Paid
      amount: 999,
      amount_refunded: 0,
      tax: 0,
      tax_inclusive: true,
      currency: 'usd',
      created_at: '2026-01-01T00:00:00.000Z',
      description: 'Discord Nitro 1 Month',
      payment_gateway: 1,
      payment_source: {
        id: '500000000000000001',
        brand: 'visa',
        last_4: '4242',
      },
    },
  ])
}

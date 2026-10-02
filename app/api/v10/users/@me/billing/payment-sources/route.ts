import { NextResponse } from 'next/server'
import { listCollection } from '@/lib/discord-store'

export async function GET() {
  const sources = await listCollection('payment_sources')
  if (Array.isArray(sources) && sources.length > 0) {
    return NextResponse.json(sources)
  }
  return NextResponse.json([
    {
      id: '500000000000000001',
      type: 1,
      invalid: false,
      flags: 0,
      default: true,
      brand: 'visa',
      last_4: '4242',
      expires_month: 12,
      expires_year: 2028,
      billing_address: {
        name: 'User',
        line_1: 'Street 123',
        line_2: null,
        city: 'Madrid',
        state: 'MD',
        country: 'ES',
        postal_code: '28001',
      },
      payment_gateway: 1,
    },
  ])
}

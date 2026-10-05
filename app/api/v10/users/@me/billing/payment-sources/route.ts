import { NextRequest, NextResponse } from 'next/server'
import { listCollection, mutate } from '@/lib/discord-store'

const DEFAULT_SOURCE = {
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
}

export async function GET() {
  const sources = await listCollection('payment_sources')
  if (Array.isArray(sources) && sources.length > 0) {
    return NextResponse.json(sources)
  }
  return NextResponse.json([DEFAULT_SOURCE])
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const billing = (body.billing_address ?? {}) as Record<string, unknown>
  const newSource = {
    id: `ps_${Date.now()}`,
    type: 1,
    invalid: false,
    flags: 0,
    default: true,
    brand: (body.brand as string) || 'visa',
    last_4: (body.last_4 as string) || '4242',
    expires_month: Number(body.expires_month) || 12,
    expires_year: Number(body.expires_year) || 2028,
    billing_address: {
      name: (billing.name as string) || 'User',
      line_1: (billing.line_1 as string) || 'Street 123',
      line_2: (billing.line_2 as string) || null,
      city: (billing.city as string) || 'Madrid',
      state: (billing.state as string) || 'MD',
      country: (billing.country as string) || 'ES',
      postal_code: (billing.postal_code as string) || '28001',
    },
    payment_gateway: Number(body.payment_gateway) || 1,
  }

  await mutate((db) => {
    db.payment_sources ??= []
    ;(db.payment_sources as Record<string, unknown>[]).push(newSource)
  })

  return NextResponse.json(newSource, { status: 201 })
}



import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUser, createGiftCode } from '@/lib/discord-store'

type Context = { params: Promise<{ skuId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { skuId } = await params
  const url = request.nextUrl
  const subscriptionPlanId =
    url.searchParams.get('subscription_plan_id') ||
    (skuId === '978380684370378762' ? '978380692553465866' : '511651880837840896')

  const isBasic = skuId === '978380684370378762' || subscriptionPlanId === '978380692553465866'
  const isClassic = skuId === '521846918637420545' || subscriptionPlanId === '511651871736201216'
  const price = isBasic ? 299 : isClassic ? 499 : 999

  return NextResponse.json({
    id: '700000000000000001',
    invoice_items: [
      {
        id: '700000000000000002',
        subscription_plan_id: subscriptionPlanId,
        subscription_plan_price: price,
        amount: price,
        quantity: 1,
        discounts: [],
        unit_price: {
          amount: price,
          currency: 'eur',
        },
        tax: 0,
        sku_id: skuId,
      },
    ],
    total: price,
    subtotal: price,
    currency: 'eur',
    tax: 0,
    tax_inclusive: true,
    status: 1,
  })
}

export async function POST(request: NextRequest, { params }: Context) {
  const { skuId } = await params
  const userId = getUserIdFromAuth(request)
  const user = await getUser(userId)
  const email = (user?.email as string)?.toLowerCase()

  if (email !== 'test@raky.es') {
    return NextResponse.json(
      {
        message: 'Solo la cuenta test@raky.es puede regalar suscripciones de forma gratuita.',
        code: 50000,
      },
      { status: 402 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const subscriptionPlanId =
    (body?.subscription_plan_id as string) ||
    (skuId === '978380684370378762' ? '978380692553465866' : '511651880837840896')
  const giftStyle = Number(body?.gift_style) || 0

  const gift = await createGiftCode(userId, skuId, subscriptionPlanId, giftStyle)

  return NextResponse.json({
    entitlements: [],
    gift_code: gift.code,
    library_applications: [],
  })
}

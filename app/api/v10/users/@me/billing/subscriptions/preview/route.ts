import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUser } from '@/lib/discord-store'

async function handlePreview(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const user = await getUser(userId)
  const email = (user?.email as string)?.toLowerCase()
  const isFreeEligible = email === 'test@raky.es'

  const url = request.nextUrl
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // ignore
  }

  const items = Array.isArray(body?.items) ? body.items : []
  const firstItem = items[0] as Record<string, unknown> | undefined
  const planId =
    (firstItem?.plan_id as string) ||
    (body?.plan_id as string) ||
    url.searchParams.get('plan_id') ||
    url.searchParams.get('subscription_plan_id') ||
    '511651880837840896'

  let skuId = '521847234246082599'
  let normalPrice = 999
  if (
    planId === '978380692553465866' ||
    planId === '1024422698568122368' ||
    planId === '978387023482069042'
  ) {
    skuId = '978380684370378762'
    normalPrice = 299
  } else if (planId === '511651871736201216' || planId === '511651876987469824') {
    skuId = '521846918637420545'
    normalPrice = 499
  }

  const unitPrice = isFreeEligible ? 0 : normalPrice

  return NextResponse.json({
    id: '700000000000000001',
    invoice_items: [
      {
        id: '700000000000000002',
        subscription_plan_id: planId,
        subscription_plan_price: unitPrice,
        amount: unitPrice,
        quantity: 1,
        discounts: [],
        unit_price: {
          amount: unitPrice,
          currency: 'eur',
        },
        tax: 0,
        sku_id: skuId,
      },
    ],
    total: unitPrice,
    subtotal: unitPrice,
    currency: 'eur',
    tax: 0,
    tax_inclusive: true,
    subscription_period_start: new Date().toISOString(),
    subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 1,
  })
}

export const POST = handlePreview
export const GET = handlePreview

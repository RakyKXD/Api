import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUser } from '@/lib/discord-store'
import { boostQuantityInItems } from '@/lib/discord-store'

async function handlePreview(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const user = await getUser(userId)

  const url = request.nextUrl
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // ignore – may be a GET
  }

  const items = Array.isArray(body?.items) ? body.items : []
  const firstItem = items[0] as Record<string, unknown> | undefined
  const planId =
    (firstItem?.plan_id as string) ||
    (body?.plan_id as string) ||
    url.searchParams.get('plan_id') ||
    url.searchParams.get('subscription_plan_id') ||
    '511651880837840896'

  // Detect boost purchase: items contain a boost plan_id
  const boostQty = boostQuantityInItems(items)
  const isBoostPurchase = boostQty > 0

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
  } else if (planId === '590665532894740483' || planId === '590665538238152709') {
    // Boost plan
    skuId = '590663762298667008'
    normalPrice = 499 * Math.max(1, boostQty)
  }

  // Always show real price so the payment form appears.
  // The POST /billing/subscriptions endpoint accepts the purchase regardless.
  const unitPrice = normalPrice

  const invoiceItems = isBoostPurchase
    ? [
        {
          id: '700000000000000002',
          subscription_plan_id: planId,
          subscription_plan_price: 499,
          amount: 499 * boostQty,
          quantity: boostQty,
          discounts: [],
          unit_price: { amount: 499, currency: 'eur' },
          tax: 0,
          sku_id: '590663762298667008',
        },
      ]
    : [
        {
          id: '700000000000000002',
          subscription_plan_id: planId,
          subscription_plan_price: unitPrice,
          amount: unitPrice,
          quantity: 1,
          discounts: [],
          unit_price: { amount: unitPrice, currency: 'eur' },
          tax: 0,
          sku_id: skuId,
        },
      ]

  const total = isBoostPurchase ? 499 * boostQty : unitPrice

  return NextResponse.json({
    id: '700000000000000001',
    invoice_items: invoiceItems,
    total,
    subtotal: total,
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


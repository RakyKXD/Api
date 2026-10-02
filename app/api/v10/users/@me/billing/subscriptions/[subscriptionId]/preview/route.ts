import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUserSubscriptions } from '@/lib/discord-store'

type Context = { params: Promise<{ subscriptionId: string }> }

async function handlePreview(request: NextRequest, { params }: Context) {
  const { subscriptionId } = await params
  const userId = getUserIdFromAuth(request)
  const subscriptions = await getUserSubscriptions(userId)
  const sub = subscriptions.find((s) => s.id === subscriptionId) || subscriptions[0]

  const url = request.nextUrl
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // ignore
  }

  const items = Array.isArray(body?.items) ? body.items : []
  const firstItem = items[0] as Record<string, unknown> | undefined

  const requestedPlanId =
    (firstItem?.plan_id as string) ||
    (body?.plan_id as string) ||
    url.searchParams.get('plan_id') ||
    url.searchParams.get('subscription_plan_id') ||
    (sub?.plan_id as string) ||
    '511651880837840896'

  let targetSkuId = '521847234246082599'
  let price = 999
  if (
    requestedPlanId === '978380692553465866' ||
    requestedPlanId === '1024422698568122368' ||
    requestedPlanId === '978387023482069042'
  ) {
    targetSkuId = '978380684370378762'
    price = 299
  } else if (requestedPlanId === '511651871736201216' || requestedPlanId === '511651876987469824') {
    targetSkuId = '521846918637420545'
    price = 499
  }

  return NextResponse.json({
    id: '700000000000000001',
    invoice_items: [
      {
        id: '700000000000000002',
        subscription_plan_id: requestedPlanId,
        subscription_plan_price: price,
        amount: price,
        quantity: 1,
        discounts: [],
        unit_price: {
          amount: price,
          currency: 'eur',
        },
        tax: 0,
        sku_id: targetSkuId,
      },
    ],
    total: price,
    subtotal: price,
    currency: (sub?.currency as string) || 'eur',
    tax: 0,
    tax_inclusive: true,
    subscription_period_start: (sub?.current_period_start as string) || new Date().toISOString(),
    subscription_period_end: (sub?.current_period_end as string) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: 1,
  })
}

export const PATCH = handlePreview
export const POST = handlePreview
export const GET = handlePreview

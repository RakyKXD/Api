import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUser, getUserSubscriptions, saveUserSubscription, updateUser } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const subscriptions = await getUserSubscriptions(userId)
  return NextResponse.json(subscriptions)
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const user = await getUser(userId)
  const email = (user?.email as string)?.toLowerCase()

  if (email !== 'test@raky.es') {
    return NextResponse.json(
      {
        message: 'Solo la cuenta test@raky.es puede suscribirse de forma gratuita.',
        code: 50000,
      },
      { status: 402 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const items = Array.isArray(body?.items) ? body.items : []
  const firstItem = items[0] as Record<string, unknown> | undefined
  const planId = (firstItem?.plan_id as string) || (body?.plan_id as string) || '511651880837840896'

  let skuId = '521847234246082599' // Nitro
  let premiumType = 2
  if (
    planId === '978380692553465866' ||
    planId === '1024422698568122368' ||
    planId === '978387023482069042'
  ) {
    skuId = '978380684370378762' // Nitro Basic
    premiumType = 3
  } else if (planId === '511651871736201216' || planId === '511651876987469824') {
    skuId = '521846918637420545' // Nitro Classic
    premiumType = 1
  } else if (planId === '511651885459963904' || planId === '511651880837840897') {
    skuId = '521847234246082599' // Nitro Yearly
    premiumType = 2
  }

  const subscriptionId = `sub_${Date.now()}`
  const newSub = {
    id: subscriptionId,
    type: 1,
    status: 1, // active
    created_at: new Date().toISOString(),
    canceled_at: null,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    plan_id: planId,
    sku_id: skuId,
    items: [
      {
        id: `item_${Date.now()}`,
        plan_id: planId,
        quantity: 1,
      },
    ],
    payment_source_id: (body?.payment_source_id as string) || '500000000000000001',
    payment_gateway: 1,
    flags: 0,
    user_id: userId,
    country_code: 'ES',
    currency: (body?.currency as string) || 'eur',
  }

  await saveUserSubscription(userId, newSub)

  const premiumSince = (user?.premium_since as string) || new Date().toISOString()
  await updateUser(userId, { premium_type: premiumType, premium_since: premiumSince })

  await broadcastGatewayEvent('USER_UPDATE', { id: userId, premium_type: premiumType, premium_since: premiumSince })
  await broadcastGatewayEvent('USER_SUBSCRIPTIONS_UPDATE', {})
  await broadcastGatewayEvent('BILLING_SUBSCRIPTION_UPDATE', newSub)

  return NextResponse.json(newSub, { status: 201 })
}

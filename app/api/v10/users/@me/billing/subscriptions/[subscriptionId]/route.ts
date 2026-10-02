import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import {
  getUser,
  getUserSubscriptions,
  saveUserSubscription,
  cancelUserSubscription,
  isSubscriptionCancelPayload,
} from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ subscriptionId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { subscriptionId } = await params
  const userId = getUserIdFromAuth(request)
  const subscriptions = await getUserSubscriptions(userId)
  const found = subscriptions.find((s) => s.id === subscriptionId) || subscriptions[0]
  if (!found) {
    return NextResponse.json({ message: 'Unknown Subscription', code: 10013 }, { status: 404 })
  }
  return NextResponse.json(found)
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { subscriptionId } = await params
  const userId = getUserIdFromAuth(request)

  // Cancelación real: borra la suscripción, quita el Nitro y avisa por gateway.
  await cancelUserSubscription(userId, subscriptionId)

  return new NextResponse(null, { status: 204 })
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { subscriptionId } = await params
  const userId = getUserIdFromAuth(request)

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  // `PATCH` con `status != 1` o con los `items` del plan pero sin `status` es
  // cómo cancela el cliente (ver isSubscriptionCancelPayload). Hay que mirarlo
  // ANTES del gate de email y del cambio de plan: si no, se reactiva la
  // suscripción y el usuario "recupera" el Nitro que acaba de cancelar.
  if (isSubscriptionCancelPayload(body)) {
    return NextResponse.json(await cancelUserSubscription(userId, subscriptionId))
  }

  const user = await getUser(userId)
  const email = (user?.email as string)?.toLowerCase()

  if (email !== 'test@raky.es') {
    return NextResponse.json(
      { message: 'Solo la cuenta test@raky.es puede cambiar de suscripción libremente.', code: 50000 },
      { status: 402 }
    )
  }

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

  const subscriptions = await getUserSubscriptions(userId)
  const existingSub = subscriptions.find((s) => s.id === subscriptionId) || subscriptions[0] || {
    id: subscriptionId,
    type: 1,
    status: 1,
    created_at: new Date().toISOString(),
    payment_gateway: 1,
    currency: 'eur',
  }

  const updatedSub = {
    ...existingSub,
    plan_id: planId,
    sku_id: skuId,
    status: 1,
    canceled_at: null,
    items: [
      {
        id: (firstItem?.id as string) || `item_${Date.now()}`,
        plan_id: planId,
        quantity: Number(firstItem?.quantity) || 1,
      },
    ],
  }

  await saveUserSubscription(userId, updatedSub)
  await updateUser(userId, { premium_type: premiumType })

  await broadcastGatewayEvent('USER_UPDATE', { id: userId, premium_type: premiumType })
  await broadcastGatewayEvent('USER_SUBSCRIPTIONS_UPDATE', {})
  await broadcastGatewayEvent('BILLING_SUBSCRIPTION_UPDATE', updatedSub)

  return NextResponse.json(updatedSub)
}

import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUser, getUserSubscriptions, saveUserSubscription, updateUser, mutate } from '@/lib/discord-store'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

const TEST_EMAIL = 'test@raky.es'

async function ensureNitroForTestUser(userId: string) {
  const user = await getUser(userId)
  const email = (user?.email as string)?.toLowerCase()
  console.log('[ensure-nitro] userId:', userId, 'email:', email, 'premium_type:', user?.premium_type)
  if (email !== TEST_EMAIL) {
    console.log('[ensure-nitro] email mismatch, skip')
    return
  }
  if (Number(user?.premium_type) >= 2) {
    console.log('[ensure-nitro] already has nitro, skip')
    return
  }

  console.log('[ensure-nitro] provisioning Nitro...')
  const subId = `sub_auto_${userId}`
  const planId = '511651880837840896'
  const now = new Date()
  const sub = {
    id: subId,
    type: 1,
    status: 1,
    created_at: now.toISOString(),
    canceled_at: null,
    current_period_start: now.toISOString(),
    current_period_end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    plan_id: planId,
    sku_id: '521847234246082599',
    items: [{ id: `item_auto_${userId}`, plan_id: planId, quantity: 1 }],
    payment_source_id: '500000000000000001',
    payment_gateway: 1,
    flags: 0,
    user_id: userId,
    country_code: 'ES',
    currency: 'eur',
  }

  await saveUserSubscription(userId, sub)
  console.log('[ensure-nitro] saveUserSubscription done')
  await updateUser(userId, { premium_type: 2, premium_since: now.toISOString() })
  console.log('[ensure-nitro] updateUser done')

  // Ensure 2 boost slots exist
  await mutate((db) => {
    db.guild_boost_slots ??= []
    const slots = db.guild_boost_slots as Record<string, unknown>[]
    const existing = slots.filter((s) => s.user_id === userId)
    const toAdd = Math.max(0, 2 - existing.length)
    console.log('[ensure-nitro] slots existing:', existing.length, 'toAdd:', toAdd)
    for (let i = 0; i < toAdd; i++) {
      slots.push({
        id: `slot_${userId}_auto_${Date.now()}_${i + 1}`,
        user_id: userId,
        subscription_id: subId,
        premium_guild_subscription: null,
        canceled: false,
        cooldown_ends_at: null,
      })
    }
  })

  await broadcastGatewayEvent('USER_UPDATE', { id: userId, premium_type: 2, premium_since: now.toISOString() })
  console.log('[ensure-nitro] done!')
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  await ensureNitroForTestUser(userId)
  const subscriptions = await getUserSubscriptions(userId)
  return NextResponse.json(subscriptions)
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const user = await getUser(userId)
  const email = (user?.email as string)?.toLowerCase()

  if (email !== TEST_EMAIL) {
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

  // Ensure 2 boost slots exist for Nitro users
  if (premiumType === 2) {
    await mutate((db) => {
      db.guild_boost_slots ??= []
      const slots = db.guild_boost_slots as Record<string, unknown>[]
      const existing = slots.filter((s) => s.user_id === userId)
      for (let i = existing.length; i < 2; i++) {
        slots.push({
          id: `slot_${userId}_${Date.now()}_${i + 1}`,
          user_id: userId,
          subscription_id: subscriptionId,
          premium_guild_subscription: null,
          canceled: false,
          cooldown_ends_at: null,
        })
      }
    })
  }

  await broadcastGatewayEvent('USER_UPDATE', { id: userId, premium_type: premiumType, premium_since: premiumSince })
  await broadcastGatewayEvent('USER_SUBSCRIPTIONS_UPDATE', {})
  await broadcastGatewayEvent('BILLING_SUBSCRIPTION_UPDATE', newSub)

  return NextResponse.json(newSub, { status: 201 })
}


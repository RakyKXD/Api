import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUser, getUserGiftCodes, createGiftCode } from '@/lib/discord-store'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const codes = await getUserGiftCodes(userId)
  return NextResponse.json(codes)
}

export async function POST(request: NextRequest) {
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
  const skuId = (body?.sku_id as string) || '521847234246082599'
  const subscriptionPlanId = (body?.subscription_plan_id as string) || undefined
  const giftStyle = Number(body?.gift_style) || 0

  const gift = await createGiftCode(userId, skuId, subscriptionPlanId, giftStyle)
  return NextResponse.json(gift, { status: 201 })
}

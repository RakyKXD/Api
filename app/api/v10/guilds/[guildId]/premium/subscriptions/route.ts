import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getGuildBoosts, applyGuildBoostSlots } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const boosts = await getGuildBoosts(guildId)
  return NextResponse.json(boosts)
}

export async function PUT(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const userId = getUserIdFromAuth(request)
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const slotIds = Array.isArray(body?.user_premium_guild_subscription_slot_ids)
    ? (body.user_premium_guild_subscription_slot_ids as string[])
    : []

  if (slotIds.length === 0) {
    return NextResponse.json(
      { message: 'user_premium_guild_subscription_slot_ids is required', code: 50035 },
      { status: 400 }
    )
  }

  try {
    const appliedBoosts = await applyGuildBoostSlots(userId, guildId, slotIds)
    return NextResponse.json(appliedBoosts)
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ message: error.message || 'Error applying boost', code: 50000 }, { status: 400 })
  }
}

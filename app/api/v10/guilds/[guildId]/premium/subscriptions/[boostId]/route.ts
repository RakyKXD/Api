import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { unapplyGuildBoost } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; boostId: string }> }

export async function DELETE(request: NextRequest, { params }: Context) {
  const { guildId, boostId } = await params
  const userId = getUserIdFromAuth(request)
  await unapplyGuildBoost(userId, guildId, boostId)
  return new NextResponse(null, { status: 204 })
}

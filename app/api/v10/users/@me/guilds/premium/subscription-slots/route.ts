import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUserGuildBoostSlots } from '@/lib/discord-store'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const slots = await getUserGuildBoostSlots(userId)
  return NextResponse.json(slots)
}

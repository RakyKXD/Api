import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { updateGuildBoostSlot } from '@/lib/discord-store'

type Context = { params: Promise<{ slotId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { slotId } = await params
  const userId = getUserIdFromAuth(request)
  const slot = await updateGuildBoostSlot(userId, slotId, { canceled: false })
  if (!slot) {
    return NextResponse.json({ message: 'Unknown Slot', code: 10000 }, { status: 404 })
  }
  return NextResponse.json(slot)
}

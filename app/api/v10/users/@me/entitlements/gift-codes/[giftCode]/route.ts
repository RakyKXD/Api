import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { revokeGiftCode } from '@/lib/discord-store'

type Context = { params: Promise<{ giftCode: string }> }

export async function DELETE(request: NextRequest, { params }: Context) {
  const { giftCode } = await params
  const userId = getUserIdFromAuth(request)
  await revokeGiftCode(userId, giftCode)
  return new NextResponse(null, { status: 204 })
}

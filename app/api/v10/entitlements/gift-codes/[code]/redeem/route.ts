import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { redeemGiftCode } from '@/lib/discord-store'

type Context = { params: Promise<{ code: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { code } = await params
  const userId = getUserIdFromAuth(request)

  try {
    const gift = await redeemGiftCode(code, userId)
    return NextResponse.json(gift)
  } catch (err: unknown) {
    const error = err as { code?: number; status?: number; message?: string }
    return NextResponse.json(
      { message: error?.message || 'Error redeeming gift code', code: error?.code || 50000 },
      { status: error?.status || 400 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSuspiciousDMs } from '@/lib/raky-service'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request) || '900000000000000001'
  const list = await getSuspiciousDMs(userId)
  return NextResponse.json(list)
}

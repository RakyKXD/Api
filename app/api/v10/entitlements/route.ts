import { NextRequest, NextResponse } from 'next/server'
import { listCollection } from '@/lib/discord-store'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id') || '900000000000000001'
  const entitlements = await listCollection('entitlements')
  const userEntitlements = entitlements.filter((e: any) => e.user_id === userId || !e.user_id)
  return NextResponse.json(userEntitlements)
}

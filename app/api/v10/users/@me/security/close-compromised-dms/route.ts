import { NextRequest, NextResponse } from 'next/server'
import { closeCompromisedDMs } from '@/lib/raky-service'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = getUserIdFromAuth(request) || '900000000000000001'
  try {
    const body = await request.json()
    const channelIds = Array.isArray(body.channel_ids) ? body.channel_ids : []
    const result = await closeCompromisedDMs(userId, channelIds)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

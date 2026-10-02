import { NextRequest, NextResponse } from 'next/server'
import { getChannelEncryptionKey } from '@/lib/raky-service'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params
  const userId = getUserIdFromAuth(request) || '900000000000000001'
  const keyData = await getChannelEncryptionKey(channelId, userId)
  return NextResponse.json(keyData)
}

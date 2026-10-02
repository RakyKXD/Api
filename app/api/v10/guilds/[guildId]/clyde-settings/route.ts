import { NextRequest, NextResponse } from 'next/server'
import { getGuildClydeSettings, updateGuildClydeSettings } from '@/lib/raky-service'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  const settings = await getGuildClydeSettings(guildId)
  return NextResponse.json(settings)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params
  try {
    const body = await request.json()
    const updated = await updateGuildClydeSettings(guildId, body)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

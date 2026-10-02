import { NextRequest, NextResponse } from 'next/server'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  return NextResponse.json({
    invites_disabled_until: null,
    dms_disabled_until: null,
    dm_spam_detected_at: null,
    raid_detected_at: null,
  })
}

export async function PUT(request: NextRequest, { params }: Context) {
  const body = (await request.json().catch(() => ({}))) || {}
  return NextResponse.json({
    invites_disabled_until: body.invites_disabled_until ?? null,
    dms_disabled_until: body.dms_disabled_until ?? null,
    dm_spam_detected_at: null,
    raid_detected_at: null,
  })
}

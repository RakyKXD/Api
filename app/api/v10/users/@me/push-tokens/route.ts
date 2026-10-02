import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    token: body.token || 'push_token_' + Date.now(),
    type: body.type || 'fcm',
    registered: true,
  })
}

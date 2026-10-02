import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    fingerprint: body.fingerprint || 'fp_' + Date.now(),
    status: 'pending',
  })
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    user_sessions: [
      {
        id_hash: 'current_session_local',
        approx_last_used_time: new Date().toISOString(),
        client_info: {
          os: 'Windows',
          platform: 'web',
          location: 'Localhost',
        },
      },
    ],
  })
}

export async function POST() {
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 })
}

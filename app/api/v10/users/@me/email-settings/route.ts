import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    initialized: true,
    categories: {
      social: true,
      communication: true,
      tips: false,
      updates_and_announcements: true,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) || {}
  return NextResponse.json({
    initialized: true,
    categories: body.categories || {},
  })
}

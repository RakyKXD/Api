import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    unread_count: 0,
    notifications: [],
  })
}

export async function POST() {
  return new NextResponse(null, { status: 204 })
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    requested_at: null,
    status: null,
  })
}

export async function POST() {
  return NextResponse.json({
    requested_at: new Date().toISOString(),
    status: 'PENDING',
  })
}

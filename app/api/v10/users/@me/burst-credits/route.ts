import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    total: 5,
    available: 5,
  })
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    country_code: 'US',
  })
}

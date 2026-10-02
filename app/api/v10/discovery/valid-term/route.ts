import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get('term') || ''
  const valid = term.trim().length >= 3 && term.length <= 100
  return NextResponse.json({ valid })
}

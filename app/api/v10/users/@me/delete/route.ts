import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.password) {
    return NextResponse.json({ message: 'Password is required to delete account', code: 50035 }, { status: 400 })
  }
  return new NextResponse(null, { status: 204 })
}

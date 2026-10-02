import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(null)
}

export async function POST() {
  return NextResponse.json({ token: 'mock_phone_token' })
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 })
}

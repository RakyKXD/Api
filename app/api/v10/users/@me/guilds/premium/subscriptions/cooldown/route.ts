import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ cooldown_ends_at: null })
}

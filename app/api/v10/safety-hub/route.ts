import { NextRequest, NextResponse } from 'next/server'
import { getSafetyHub } from '@/lib/discord-store'

export async function GET() {
  const hub = await getSafetyHub('900000000000000001')
  return NextResponse.json(hub)
}

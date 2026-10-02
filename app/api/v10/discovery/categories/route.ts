import { NextResponse } from 'next/server'
import { DISCOVERY_CATEGORIES } from '@/lib/discord-store'

export async function GET() {
  return NextResponse.json(DISCOVERY_CATEGORIES)
}

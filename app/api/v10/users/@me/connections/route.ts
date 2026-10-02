import { NextRequest, NextResponse } from 'next/server'
import { listCollection } from '@/lib/discord-store'

export async function GET() {
  const connections = await listCollection('connections')
  return NextResponse.json(connections)
}

import { NextRequest, NextResponse } from 'next/server'
import { getDiscoverableGuilds } from '@/lib/discord-store'

export async function GET(request: NextRequest) {
  const offset = Number(request.nextUrl.searchParams.get('offset') || 0)
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') || 24), 1), 100)
  const category = request.nextUrl.searchParams.get('categories') ? Number(request.nextUrl.searchParams.get('categories')) : undefined

  const data = await getDiscoverableGuilds(offset, limit, category)
  return NextResponse.json(data)
}

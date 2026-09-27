import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ url: '/api/v10/gateway', shards: 1, session_start_limit: { total: 1000, remaining: 1000, reset_after: 86400000, max_concurrency: 1 } })
}

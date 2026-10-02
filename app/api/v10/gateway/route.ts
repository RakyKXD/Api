import { NextResponse } from 'next/server'

export async function GET() {
  const port = process.env.GATEWAY_PORT || 3002
  return NextResponse.json({
    url: `ws://localhost:${port}`,
  })
}

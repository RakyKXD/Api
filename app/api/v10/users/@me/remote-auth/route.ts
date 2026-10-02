import { NextResponse } from 'next/server'

export async function POST() {
  const nonce = 'handshake_' + Math.random().toString(36).slice(2)
  return NextResponse.json({
    handshake_token: nonce,
  })
}

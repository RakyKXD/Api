import { NextResponse } from 'next/server'

export async function GET() {
  // Returning an empty array is fully valid in Discord API and prevents
  // client crashes on outbound promotions parsing.
  return NextResponse.json([])
}

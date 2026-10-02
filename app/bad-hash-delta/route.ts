import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse(Buffer.alloc(0), {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  })
}

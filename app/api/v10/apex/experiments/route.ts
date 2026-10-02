import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    installation: '900000000000000002.mockinstallation',
    assignments: []
  })
}

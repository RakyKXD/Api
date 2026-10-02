import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    page: {
      id: 'mock_status_page',
      name: 'Discord Status',
      url: 'https://status.discord.com',
      time_zone: 'UTC',
      updated_at: new Date().toISOString(),
    },
    incidents: [],
  })
}

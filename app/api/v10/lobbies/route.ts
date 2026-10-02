import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: 'lobby_100000000000000001',
      application_id: '100000000000000001',
      type: 1, // Public
      capacity: 4,
      members: [
        {
          id: '900000000000000001',
          metadata: {},
        },
      ],
      metadata: {
        map: 'cyber_arena',
        mode: 'deathmatch',
      },
    },
  ])
}

export async function POST() {
  return NextResponse.json({
    id: 'lobby_' + Date.now(),
    application_id: '100000000000000001',
    type: 1,
    capacity: 4,
    secret: 'lobby_secret_' + Math.random().toString(36).slice(2),
    members: [],
    metadata: {},
  })
}

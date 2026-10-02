import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/discord-store'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id') || '900000000000000001'
  const user = await getUser(userId)
  return NextResponse.json({
    user: user || { id: userId, username: 'raky', discriminator: '0', avatar: null },
    status: 'online',
    client_status: { desktop: 'online', mobile: 'unknown', web: 'unknown' },
    activities: [
      {
        name: 'Visual Studio Code',
        type: 0, // Playing
        created_at: Date.now(),
        timestamps: { start: Date.now() - 3600000 },
        details: 'Editing full Discord API',
        state: 'Workspace: Raky',
      },
    ],
  })
}

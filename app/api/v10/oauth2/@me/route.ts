import { NextResponse } from 'next/server'
import { getUser } from '@/lib/discord-store'

export async function GET() {
  const user = await getUser('900000000000000001')
  return NextResponse.json({
    application: {
      id: '900000000000000001',
      name: 'API Bot',
      icon: null,
      description: 'Mock Discord Application',
      summary: '',
      bot_public: true,
      bot_require_code_grant: false,
      verify_key: 'mock_verify_key_discord_api_v10',
    },
    scopes: ['identify', 'bot', 'applications.commands', 'guilds', 'email'],
    expires: '2029-01-01T00:00:00.000Z',
    user,
  })
}

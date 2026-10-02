import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    id: '900000000000000001',
    name: 'API Bot',
    icon: null,
    description: 'Mock Discord Application',
    summary: '',
    bot_public: true,
    bot_require_code_grant: false,
    bot: {
      id: '900000000000000001',
      username: 'api-bot',
      discriminator: '0',
      avatar: null,
      bot: true,
    },
    flags: 0,
    hook: true,
  })
}

import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    version: '10',
    message: 'Discord-compatible API',
    storage: 'json',
    endpoints: {
      guilds: '/api/v10/guilds',
      guild: '/api/v10/guilds/:guildId',
      channels: '/api/v10/guilds/:guildId/channels',
      messages: '/api/v10/guilds/:guildId/channels/:channelId/messages',
    },
    note: 'This is not the official Discord API and does not implement every Discord service yet.',
  })
}

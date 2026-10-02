import { NextRequest, NextResponse } from 'next/server'
import { getGuild, updateGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const screen = guild.welcome_screen || {
    description: 'Welcome to our community!',
    welcome_channels: [
      {
        channel_id: '200000000000000002',
        description: 'Chat with everyone here',
        emoji_id: null,
        emoji_name: '💬',
      },
    ],
  }

  return NextResponse.json(screen)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { guildId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const welcomeScreen = {
    description: body?.description ?? guild.welcome_screen?.description ?? '',
    welcome_channels: body?.welcome_channels ?? guild.welcome_screen?.welcome_channels ?? [],
  }

  await updateGuild(guildId, { welcome_screen: welcomeScreen })
  return NextResponse.json(welcomeScreen)
}

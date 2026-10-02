import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/discord-store'

type Context = { params: Promise<{ appId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { appId } = await params
  const botUser = (await getUser(appId)) || { id: appId, username: 'Mock Application', discriminator: '0', avatar: null }

  return NextResponse.json({
    id: appId,
    name: 'Mock Application',
    icon: null,
    description: 'An application listed in the Application Directory',
    summary: '',
    bot_public: true,
    bot_require_code_grant: false,
    bot: botUser,
    categories: [1, 2],
    directory_entry: {
      guild_id: '100000000000000001',
      primary_category_id: 1,
      short_description: 'An awesome bot for your server.',
    },
  })
}

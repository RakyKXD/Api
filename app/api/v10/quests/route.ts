import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    quests: [
      {
        id: '123456789012345678',
        config: {
          messages: {
            quest_name: 'Play Game Quest',
            game_title: 'Demo Game',
            game_publisher: 'Discord Partner',
          },
          assets: {
            hero: 'hero_asset_url',
            quest_bar_hero: 'quest_bar_hero_url',
          },
          rewards_config: {
            rewards: [
              {
                type: 0,
                sku_id: '999999999999999999',
                messages: {
                  name: 'Special Avatar Decoration',
                },
              },
            ],
          },
        },
        user_status: {
          enrolled_at: new Date().toISOString(),
          completed_at: null,
          claimed_at: null,
          progress: {},
        },
      },
    ],
  })
}

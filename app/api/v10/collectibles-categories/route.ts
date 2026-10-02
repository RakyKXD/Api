import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    categories: [
      {
        id: '1',
        name: 'Anime',
        sku_ids: ['1001', '1002'],
        products: [
          {
            sku_id: '1001',
            name: 'Cyberpunk Helmet',
            type: 0, // Avatar Decoration
            items: [
              {
                id: 'item_1001',
                type: 0,
                asset: 'a_decorative_asset_hash',
              },
            ],
          },
        ],
      },
      {
        id: '2',
        name: 'Fantasy',
        sku_ids: ['2001'],
        products: [
          {
            sku_id: '2001',
            name: 'Wizard Effects',
            type: 1, // Profile Effect
            items: [
              {
                id: 'item_2001',
                type: 1,
                asset: 'a_profile_effect_hash',
              },
            ],
          },
        ],
      },
    ],
  })
}

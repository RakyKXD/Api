import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: '100000000000000001',
      name: 'Luminara Community Directory',
      guild_id: '100000000000000001',
      type: 0,
      description: 'Official student and community hub directory',
      primary_category_id: 1,
    },
  ])
}

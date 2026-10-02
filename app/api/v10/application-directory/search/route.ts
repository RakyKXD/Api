import { NextRequest, NextResponse } from 'next/server'
import { listCollection } from '@/lib/discord-store'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || ''
  const apps = await listCollection('applications')
  const results = apps.filter((app: any) => !query || (app.name && app.name.toLowerCase().includes(query.toLowerCase())))
  return NextResponse.json({
    total_results: results.length,
    results: results.map((app: any) => ({
      id: app.id,
      name: app.name || 'Sample App',
      description: app.description || 'Application in directory',
      summary: '',
      icon: app.icon || null,
      categories: [1],
      bot: { id: app.id, username: app.name || 'app', discriminator: '0', avatar: null, bot: true },
    })),
  })
}

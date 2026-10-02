import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ templateCode: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { templateCode } = await params
  const templates = await listCollection('guild_templates')
  const template = templates.find((t) => t.code === templateCode)
  if (!template) {
    return NextResponse.json({ message: 'Unknown Guild Template', code: 10057 }, { status: 404 })
  }
  return NextResponse.json(template)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { templateCode } = await params
  const templates = await listCollection('guild_templates')
  const template = templates.find((t) => t.code === templateCode)
  if (!template) {
    return NextResponse.json({ message: 'Unknown Guild Template', code: 10057 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const newGuild = await createCollectionItem('guilds', {
    name: body?.name || 'Template Guild',
    icon: null,
    owner_id: '900000000000000001',
    roles: [],
    channels: [],
    members: [],
  })

  return NextResponse.json(newGuild, { status: 201 })
}

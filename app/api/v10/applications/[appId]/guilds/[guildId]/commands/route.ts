import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ appId: string; guildId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { appId, guildId } = await params
  const commands = await listCollection('application_commands')
  const filtered = commands.filter((c) => c.application_id === appId && c.guild_id === guildId)
  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { appId, guildId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const command = await createCollectionItem('application_commands', {
    application_id: appId,
    guild_id: guildId,
    name: body.name.trim(),
    description: body.description || '',
    options: Array.isArray(body.options) ? body.options : [],
    type: Number(body.type || 1),
    default_member_permissions: body.default_member_permissions ?? null,
    version: Date.now().toString(),
  })

  return NextResponse.json(command, { status: 201 })
}

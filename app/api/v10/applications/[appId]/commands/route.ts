import { NextRequest, NextResponse } from 'next/server'
import { createCollectionItem, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ appId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { appId } = await params
  const commands = await listCollection('application_commands')
  const filtered = commands.filter((c) => c.application_id === appId && !c.guild_id)
  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { appId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const command = await createCollectionItem('application_commands', {
    application_id: appId,
    name: body.name.trim(),
    description: body.description || '',
    options: Array.isArray(body.options) ? body.options : [],
    type: Number(body.type || 1), // 1: CHAT_INPUT
    default_member_permissions: body.default_member_permissions ?? null,
    dm_permission: body.dm_permission ?? true,
    version: Date.now().toString(),
  })

  return NextResponse.json(command, { status: 201 })
}

export async function PUT(request: NextRequest, { params }: Context) {
  const { appId } = await params
  const body = await request.json().catch(() => null)
  if (!Array.isArray(body)) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const created = []
  for (const cmd of body) {
    const item = await createCollectionItem('application_commands', {
      application_id: appId,
      name: cmd.name,
      description: cmd.description || '',
      options: cmd.options || [],
      type: cmd.type || 1,
      version: Date.now().toString(),
    })
    created.push(item)
  }

  return NextResponse.json(created)
}

import { NextRequest, NextResponse } from 'next/server'
import { deleteCollectionItem, listCollection, updateCollectionItem } from '@/lib/discord-store'

type Context = { params: Promise<{ appId: string; commandId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { appId, commandId } = await params
  const commands = await listCollection('application_commands')
  const command = commands.find((c) => c.id === commandId && c.application_id === appId)
  if (!command) {
    return NextResponse.json({ message: 'Unknown Command', code: 10063 }, { status: 404 })
  }
  return NextResponse.json(command)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { appId, commandId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const updated = await updateCollectionItem('application_commands', commandId, body)
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Command', code: 10063 }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { commandId } = await params
  const deleted = await deleteCollectionItem('application_commands', commandId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Command', code: 10063 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

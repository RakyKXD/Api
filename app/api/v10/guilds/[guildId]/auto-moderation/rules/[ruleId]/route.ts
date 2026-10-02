import { NextRequest, NextResponse } from 'next/server'
import { deleteCollectionItem, listCollection, updateCollectionItem } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; ruleId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { ruleId } = await params
  const rules = await listCollection('automod_rules')
  const rule = rules.find((r) => r.id === ruleId)
  if (!rule) {
    return NextResponse.json({ message: 'Unknown Auto Moderation Rule', code: 10065 }, { status: 404 })
  }
  return NextResponse.json(rule)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { ruleId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const updated = await updateCollectionItem('automod_rules', ruleId, body)
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Auto Moderation Rule', code: 10065 }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { ruleId } = await params
  const deleted = await deleteCollectionItem('automod_rules', ruleId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Auto Moderation Rule', code: 10065 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

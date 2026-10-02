import { NextRequest, NextResponse } from 'next/server'
import { deleteCollectionItem, listCollection, updateCollectionItem } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const stages = await listCollection('stage_instances')
  const stage = stages.find((s) => s.channel_id === channelId)
  if (!stage) {
    return NextResponse.json({ message: 'Unknown Stage Instance', code: 10067 }, { status: 404 })
  }
  return NextResponse.json(stage)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const stages = await listCollection('stage_instances')
  const stage = stages.find((s) => s.channel_id === channelId)
  if (!stage) {
    return NextResponse.json({ message: 'Unknown Stage Instance', code: 10067 }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const updated = await updateCollectionItem('stage_instances', String(stage.id), body || {})
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const stages = await listCollection('stage_instances')
  const stage = stages.find((s) => s.channel_id === channelId)
  if (!stage) {
    return NextResponse.json({ message: 'Unknown Stage Instance', code: 10067 }, { status: 404 })
  }

  await deleteCollectionItem('stage_instances', String(stage.id))
  return new NextResponse(null, { status: 204 })
}

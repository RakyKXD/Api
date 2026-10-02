import { NextRequest, NextResponse } from 'next/server'
import { deleteCollectionItem, listCollection, updateCollectionItem } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; eventId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { eventId } = await params
  const events = await listCollection('scheduled_events')
  const event = events.find((e) => e.id === eventId)
  if (!event) {
    return NextResponse.json({ message: 'Unknown Scheduled Event', code: 10070 }, { status: 404 })
  }
  return NextResponse.json(event)
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { eventId } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  const updated = await updateCollectionItem('scheduled_events', eventId, body)
  if (!updated) {
    return NextResponse.json({ message: 'Unknown Scheduled Event', code: 10070 }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { eventId } = await params
  const deleted = await deleteCollectionItem('scheduled_events', eventId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Scheduled Event', code: 10070 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

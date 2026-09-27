import { NextRequest, NextResponse } from 'next/server'
import { createMessage, listMessages } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; channelId: string }> }
export async function GET(_: NextRequest, { params }: Context) { const { guildId, channelId } = await params; const messages = await listMessages(guildId, channelId); return messages ? NextResponse.json(messages) : NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 }) }
export async function POST(request: NextRequest, { params }: Context) { const { guildId, channelId } = await params; const body = await request.json().catch(() => ({})); if (!body.content || typeof body.content !== 'string') return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 }); const message = await createMessage(guildId, channelId, body.content); return message ? NextResponse.json(message, { status: 201 }) : NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 }) }

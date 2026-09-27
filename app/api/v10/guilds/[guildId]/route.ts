import { NextRequest, NextResponse } from 'next/server'
import { deleteGuild, getGuild, updateGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }
export async function GET(_: NextRequest, { params }: Context) { const { guildId } = await params; const guild = await getGuild(guildId); return guild ? NextResponse.json(guild) : NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 }) }
export async function PATCH(request: NextRequest, { params }: Context) { const { guildId } = await params; const guild = await updateGuild(guildId, await request.json()); return guild ? NextResponse.json(guild) : NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 }) }
export async function DELETE(_: NextRequest, { params }: Context) { const { guildId } = await params; const deleted = await deleteGuild(guildId); return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 }) }

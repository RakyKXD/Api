import { NextRequest, NextResponse } from 'next/server'
import { getGuild, listChannels } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string }> }
export async function GET(_: NextRequest, { params }: Context) { const { guildId } = await params; if (!(await getGuild(guildId))) return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 }); return NextResponse.json(await listChannels(guildId)) }

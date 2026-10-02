import { NextRequest, NextResponse } from 'next/server'
import { deleteGuildSoundboardSound, getGuild } from '@/lib/discord-store'

type Context = { params: Promise<{ guildId: string; soundId: string }> }

export async function DELETE(_: NextRequest, { params }: Context) {
  const { guildId, soundId } = await params
  const guild = await getGuild(guildId)
  if (!guild) {
    return NextResponse.json({ message: 'Unknown Guild', code: 10004 }, { status: 404 })
  }

  const deleted = await deleteGuildSoundboardSound(guildId, soundId)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Sound', code: 10072 }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}

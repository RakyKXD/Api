import { NextRequest, NextResponse } from 'next/server'
import { ensurePrivateChannel, findChannelById } from '@/lib/discord-store'

type Context = { params: Promise<{ channelId: string }> }

export async function POST(_: NextRequest, { params }: Context) {
  const { channelId } = await params
  const found = await findChannelById(channelId)
  if (!found) {
    // El cliente manda el "typing" al escribir; un 404 en el canal privado
    // anunciado en READY aparecía en el log como `POST .../typing [404]`.
    await ensurePrivateChannel(channelId)
  }
  return new NextResponse(null, { status: 204 })
}

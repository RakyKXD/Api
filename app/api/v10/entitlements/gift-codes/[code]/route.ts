import { NextRequest, NextResponse } from 'next/server'
import { getGiftCode } from '@/lib/discord-store'

type Context = { params: Promise<{ code: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  const { code } = await params
  const gift = await getGiftCode(code)
  if (!gift) {
    return NextResponse.json({ message: 'Unknown Gift Code', code: 10038 }, { status: 404 })
  }
  return NextResponse.json(gift)
}

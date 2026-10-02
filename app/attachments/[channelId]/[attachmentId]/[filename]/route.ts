import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

type Context = { params: Promise<{ channelId: string; attachmentId: string; filename: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { channelId, attachmentId, filename } = await params
  const uploadDir = path.join(process.cwd(), 'data', 'cdn', channelId, attachmentId)
  const filePath = path.join(uploadDir, filename)

  try {
    const file = await fs.readFile(filePath)
    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch {
    return new NextResponse('File not found', { status: 404 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

type Context = { params: Promise<{ channelId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { channelId } = await params
  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ message: 'Invalid Form Data', code: 50035 }, { status: 400 })
  }

  const files = []
  const attachmentId = Date.now().toString()
  const uploadDir = path.join(process.cwd(), 'data', 'cdn', channelId, attachmentId)
  await fs.mkdir(uploadDir, { recursive: true })

  for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      const filename = value.name || 'file.bin'
      const buffer = Buffer.from(await value.arrayBuffer())
      const filePath = path.join(uploadDir, filename)
      await fs.writeFile(filePath, buffer)

      files.push({
        id: attachmentId,
        filename,
        size: buffer.length,
        url: `/attachments/${channelId}/${attachmentId}/${filename}`,
        proxy_url: `/attachments/${channelId}/${attachmentId}/${filename}`,
        content_type: value.type || 'application/octet-stream',
      })
    }
  }

  return NextResponse.json({ attachments: files })
}

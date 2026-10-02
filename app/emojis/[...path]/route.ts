import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const filename = segments.join('/')
  const base = path.basename(filename, path.extname(filename))

  // Try direct path or base name
  const candidate1 = path.resolve('public', 'emojis', ...segments)
  const candidate2 = path.resolve('public', 'emojis', `${base}.png`)
  const candidate3 = path.resolve('public', 'emojis', base, `${base}.png`)

  for (const c of [candidate1, candidate2, candidate3]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return new NextResponse(fs.readFileSync(c), {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
      })
    }
  }

  return new NextResponse(TRANSPARENT_PNG, {
    status: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  })
}

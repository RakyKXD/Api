import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const filePath = path.resolve('public', 'app-assets', ...segments)

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return new NextResponse(fs.readFileSync(filePath), {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  }

  return new NextResponse(TRANSPARENT_PNG, {
    status: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  })
}

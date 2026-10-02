import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import chunkReverseMapJson from '@/lib/chunk-reverse-map.json'

const chunkReverseMap: Record<string, string> = chunkReverseMapJson as Record<string, string>

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const filename = segments.join('/')

  // 1. Check local assets directory
  const localPath = path.resolve('discord-assets', 'assets', filename)
  const publicPath = path.resolve('public', 'assets', filename)
  const targetPath = (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) ? localPath : ((fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) ? publicPath : null)
  if (targetPath) {
    const data = fs.readFileSync(targetPath)
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.js') contentType = 'application/javascript; charset=utf-8'
    else if (ext === '.css') contentType = 'text/css; charset=utf-8'
    else if (ext === '.json') contentType = 'application/json'
    else if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.webp') contentType = 'image/webp'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.woff2') contentType = 'font/woff2'
    else if (ext === '.woff') contentType = 'font/woff'
    else if (ext === '.wasm') contentType = 'application/wasm'

    let cacheHeader = 'public, max-age=31536000, immutable'
    if (filename.includes('792086589bac0680') || filename.includes('1c3d63b084b0f83e') || filename.includes('raky-client') || filename.includes('web.d4c7976eccf337f1') || filename.includes('libdiscore')) {
      cacheHeader = 'no-cache, no-store, must-revalidate'
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheHeader,
      },
    })
  }

  // 2. Fallback stubs for missing assets to prevent crashing offline
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.js') {
    // Extract chunk ID from <chunkId>.<hash>.js or just <chunkId>.js
    const base = path.basename(filename, '.js')
    const chunkId = base.split('.')[0]
    const workerChunkMap: Record<string, string> = {
      '4581fa52fbbc3d25': '276171',
      '5f4258658edb0a64': '3965',
      'fcb8bbf7d9775cef': '470004',
      '6784233c7a79c08f': '854890',
    }
    const realChunkId = workerChunkMap[chunkId] || chunkReverseMap[chunkId] || chunkId
    const stub = `(this.webpackChunkdiscord_app = this.webpackChunkdiscord_app || []).push([[${JSON.stringify(realChunkId)}, ${JSON.stringify(chunkId)}], {}]);\n`
    return new NextResponse(stub, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  if (ext === '.css') {
    return new NextResponse('/* empty */', {
      status: 200,
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  if (ext === '.json') {
    return NextResponse.json({})
  }

  if (['.png', '.jpg', '.jpeg', '.webp', '.ico'].includes(ext)) {
    return new NextResponse(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  if (ext === '.svg') {
    return new NextResponse('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>', {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  if (ext === '.wasm') {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new NextResponse('', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { listRelationships, setRelationship } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const relationships = await listRelationships(userId)
  return NextResponse.json(relationships)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  // Handle friend request by username (pomelo)
  const username = body.username ? String(body.username) : null
  if (!username) {
    return NextResponse.json({ message: 'Invalid Form Body', code: 50035 }, { status: 400 })
  }

  // Default mock behavior: creates outgoing friend request (type 4)
  const targetId = `${Date.now()}`
  const userId = getUserIdFromAuth(request)
  const rel = await setRelationship(targetId, 4, null, userId)
  return NextResponse.json(rel, { status: 204 })
}

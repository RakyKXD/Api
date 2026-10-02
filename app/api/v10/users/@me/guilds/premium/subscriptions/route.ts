import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { getUserGuildBoosts } from '@/lib/discord-store'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request)
  const boosts = await getUserGuildBoosts(userId)
  return NextResponse.json(boosts)
}

import { NextRequest } from 'next/server'
import { body, discordError, json, requireAuth } from '@/lib/discord-api'
import { createCollectionItem, listCollection } from '@/lib/discord-store'

export async function GET(request: NextRequest) { const denied = requireAuth(request); if ('status' in denied) return denied; return json(await listCollection('webhooks')) }
export async function POST(request: NextRequest) { const denied = requireAuth(request); if ('status' in denied) return denied; const value = await body(request); if (!value?.name || typeof value.name !== 'string') return discordError('Invalid Form Body', 50035); return json(await createCollectionItem('webhooks', { ...value, token: 'temporary-token' }), 201) }

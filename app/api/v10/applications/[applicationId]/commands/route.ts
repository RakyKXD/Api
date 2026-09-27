import { NextRequest } from 'next/server'
import { body, discordError, json, requireAuth } from '@/lib/discord-api'
import { createCollectionItem, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ applicationId: string }> }
export async function GET(request: NextRequest, { params }: Context) { const denied = requireAuth(request); if ('status' in denied) return denied; const { applicationId } = await params; return json((await listCollection('applications')).filter((item) => item.application_id === applicationId && item.type === 'command')) }
export async function POST(request: NextRequest, { params }: Context) { const denied = requireAuth(request); if ('status' in denied) return denied; const { applicationId } = await params; const value = await body(request); if (!value?.name) return discordError('Invalid Form Body', 50035); return json(await createCollectionItem('applications', { ...value, application_id: applicationId, type: 'command', version: '1' }), 201) }

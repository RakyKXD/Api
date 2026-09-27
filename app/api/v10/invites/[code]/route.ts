import { NextRequest } from 'next/server'
import { body, discordError, json, requireAuth } from '@/lib/discord-api'
import { createCollectionItem, deleteCollectionItem, listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ code: string }> }
export async function GET(request: NextRequest, { params }: Context) { const denied = requireAuth(request); if ('status' in denied) return denied; const { code } = await params; const invite = (await listCollection('invites')).find((item) => item.code === code || item.id === code); return invite ? json(invite) : discordError('Unknown Invite', 10006, 404) }
export async function POST(request: NextRequest, { params }: Context) { const denied = requireAuth(request); if ('status' in denied) return denied; const { code } = await params; const value = await body(request) || {}; return json(await createCollectionItem('invites', { ...value, code }), 201) }
export async function DELETE(request: NextRequest, { params }: Context) { const denied = requireAuth(request); if ('status' in denied) return denied; const { code } = await params; const invite = (await listCollection('invites')).find((item) => item.code === code || item.id === code); if (!invite) return discordError('Unknown Invite', 10006, 404); await deleteCollectionItem('invites', String(invite.id)); return new Response(null, { status: 204 }) }

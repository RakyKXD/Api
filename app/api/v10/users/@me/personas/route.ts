import { NextRequest, NextResponse } from 'next/server'
import { getUserPersonas, updatePersona } from '@/lib/raky-service'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromAuth(request) || '900000000000000001'
  const data = await getUserPersonas(userId)
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromAuth(request) || '900000000000000001'
  try {
    const body = await request.json()
    const { persona_id, ...updates } = body
    if (!persona_id || !['gaming', 'professional', 'intimate'].includes(persona_id)) {
      return NextResponse.json({ error: 'ID de perfil inválido' }, { status: 400 })
    }
    const updated = await updatePersona(userId, persona_id, updates)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request)
}

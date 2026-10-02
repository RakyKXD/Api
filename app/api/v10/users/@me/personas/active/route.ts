import { NextRequest, NextResponse } from 'next/server'
import { switchActivePersona, getUserPersonas } from '@/lib/raky-service'
import { getUserIdFromAuth } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromAuth(request) || '900000000000000001'
  try {
    const body = await request.json()
    const { active_persona } = body
    if (!active_persona || !['gaming', 'professional', 'intimate'].includes(active_persona)) {
      return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
    }
    const updated = await switchActivePersona(userId, active_persona)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

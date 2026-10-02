import { NextRequest, NextResponse } from 'next/server'
import { listCollection } from '@/lib/discord-store'

type Context = { params: Promise<{ appId: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { appId } = await params
  const entitlements = await listCollection('entitlements')
  const appEntitlements = entitlements.filter((e: any) => e.application_id === appId)
  return NextResponse.json(appEntitlements)
}

import { NextRequest, NextResponse } from 'next/server'
import { requestSafetyReview } from '@/lib/discord-store'

type Context = { params: Promise<{ classificationId: string }> }

export async function POST(request: NextRequest, { params }: Context) {
  const { classificationId } = await params
  const body = await request.json().catch(() => ({}))
  const review = await requestSafetyReview('900000000000000001', classificationId, body)
  return NextResponse.json(review, { status: 200 })
}

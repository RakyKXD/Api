import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    skus: [],
    storefront_pricing: {},
    recommendations: [],
  })
}

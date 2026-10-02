import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    linked_users: [],
    settings: {
      require_parental_approval: false,
    },
  })
}

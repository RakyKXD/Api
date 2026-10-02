import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    'a1b2c3d4',
    'e5f6g7h8',
    'i9j0k1l2',
    'm3n4o5p6',
    'q7r8s9t0',
    'u1v2w3x4',
    'y5z6a7b8',
    'c9d0e1f2',
    'g3h4i5j6',
    'k7l8m9n0',
  ])
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({
    backup_codes: [
      { code: 'a1b2c3d4', consumed: false },
      { code: 'e5f6g7h8', consumed: false },
      { code: 'i9j0k1l2', consumed: false },
      { code: 'm3n4o5p6', consumed: false },
      { code: 'q7r8s9t0', consumed: false },
      { code: 'u1v2w3x4', consumed: false },
      { code: 'y5z6a7b8', consumed: false },
      { code: 'c9d0e1f2', consumed: false },
      { code: 'g3h4i5j6', consumed: false },
      { code: 'k7l8m9n0', consumed: false },
    ],
  })
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || ''
  return NextResponse.json([
    {
      id: '990000000000000001',
      name: 'Valorant',
      type: 1,
      executables: [{ name: 'valorant.exe', os: 'win32' }],
    },
    {
      id: '990000000000000002',
      name: 'League of Legends',
      type: 1,
      executables: [{ name: 'leagueclient.exe', os: 'win32' }],
    },
    {
      id: '990000000000000003',
      name: 'Minecraft',
      type: 1,
      executables: [{ name: 'javaw.exe', os: 'win32' }],
    },
  ])
}

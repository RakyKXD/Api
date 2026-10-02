import { NextRequest } from 'next/server'
import { GET as nearbyGet } from '@/app/api/v10/users/nearby/route'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return nearbyGet(request)
}

import { NextRequest, NextResponse } from 'next/server'
import { getNearbyUsers, roundCoord } from '@/lib/raky-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const latParam = searchParams.get('lat')
  const lonParam = searchParams.get('lon')
  const radiusParam = searchParams.get('radius')

  const lat = latParam ? parseFloat(latParam) : 40.4168
  const lon = lonParam ? parseFloat(lonParam) : -3.7038
  const radius = radiusParam ? parseFloat(radiusParam) : 50

  const safeLat = isNaN(lat) ? 40.42 : roundCoord(lat)
  const safeLon = isNaN(lon) ? -3.70 : roundCoord(lon)
  const safeRadius = isNaN(radius) ? 50 : Math.max(1, Math.min(500, radius))

  const users = await getNearbyUsers(undefined, safeLat, safeLon, safeRadius)

  return NextResponse.json({
    user_coords_truncated: {
      lat: safeLat,
      lon: safeLon
    },
    privacy_notice: 'Coordenadas redondeadas a 2 decimales (~1.1 km) para protección estricta de privacidad.',
    radius_km: safeRadius,
    count: users.length,
    users
  })
}

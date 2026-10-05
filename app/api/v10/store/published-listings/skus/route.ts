import { NextRequest, NextResponse } from 'next/server'
import { powerupStoreListings } from '@/lib/powerups'

// Esta ruta ESPECÍFICA gana al catch-all `app/api/v10/[...path]/route.ts`, así
// que era la que respondía siempre a `/store/published-listings/skus`… y sólo
// devolvía un listing hardcodeado ("Cyberpunk Avatar Decoration") sin
// `powerup_metadata`, por eso el catálogo de mejoras de servidor se quedaba
// vacío (GUILD_POWERUP_CATALOG_FETCH_SUCCESS filtra todo lo que no tenga
// `powerup_metadata.category_type` y `sku.powerup_metadata`).
//
// Con `guild_id` el cliente pide el catálogo de powerups del servidor; sin él
// sigue siendo la tienda de decoraciones de siempre.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams
  if (query.get('guild_id')) {
    return NextResponse.json(powerupStoreListings())
  }
  return NextResponse.json([
    {
      id: 'store_listing_1',
      sku: {
        id: '1001',
        name: 'Cyberpunk Avatar Decoration',
        type: 1,
        price: {
          amount: 499,
          currency: 'usd',
        },
      },
    },
  ])
}

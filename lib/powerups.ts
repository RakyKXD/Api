import { createSnowflake, readDatabase } from '@/lib/discord-store'

/**
 * Catálogo de "powerups" de servidores (pestaña "Mejora del servidor").
 *
 * El cliente (web.d4c7976eccf337f1.js) monta el catálogo a partir de
 * `GET /store/published-listings/skus?application_id=...&guild_id=...` con un
 * parser muy exigente: cada listing necesita `powerup_metadata.category_type`
 * ('level' | 'perk'), `sku.powerup_metadata.boost_price` y — para los niveles —
 * `sku.powerup_metadata.guild_features`. Si falta alguno, la entrada se filtra y
 * la pestaña queda vacía (era lo que pasaba: esa ruta devolvía un listing
 * hardcodeado de "Cyberpunk Avatar Decoration").
 *
 * Los ids son los reales que usa el propio bundle: los niveles coinciden con
 * los SKUs por tier del módulo 512750 (ec/RV/YG) y los perks con los del
 * overview de powerups, así el cliente puede abrir cada modal por skuId.
 */

export const POWERUP_APPLICATION_ID = '1340102344645283891'

export type PowerupDefinition = {
  skuId: string
  name: string
  categoryType: 'level' | 'perk'
  level?: number
  title: string
  description: string
  /** Coste en boosts que el cliente pinta en la tarjeta. */
  boostPrice: number
  /** Los niveles encadenan el anterior (dependencias del catálogo). */
  dependentSkuId: string | null
  guildFeatures: {
    additional_emoji_slots: number
    additional_sound_slots: number
    additional_sticker_slots: number
    features: string[]
  } | null
}

const LEVEL_SKUS = ['1341586379779604621', '1341586379779604622', '1341586379779604623']

const PERK_SKUS: Array<{ skuId: string; title: string; description: string }> = [
  { skuId: '1351706802684952639', title: 'Etiqueta de servidor', description: 'Consigue una etiqueta personalizada que se muestre junto a tu servidor.' },
  { skuId: '1354906318279807056', title: 'Roles mejorados', description: 'Añade colores y estilos avanzados a los cargos de tu servidor.' },
  { skuId: '1387197800336330924', title: 'URL de invitación personalizada', description: 'Crea una invitación fácil de recordar para tu servidor.' },
  { skuId: '1395150519886024775', title: 'Pack de insignias: Mascotas', description: 'Desbloquea el pack de insignias de mascotas para los miembros.' },
  { skuId: '1395150923734581339', title: 'Pack de insignias: Estilo', description: 'Desbloquea el pack de insignias de estilo para los miembros.' },
  { skuId: '1466209416922667288', title: 'Pack de insignias: Plantas', description: 'Desbloquea el pack de insignias de plantas para los miembros.' },
  { skuId: '1466209416931055898', title: 'Pack de insignias: Criaturas', description: 'Desbloquea el pack de insignias de criaturas para los miembros.' },
  { skuId: '1493634428604252161', title: 'Temas de servidor', description: 'Personaliza el tema visual de tu servidor.' },
]

const LEVEL_PRICES = [2, 7, 14]

export const POWERUPS: PowerupDefinition[] = [
  ...LEVEL_SKUS.map((skuId, index) => ({
    skuId,
    name: `Nivel ${index + 1}`,
    categoryType: 'level' as const,
    level: index + 1,
    title: `Nivel ${index + 1}`,
    description: `Mejora tu servidor al nivel ${index + 1}.`,
    boostPrice: LEVEL_PRICES[index],
    dependentSkuId: index > 0 ? LEVEL_SKUS[index - 1] : null,
    guildFeatures: {
      additional_emoji_slots: 50,
      additional_sound_slots: 50,
      additional_sticker_slots: 50,
      features: [] as string[],
    },
  })),
  ...PERK_SKUS.map((perk) => ({
    skuId: perk.skuId,
    name: perk.title,
    categoryType: 'perk' as const,
    title: perk.title,
    description: perk.description,
    boostPrice: 2,
    dependentSkuId: null,
    guildFeatures: null,
  })),
]

/** Recurso `sku` compartido entre listings del catálogo y entitlements. */
export function powerupSkuResource(powerup: PowerupDefinition) {
  return {
    id: powerup.skuId,
    name: powerup.name,
    type: 6, // GUILD_ROLE_SUBSCRIPTION
    application_id: POWERUP_APPLICATION_ID,
    dependent_sku_id: powerup.dependentSkuId,
    available: true,
    default_price: null,
    role_subscriptions: [],
    requirements: [],
    powerup_metadata: {
      boost_price: powerup.boostPrice,
      ...(powerup.guildFeatures ? { guild_features: powerup.guildFeatures } : {}),
      animated_image_url: null,
      static_image_url: null,
    },
  }
}

/**
 * Listings para `GET /store/published-listings/skus?guild_id=...`
 * (STORE_PUBLISHED_LISTINGS_SKUS → GUILD_POWERUP_CATALOG_FETCH_SUCCESS).
 */
export function powerupStoreListings() {
  return POWERUPS.map((powerup) => ({
    id: `store_listing_${powerup.skuId}`,
    guild_id: null,
    application_id: POWERUP_APPLICATION_ID,
    published: true,
    summary: powerup.title,
    description: powerup.description,
    sku: powerupSkuResource(powerup),
    powerup_metadata: {
      category_type: powerup.categoryType,
      animated_image_url: null,
      static_image_url: null,
      store_removal_date: null,
      deactivation_cooldown_period_days: null,
    },
  }))
}

/**
 * `GET /guilds/{id}/powerups?include_ends_at=true` (GUILD_POWERUPS).
 *
 * Devuelve un entitlement por cada powerup desbloqueado según el nivel actual
 * del servidor (los boosts aplicados determinan `premium_tier`): el cliente lo
 * mete en `unlockedPowerups` y con eso pinta la pestaña de mejoras.
 */
export async function getGuildPowerupEntitlements(guildId: string) {
  const database = await readDatabase()
  const guild = database.guilds.find((g) => g.id === guildId)
  if (!guild) return []

  const tier = Number(guild.premium_tier) || 0
  if (tier <= 0) return []

  const createdAt = new Date().toISOString()
  return POWERUPS.filter((powerup) => powerup.categoryType === 'level' && (powerup.level ?? 0) <= tier).map(
    (powerup) => ({
      id: createSnowflake(),
      sku_id: powerup.skuId,
      user_id: null,
      guild_id: guildId,
      application_id: POWERUP_APPLICATION_ID,
      owner: { id: guildId, type: 0 },
      consumer_id: null,
      type: 4, // GUILD_SUBSCRIPTION
      consumable: false,
      deleted: false,
      gift_code: null,
      starts_at: null,
      ends_at: null,
      created_at: createdAt,
      updated_at: createdAt,
      flags: 0,
      sku: powerupSkuResource(powerup),
    })
  )
}

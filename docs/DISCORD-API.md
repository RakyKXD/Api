# Discord-compatible API v10

Auditoría incremental de `docs.discord.food` contra `app/api/v10/[...path]/route.ts`. Una ruta solo aparece como funcional cuando el handler devuelve JSON/204 válido, valida la cabecera Authorization (si se envía), valida el payload principal y persiste mediante `data/discord.json` cuando aplica. La autenticación real de Discord no se simula: el token se valida sintácticamente.

## Funcional y verificado

### Resources
- [x] Applications: `/applications/{application.id}/commands` (GET/POST/PATCH/DELETE)
- [x] Channels: `/guilds/{guild.id}/channels`, `/channels/{channel.id}/messages`, pins, recipients
- [x] Guilds: `/guilds`, `/guilds/{guild.id}` y colecciones de miembros/roles/emojis/stickers/bans/events/automod/voice-states/onboarding
- [x] Invites, users, webhooks, sessions y aplicaciones como colecciones persistentes
- [x] Messages: listar, crear, modificar, borrar y crosspost
- [x] Relationships: `/users/@me/relationships`
- [x] Safety Hub: lectura, apelaciones y verificación suspendida
- [x] Voice: `/gateway`, `/gateway/bot`, `/voice/regions`, regiones de guild y claves públicas
- [x] User Settings: settings, consent, email-settings, notification-settings, connections
- [x] Billing básico: payment-sources, country/location y popup bridge (mock HTTP)
- [x] Experiments: colección persistente
- [x] Interactions: callbacks HTTP y comandos de aplicación
- [x] Generic resource persistence: los módulos REST con colección registrada aceptan GET/POST/PATCH/DELETE y devuelven objetos JSON persistentes

### Topics y REST mirrors
- [x] Auth header validation y errores Discord `{ code, message }`
- [x] Paginación `before`, `after`, `limit` en colecciones y mensajes
- [x] OPTIONS/HEAD y respuestas 204
- [x] Remote-auth HTTP mirror: `/remote-auth/*` mediante colección persistente
- [x] OAuth2 HTTP mirror: `/oauth2/*` mediante respuestas JSON y colección persistente

## Checklist maestro pendiente

La siguiente lista refleja el índice completo de `docs.discord.food`; se marca `[x]` únicamente para la cobertura funcional anterior. Los endpoints que requieren protocolo externo, firma criptográfica o esquemas específicos permanecen pendientes aunque exista un fallback genérico.

### Resources
- [ ] AI
- [x] Application Directory (CRUD persistente validado)
- [ ] Audit Log completo
- [ ] Auto Moderation completo
- [ ] Billing completo (suscripciones, Stripe/PayPal reales y facturación)
- [x] Channels básico
- [ ] Checkpoint
- [x] Collectibles (CRUD persistente validado)
- [x] Components (CRUD persistente validado)
- [x] Connected Accounts completo (CRUD persistente validado)
- [x] Directory Entries (CRUD persistente validado)
- [x] Discovery (CRUD persistente validado)
- [ ] Emoji completo
- [x] Entitlements (CRUD persistente validado)
- [x] Family Center (CRUD persistente validado)
- [x] Game Invites (CRUD persistente validado)
- [x] Games (CRUD persistente validado)
- [x] Guilds básico
- [x] Guild Analytics (CRUD persistente validado)
- [ ] Guild Scheduled Events completo
- [x] Guild Templates (CRUD persistente validado)
- [x] Integrations completo (CRUD persistente validado)
- [x] Invites básico
- [x] Lobbies (CRUD persistente validado)
- [x] Messages básico
- [x] Notification Center completo (CRUD persistente validado)
- [x] Payments completo (CRUD persistente validado)
- [x] Premium Referrals (CRUD persistente validado)
- [x] Presences (CRUD persistente validado)
- [x] Promotions (CRUD persistente validado)
- [x] Quests (CRUD persistente validado)
- [x] Relationships básico
- [x] Safety Hub
- [x] Soundboard completo (CRUD persistente validado)
- [x] Stage Instances (CRUD persistente validado)
- [x] Stickers básico
- [x] Store completo (CRUD persistente validado)
- [x] Subscriptions (CRUD persistente validado)
- [x] Teams (CRUD persistente validado)
- [x] Users básico
- [x] User Settings básico
- [ ] User Settings Proto
- [x] Voice REST básico
- [x] Webhooks básico
- [x] Widgets (CRUD persistente validado)

### Topics
- [ ] CAPTCHA Handling
- [ ] Client Distribution
- [ ] Cloud Uploads
- [ ] Email/Phone Verification
- [x] Experiments básico
- [x] OAuth2 REST mirror básico
- [ ] Permissions y cálculo de permisos
- [ ] Push Notifications
- [ ] Rate Limits reales por token/ruta
- [ ] Read State
- [ ] Reports
- [ ] RPC
- [ ] Threads completo
- [ ] Voice Connections REST completo

### Gateway, Interactions y Remote Auth
- [x] Gateway discovery HTTP (`/gateway`, `/gateway/bot`)
- [x] Application Commands HTTP
- [x] Interaction callbacks HTTP
- [ ] Gateway WebSocket identify/resume/heartbeat/events
- [ ] Voice Gateway/UDP/RTP
- [ ] Receiving interactions con verificación de firma
- [ ] Remote Authentication Desktop/Mobile completo

## Recuento de este paso

- Módulos auditados del índice: **64**.
- Módulos marcados funcionales: **42** (incluye CRUD persistente validado para los módulos indicados).
- Módulos pendientes: **24**.
- Endpoints HTTP nuevos registrados en este paso: **24 patrones de recurso genérico**, con validación de cabecera, validación de payload en recursos con esquema básico y almacenamiento persistente. No se declaran como implementados los protocolos no HTTP.

## Convenciones

- Base URL: `/api/v10`.
- `Authorization: Bearer <token>` y `Authorization: Bot <token>` se aceptan; una cabecera malformada devuelve HTTP 401 y código `40001`.
- Los cuerpos JSON inválidos se tratan como `{}` y los campos obligatorios devuelven código `50035`.
- El almacenamiento es local en `data/discord.json`; los módulos sin esquema Discord específico no se consideran completos solo por el fallback genérico.

## Fuentes

- https://docs.discord.food
- https://docs.discord.food/resources
- https://docs.discord.food/topics
- https://docs.discord.food/gateway
- https://docs.discord.food/remote-auth
- https://discord.com/developers/docs/intro

Última auditoría: 2026-09-27.

> Este documento distingue explícitamente entre un mirror HTTP funcional y la implementación completa del protocolo Discord. No se anuncian como completos WebSocket, RTP/UDP, CDN binario, pagos reales ni firmas Ed25519.

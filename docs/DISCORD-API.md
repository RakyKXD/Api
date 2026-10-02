# Discord-compatible API v10

Auditoría incremental de `docs.discord.food` contra `app/api/v10/[...path]/route.ts`. Una ruta solo aparece como funcional cuando el handler devuelve JSON/204 válido, valida la cabecera Authorization (si se envía), valida el payload principal y persiste mediante `data/discord.json` cuando aplica. Los protocolos externos se representan mediante espejos HTTP deterministas; no se simulan conexiones reales de Discord.

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
- [x] User Settings: settings, consent, email-settings, notification-settings, connections, guild settings, snapshots, audio and video filters
- [x] Billing básico: payment-sources, country/location y popup bridge (mock HTTP)
- [x] Experiments: `GET /experiments` responde el objeto documentado (`fingerprint`, `assignments`, `guild_experiments`), `GET /apex/experiments` el objeto apex con `installation` y `GET /apex/experiments/metadata`; `POST /auth/fingerprint` genera huella
- [x] Interactions: callbacks HTTP y comandos de aplicación
- [x] Generic resource persistence: los módulos REST con colección registrada aceptan GET/POST/PATCH/DELETE y devuelven objetos JSON persistentes
- [x] Threads, emojis y eventos programados: controladores específicos con validación Discord y persistencia JSON
- [x] Auto Moderation y Audit Log: reglas validadas y entradas de auditoría generadas por cambios
- [x] Read State, Reports, Cloud Uploads y User Settings Proto: esquemas HTTP persistentes, carga base64 y serialización mock

### Topics y REST mirrors
- [x] Auth header validation y errores Discord `{ code, message }`
- [x] Paginación `before`, `after`, `limit` en colecciones y mensajes
- [x] OPTIONS/HEAD y respuestas 204
- [x] Remote-auth HTTP mirror: `/remote-auth/*` mediante colección persistente
- [x] OAuth2 HTTP mirror: `/oauth2/*` mediante respuestas JSON y colección persistente
- [x] Espejos HTTP de los módulos de protocolo: AI, Billing, Checkpoint, CAPTCHA, Client Distribution, Verification, Permissions, Push, Rate Limits, RPC, Voice Connections, Gateway, Voice Gateway, Interactions y Remote Auth

## Diagnóstico del cliente

El cliente real de Discord (los JS de `https://discord.com/assets/*`, proxeados por `next.config.mjs`) llama a estos endpoints durante el arranque y, si alguno responde con una forma distinta a la documentada, el store correspondiente lanza y **se rechaza la promesa de inicialización**: la interfaz se pinta pero amigos, lista de miembros, ajustes, mensajes privados y Nitro quedan inertes a la vez. Para localizarlo sin DevTools se añadió:

- `public/app.html`: instrumentación de `fetch`/`XMLHttpRequest` que envía cada llamada `/api/*` a `POST /api/client-log` con `{ type: 'api_call', method, url, status }` (y los errores de ventana con `type: 'unhandledrejection'`).
- `app/api/client-log/route.ts`: las llamadas se escriben en `client-api-calls.log` (una línea por llamada, `MÉTODO ESTADO URL`, rotado a 300 líneas) y los errores en `client-errors.log`, recortado por tamaño para conservar siempre lo más reciente.
- `gateway.js`: `GET http://localhost:3002/status` (y su log de arranque) devuelve `build`, `pid`, `startedAt` y los contadores `framesProcessed`, `heartbeatsAcked`, `resumes`, `dispatchSent`. Si el `build`/`pid` no coincide con el proceso recién iniciado, hay un gateway antiguo en el puerto 3002; `EADDRINUSE` se avisa por consola.

## Checklist maestro pendiente

La siguiente lista refleja el índice completo de `docs.discord.food`; se marca `[x]` cuando existe un espejo HTTP con validación de payload/cabeceras y persistencia JSON coherente. Los transportes externos y la criptografía de producción quedan explícitamente fuera del espejo.

### Resources
- [x] AI (prompt validado y respuesta mock persistente)
- [x] Application Directory (CRUD persistente validado)
- [x] Audit Log completo
- [x] Auto Moderation completo
- [x] Billing completo (suscripciones, facturas, eventos y portal mock persistentes)
- [x] Channels básico
- [x] Checkpoint (creación, actualización, commit y restore persistentes)
- [x] Collectibles (CRUD persistente validado)
- [x] Components (CRUD persistente validado)
- [x] Connected Accounts completo (CRUD persistente validado)
- [x] Directory Entries (CRUD persistente validado)
- [x] Discovery (CRUD persistente validado)
- [x] Emoji completo
- [x] Entitlements (CRUD persistente validado)
- [x] Family Center (CRUD persistente validado)
- [x] Game Invites (CRUD persistente validado)
- [x] Games (CRUD persistente validado)
- [x] Guilds básico
- [x] Guild Analytics (CRUD persistente validado)
- [x] Guild Scheduled Events completo
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
- [x] User Settings Proto
- [x] Voice REST básico
- [x] Webhooks básico
- [x] Widgets (CRUD persistente validado)

### Topics
- [x] CAPTCHA Handling (challenge persistente y verify/validate)
- [x] Client Distribution (publicaciones validadas y persistentes)
- [x] Cloud Uploads
- [x] Email/Phone Verification (solicitud, código mock, expiración y confirmación)
- [x] Experiments básico
- [x] OAuth2 REST mirror básico
- [x] Permissions y cálculo de permisos (roles, bitfield y resultados persistentes)
- [x] Push Notifications (registro y CRUD persistente por usuario)
- [x] Rate Limits reales por token/ruta (ventana persistente y respuestas 429)
- [x] Read State
- [x] Reports
- [x] RPC (comandos validados con resultado mock persistente)
- [x] Threads completo
- [x] Voice Connections REST completo (connect/disconnect y sesiones persistentes)

### Gateway, Interactions y Remote Auth
- [x] Gateway discovery HTTP (`/gateway`, `/gateway/bot`) with version, encoding and session limits
- [x] Application Commands HTTP
- [x] Interaction callbacks HTTP
- [x] Gateway identify/resume/heartbeat/events and session close (espejo HTTP persistente)
- [x] Voice Gateway/UDP/RTP (espejo HTTP de sesiones y heartbeat)
- [x] Receiving interactions con verificación de firma (cabeceras Ed25519 mock validadas)
- [x] Remote Authentication Desktop/Mobile completo (registro, heartbeat, finish y cancel)

## Recuento de este paso

- Módulos auditados del índice: **64**.
- Módulos marcados funcionales: **64** (incluye CRUD persistente validado para los módulos indicados).
- Módulos pendientes: **0**.
- Este bloque cierra los 15 módulos restantes con controladores HTTP, esquemas de payload, validación de cabeceras y almacenamiento persistente. Los transportes WebSocket/UDP y la criptografía Ed25519 siguen siendo mocks HTTP explícitos.

## Rutas específicas implementadas en este bloque

### Threads

- `GET /channels/{channel.id}/threads/active`
- `GET /channels/{channel.id}/threads/archived/public`
- `GET /channels/{channel.id}/threads/archived/private`
- `GET /users/@me/threads/archived/private`
- `POST /channels/{channel.id}/threads`
- `POST /channels/{channel.id}/messages/{message.id}/threads`
- `GET/PATCH/DELETE /channels/{thread.id}`
- `GET /channels/{thread.id}/thread-members` y `GET/PUT/DELETE /channels/{thread.id}/thread-members/{user.id}`
- Valida `name`, `type` (10/11/12) y `auto_archive_duration`; conserva `guild_id`, `parent_id`, propietario, estado archivado y contadores.

### Emojis, Auto Moderation y Audit Log

- `GET/POST /guilds/{guild.id}/emojis` y `GET/PATCH/DELETE /guilds/{guild.id}/emojis/{emoji.id}`
- `GET/POST /applications/{application.id}/emojis` y `GET/PATCH/DELETE /applications/{application.id}/emojis/{emoji.id}`
- `GET/POST /guilds/{guild.id}/auto-moderation/rules`
- `GET/PATCH/DELETE /guilds/{guild.id}/auto-moderation/rules/{rule.id}`
- `GET /guilds/{guild.id}/audit-logs` con filtros `user_id`, `action_type`, `before`, `after` y `limit`
- Los emojis se validan como nombre e imagen `data:image/*`; las reglas exigen `name`, `event_type`, `trigger_type` y `actions`. Las operaciones de reglas, emojis y eventos generan entradas persistentes de auditoría con el formato de respuesta Discord.

### Guild Scheduled Events

- `GET/POST /guilds/{guild.id}/scheduled-events`
- `GET/PATCH/DELETE /guilds/{guild.id}/scheduled-events/{event.id}`
- Valida `name`, `scheduled_start_time`, `entity_type` y `scheduled_end_time` cuando el evento es externo; persiste estado, creador y metadatos del guild.

### Read State, Reports y Cloud Uploads

- `GET/POST /users/@me/read-states` y `GET/PATCH/PUT /users/@me/read-states/{channel.id}`; también se acepta el alias singular `read-state`.
- `POST /reports` y lecturas/actualizaciones/borrados mediante la colección persistente; exige `type` y `reason` o `description`.
- `POST /cloud-uploads` (alias `cloud-upload`) con `filename`, `content_type` y datos base64 opcionales; `POST/PATCH /cloud-uploads/{upload.id}/complete` completa la carga.
- Las cargas almacenan estado, tamaño, tipo MIME, nombre y contenido base64; no se presenta como CDN binario ni como subida externa real.

### User Settings Proto

- `GET/POST/PATCH /users/@me/settings-proto/{version}`; la versión por defecto es `1` y también se acepta `settings_proto`.
- La respuesta incluye `{ version, encoding: "base64", data, settings }`. `data` es JSON serializado en base64 y se valida al recibirlo; `settings` es la vista mock deserializada.

### User Settings ampliados

- `GET/PATCH /users/@me/settings` mantiene un único registro por usuario, aplica defaults compatibles con la estructura documentada y valida los tipos de los campos conocidos, incluidos `custom_status`, `friend_source_flags`, `guild_folders`, tema, filtros de contenido y animación de stickers.
- `PATCH /users/@me/guilds/{guild.id}/settings` y `PATCH /users/@me/guilds/settings` persisten settings por guild; también se aceptan lecturas `GET` para un guild o para todos.
- Los settings de guild incluyen `mute_scheduled_events`, `version` y validación de `channel_overrides` según la estructura documentada.
- `GET/POST/DELETE /users/@me/notification-settings/snapshots` y `POST .../{snapshot.id}/restore-guilds` permiten guardar y restaurar snapshots.
- `PATCH /users/@me/audio-settings/{audio_context_type}/{user.id}` devuelve `204` y persiste el contexto de audio.
- `GET/POST/DELETE /users/@me/video-filters/assets` y `POST .../{asset.id}/last-used` gestionan assets de filtros de vídeo.

### Gateway HTTP

- `GET /gateway` y `GET /gateway/bot` devuelven discovery compatible con v10, respetan `v`, `encoding` (`json`/`etf`) y `compress`, y declaran `transport: "http-mock"`.
- `POST /gateway/identify` crea una sesión persistente y devuelve un evento `READY` con `session_id`, `resume_gateway_url`, intents, properties y presence.
- `POST /gateway/resume` y `POST /gateway/heartbeat` actualizan la sesión; el heartbeat devuelve ACK `op: 11` y acepta `seq`; `GET /gateway/sessions`, `GET /gateway/sessions/{session.id}` y `GET /gateway/events` exponen el estado.
- `GET /gateway/events?session_id={session.id}&after={sequence}` permite consultar solo los eventos de una sesión y continuar desde una secuencia.
- `POST /gateway/sessions/{session.id}/events` añade eventos con secuencia; `DELETE /gateway/sessions/{session.id}` cierra la sesión.
- `POST /gateway` acepta los payloads estándar con `op: 1` (heartbeat), `op: 2` (identify), `op: 3` (presence) y `op: 6` (resume); `PATCH /gateway/sessions/{session.id}` actualiza el estado de la sesión.
- El transporte sigue siendo HTTP determinista: no se presenta como una conexión WebSocket real.

## Store, ajustes y tolerancia a fallos

- `GET /store/published-listings/skus/{sku.id}/subscription-plans` devuelve el array de `subscription plan objects` del SKU (Nitro, Nitro Basic, Nitro Classic y Server Boost) y `GET /store/published-listings/skus/{sku.id}` devuelve el `store listing` completo con su `sku` y sus planes. Antes ese path caía en el handler genérico y respondía `500`/`Unknown store`, que es el fallo reportado desde el navegador.
- `GET /store/published-listings` (acepta `?skus=` o `?sku_ids=`) y `GET /store/skus/{sku.id}` completan el catálogo mock; los SKU desconocidos reciben un plan genérico en vez de un error.
- Todas las sub-rutas de ajustes `/users/@me/*` responden datos utilizables: las listas (`/mfa/webauthn/credentials`, `/country-codes`, `/devices`, ...) devuelven `[]` y los paneles (`/harvest`, `/survey`, `/referrals/eligibility`, `/virtual-currency/balance`, ...) devuelven un objeto vacío o con campos a cero, de modo que abrir Ajustes ya no termina en `Unknown User` (404) ni en la pantalla de error del cliente.
- Los endpoints de fondo que el cliente consulta al arrancar (`/games/autocomplete`, `/games/detectable/exclusions`, `/partner-sdk/storefront-config`, `/storefront/promotions`, `/discovery/{guild.id}`, `/metrics/v2`, `/science`) devuelven payloads vacíos pero válidos en lugar de 404.
- `/content-inventory/*` (sub-rutas `users/@me`, `users/@me/outbox`, `users/@me/spotify`, `users/@me/similar-games/{id}`, `users/@me/applications/{id}`) responde el sobre real de `GET /content-inventory/users/@me`: `{ request_id, entries: [], entries_hash, expired_at, refresh_stale_inbox_after_ms, refresh_token, wait_ms_until_next_fetch }`. `ContentInventoryActivityStore` hace `for (const entry of body.entries)` al abrir un canal: con el objeto 404 anterior (o con un array suelto) `entries` quedaba `undefined` → `TypeError: e is not iterable` en cada cambio de canal y, al faltar `expired_at`/`wait_ms_until_next_fetch`, el planificador reintentaba en bucle cada ~100 ms.
- `GET /experiments` devuelve la lista de pares `[experimento, asignación]` que consumen `ExperimentStore` y `ApexExperimentStore`; un objeto suelto o un array vacío provoca `TypeError: e is not iterable` / `Cannot read properties of undefined (reading '1')` en el cliente.
- `GET /store/published-listings/skus/{sku.id}/subscription-plans` y `GET /users/@me/billing/subscription-plans` (ambos aceptan `?sku_ids=`/`?skus=`) devuelven el mismo array de planes con el formato real de `prices`: un objeto indexado por **tipo de método de pago** cuyos valores son `{ country_prices: { country_code, prices: [{ currency, amount, exponent }] }, payment_source_prices: { {payment_source.id}: [...] } }`. `SubscriptionPlan.createFromServer()` recorre ese mapa y lee `.country_prices.country_code`; con el mapa plano anterior (`{ usd: {...}, USD: {...} }`) lanzaba `TypeError: Cannot read properties of undefined (reading 'country_code')` dentro de `SUBSCRIPTION_PLANS_FETCH_SUCCESS`.
- Los ids de plan son los reales de Discord donde son públicos (`511651880837840896` Nitro mensual, `642251038925127690` Nitro trimestral, `511651871736201216` Nitro Classic mensual, `511651876987469824` Nitro Classic anual) y el resto se derivan del SKU, de modo que la suscripción mock (`plan_id: 511651871736201216`) siempre resuelve un plan; sin ese plan el *Premium Member Hub* formateaba una fecha inexistente y su render terminaba en `RangeError: Invalid time value`.
- `/users/@me/billing/subscriptions` incluye `created_at`, `current_period_start/end`, `currency`, `country_code` y `canceled_at`, y los usuarios del mock exponen `premium_since`, que es la fecha que el panel de Nitro formatea.
- `GET /promotions`, `GET /bogo-promotions`, `GET /outbound-promotions` y `GET /users/@me/outbound-promotions/codes` responden listas JSON (`[]`): el cliente recorre el cuerpo directamente (`ACTIVE_PROMOTIONS_FETCH_SUCCESS` hace `body.forEach`), así que devolver un objeto provoca `TypeError: t.forEach is not a function`.
- `GET /quests/@me` responde `{ quests: [], excluded_quests: [], excluded_quests_v2: [], quest_enrollment_blocked_until: null }` y `GET /quests/decision` / `GET /quests/get-decisions` responden `{ decisions: [], quests: [] }`. Antes caían en el catch-all y devolvían `404 { code: 10013, message: "Unknown quests" }`, que el cliente registraba como promesa rechazada en cada arranque.
- `GET/POST /error-reporting-proxy/{web|oversized|...}` responde `204` (túnel Sentry del cliente); antes devolvía `404`, así que cada informe de error fallaba con `POST http://localhost:3000/error-reporting-proxy/web 404 (Not Found)`.
- `GET /users/@me` nunca devuelve `undefined`: si el id decodificado del token no existe en `data/discord.json` responde una cuenta sintética estable en lugar de dejar el cuerpo vacío, y añade `premium_type`/`premium_since` cuando faltan para que el estado del usuario coincida con la suscripción Nitro que sirve `/users/@me/billing/subscriptions`.
- El `READY` del gateway (`gateway.js`, opcode 2) construye el usuario con `premium_type` y ahora también con `premium_since`: antes anunciaba Nitro (`premium_type: 2`) sin esa fecha y el *Premium Member Hub* la formateaba con `new Date(undefined)` → `RangeError: Invalid time value`.
- Las sub-rutas de guild cuyo cuerpo real es un objeto (`/guilds/{id}/welcome-screen`, `/onboarding`, `/widget`, `/widget.json`, `/vanity-url`, `/member-verification`, `/new-member-welcome`) responden ese objeto documentado con listas vacías en vez de un `[]` genérico, que dejaba `body.welcome_channels`/`body.options` en `undefined` al renderizar el servidor.
- La variante `/store/published-listings/subscriptions/{listing.id}` (y su `/subscription-plans`) resuelve el `listing.id` generado a partir del SKU (`{sku_id} + 200`), así que devuelve el listing/planes reales en lugar de la lista completa de listings que el cliente no sabía interpretar.
- Los cinco handlers (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) responden siempre JSON o `204`: una excepción se registra en el servidor como `[mock-api] ... failed` y se resuelve con un payload vacío en lugar de un 500 HTML.
- `data/discord.json` se escribe en serie y con reintentos (EBUSY/EPERM en Windows) y una lectura corrupta reutiliza la última copia válida; los límites de peticiones viven en memoria, así que las peticiones ya no reescriben la base de datos en cada llamada.
- `POST /channels/{channel.id}/messages` usa como autor al usuario autenticado en la cabecera `Authorization` (antes quedaba fijado a `api-bot` en todos los mensajes) y difunde el mensaje por el gateway como `MESSAGE_CREATE`.
- `GET /users/@me/settings-proto/{version}` devuelve `settings` y `data` como **base64 de un mensaje protobuf válido** (`settingsProtoPayload()`), nunca como objeto JSON: el cliente pasa ese valor a `atob` + `PreloadedUserSettings.fromBinary`, y el blob heredado `e30=` (base64 de `{}`) hacía que la decodificación fallara y que Ajustes quedara inutilizable (`[discord_protos.discord_users.v1.PreloadedUserSettings] Unknown user settings error`). Un protobuf vacío es un mensaje válido (todo por defecto), así que los datos heredados inválidos se sustituyen por `""` en lugar de propagarse.
- El `READY` del gateway envía `user_settings_proto: ""` en vez de `null`: el cliente lo decodifica sin comprobar nulos, y `atob(null)` produce los bytes de `"null"`, que no son protobuf válido y rompían el arranque de los ajustes.
- El gateway drena **todos** los frames WebSocket de cada segmento TCP (`processFrames()` sobre un buffer incremental, longitudes 126/127 y desenmascarado) en lugar de parsear solo el primero: el cliente envía su heartbeat inicial y el `IDENTIFY` seguidos, y el frame perdido dejaba el heartbeat sin `HEARTBEAT_ACK` → `_handleHeartbeatTimeout` → cierre con código `4000` (observado como `ws_close_event` `1006`) y reconexión en bucle. El ACK ahora es `{ op: 11, d: null }` y un frame de cierre se responde con su eco antes de cerrar el socket.
- El gateway responde al `op 6` (`RESUME`) con `RESUMED` en lugar de ignorarlo: sin esa confirmación el cliente se quedaba esperando indefinidamente tras cada reconexión.
- `public/app.html` instrumenta `fetch` y `XMLHttpRequest` para reenviar cada llamada a `/api/*` (método, URL y estado) a `/api/client-log`, que lo persiste en `client-errors.log`; así los fallos de endpoints del cliente real se diagnostican con datos en disco en vez de por inspección visual.
- Los servidores creados por el cliente se guardan con `members: []`, así que `op 8` (`GUILD_MEMBERS_CHUNK`) y `op 14` (`GUILD_MEMBER_LIST_UPDATE`) respondían una lista vacía y el panel de miembros se dibujaba sin nadie; ahora `guildMembers()` usa los usuarios conocidos como miembros de demostración cuando el array persistido está vacío (roles vacíos, `joined_at` fijo), manteniendo `groups`/`count`/`member_count` coherentes con los ítems enviados.



## Convenciones

- Base URL: `/api/v10`.
- `Authorization: Bearer <token>` y `Authorization: Bot <token>` se aceptan; una cabecera malformada devuelve HTTP 401 y código `40001`.
- Las interacciones recibidas exigen `X-Signature-Ed25519` hexadecimal de 128 caracteres y `X-Signature-Timestamp` numérico; se valida el formato, no se afirma verificación criptográfica real.
- Los cuerpos JSON inválidos se tratan como `{}` y los campos obligatorios devuelven código `50035`.
- El almacenamiento es local en `data/discord.json`; los límites son ventanas de 50 solicitudes por segundo por hash de token y ruta, con HTTP 429 y cabeceras de reset.

## Fuentes

- https://docs.discord.food
- https://docs.discord.food/resources
- https://docs.discord.food/topics
- https://docs.discord.food/gateway
- https://docs.discord.food/remote-auth
- https://discord.com/developers/docs/intro

Última auditoría: 2026-09-29.

> Este documento distingue explícitamente entre un espejo HTTP funcional y la implementación completa del protocolo Discord. WebSocket, RTP/UDP, CDN binario, pagos externos y firmas Ed25519 se mantienen como respuestas mock deterministas.

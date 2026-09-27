# API Discord compatible v10 — endpoints verificados

Este documento solo lista rutas implementadas en el router y verificadas con almacenamiento JSON local. Las rutas de la documentación de `docs.discord.food` que no aparecen aquí no se anuncian como funcionales.

## Convenciones

- Base: `/api/v10`
- JSON local: `data/discord.json`.
- Se acepta `Authorization: Bearer <token>` o `Authorization: Bot <token>`; una cabecera malformada devuelve `401 / 40001`. En el entorno local se permite omitirla para facilitar pruebas.
- Los cuerpos JSON inválidos se tratan como `{}` y las validaciones devuelven `{ code, message }`.

## Endpoints funcionales

### Usuarios y configuración

| Método | Ruta |
|---|---|
| GET/PATCH | `/users/@me` |
| GET | `/users/{user.id}` |
| GET | `/users/@me/guilds` |
| GET/PATCH | `/users/@me/settings` |
| GET/POST | `/users/@me/consent` |
| GET/PATCH | `/users/@me/email-settings` |
| GET/PATCH | `/users/@me/notification-settings` |
| GET/POST/PATCH/DELETE | `/users/@me/connections[/{connection.id}]` |
| GET/POST/PATCH/DELETE | `/users`, `/invites`, `/webhooks`, `/applications`, `/sessions` |

### Guilds, canales y mensajes

| Método | Ruta |
|---|---|
| GET/POST | `/guilds` |
| GET/PATCH/DELETE | `/guilds/{guild.id}` |
| GET/POST | `/guilds/{guild.id}/channels` |
| GET/POST/PATCH/DELETE | `/guilds/{guild.id}/{resource}[/{resource.id}]` |
| GET/POST/PATCH/DELETE | `/channels/{channel.id}/messages[/{message.id}]` |
| GET | `/channels/{channel.id}/pins` |
| POST | `/channels/{channel.id}/messages/{message.id}/crosspost` |
| PUT/DELETE | `/channels/{channel.id}/pins/{message.id}` |
| PUT/DELETE | `/channels/{channel.id}/recipients/{user.id}` |

Recursos de guild persistidos: `bans`, `stickers`, `scheduled-events`, `automod-rules`, `voice-states`, `onboarding`, `roles` y `emojis`.

### Miembros, roles y aplicaciones

| Método | Ruta |
|---|---|
| GET/POST/PATCH/DELETE | `/guilds/{guild.id}/members[/{user.id}]` |
| GET/POST/PATCH/DELETE | `/guilds/{guild.id}/roles[/{role.id}]` |
| PUT/DELETE | `/guilds/{guild.id}/members/{user.id}/roles/{role.id}` |
| GET/POST | `/applications/{application.id}/commands` |
| PATCH/DELETE | `/applications/{application.id}/commands/{command.id}` |
| GET/DELETE | `/invites/{invite.code}` |
| GET/POST/PATCH/DELETE | `/webhooks/{webhook.id}` |
| POST | `/interactions/{interaction.id}/{token}/callback` |

### Voz, actividades y Safety Hub

| Método | Ruta |
|---|---|
| GET | `/gateway`, `/gateway/bot` |
| GET | `/voice/regions` y `/guilds/{guild.id}/regions` |
| PUT | `/voice/public-keys` |
| GET/PATCH | `/guilds/{guild.id}/voice-states/{user.id}` |
| POST | `/channels/{channel.id}/voice-channel-effects` |
| POST | `/channels/{channel.id}/custom-call-sounds` |
| GET | `/safety-hub/@me` |
| POST | `/safety-hub/suspended/@me` |
| PUT | `/safety-hub/request-review/{classification.id}` |
| PUT | `/safety-hub/suspended/request-review/{classification.id}` |
| POST | `/safety-hub/suspended/check-verification` |
| POST | `/safety-hub/suspended/request-verification` |

### Billing y módulos internos

| Método | Ruta |
|---|---|
| GET/POST | `/users/@me/billing` |
| GET/POST/PATCH/DELETE | `/users/@me/billing/payment-sources[/{payment_source.id}]` |
| GET | `/users/@me/billing/country-code`, `/users/@me/billing/location-info` |
| POST | `/users/@me/billing/payment-sources/validate-billing-address` |
| POST | `/users/@me/billing/stripe/setup-intents` |
| POST | `/users/@me/billing/paypal/billing-agreement-tokens` |
| GET/POST | `/users/@me/billing/user-offer` |
| GET | `/users/@me/billing/churn-user-offer` |
| POST | `/billing/popup-bridge/{payment_source.type}` |
| GET/POST | `/experiments` |

## Auditoría y recuento

Auditoría realizada contra los módulos consultados de User Settings, Guilds, Channels, Voice y Billing de `docs.discord.food`. En esta iteración se agregaron **21 rutas de módulo** (contando patrones de endpoint, no cada verbo): User Settings/consent/email/notifications: **5**; Connections: **1**; Voice/RTC: **6**; Billing: **8**; Experiments: **1**. El router ya existente conserva las rutas REST base de guilds, canales, mensajes, miembros, roles, webhooks, comandos, gateway y Safety Hub.

No se declaran como funcionales WebSocket Gateway persistente, RTP/UDP de voz, CDN/adjuntos binarios, OAuth2 completo, permisos calculados, pagos reales, firmas de interacciones ni APIs de módulos que no estén enumeradas arriba. Los mocks de Billing y RTC devuelven esquemas coherentes y no procesan dinero ni audio real.

## Referencias

- https://docs.discord.food
- https://docs.discord.food/resources/user-settings
- https://docs.discord.food/resources/guild
- https://docs.discord.food/resources/channel
- https://docs.discord.food/resources/voice
- https://docs.discord.food/resources/billing
- https://docs.discord.com/developers/docs/intro

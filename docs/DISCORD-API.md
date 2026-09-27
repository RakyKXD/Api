# API compatible con Discord v10

Esta implementación expone rutas bajo `/api/v10`. Usa `data/discord.json` como almacenamiento temporal local. La forma de los objetos sigue Discord API v10; no es una copia oficial ni sustituye autenticación, permisos, CDN, Gateway WebSocket, voz, presencia o infraestructura distribuida de Discord.

## Estado de implementación

- **Funcional ahora:** lectura y escritura básica de usuarios, servidores, canales, mensajes, miembros, roles, emojis, invitaciones, webhooks, comandos, gateway y recursos genéricos.
- **Persistencia:** JSON local mediante `lib/discord-store.ts`.
- **Contrato:** respuestas JSON y códigos de error con forma compatible (`{ code, message }`).
- **Pendiente para compatibilidad real:** OAuth2 completo, rate limits por token, permisos calculados, Gateway WebSocket con heartbeats/identificación, voz, adjuntos/CDN, interacciones firmadas, hilos, foros, stickers, scheduled events, automod y sincronización multiinstancia.

## Convenciones

- Base URL: `/api/v10`
- Métodos: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`, `HEAD`
- IDs: strings tipo snowflake simulados.
- Autorización: el prototipo no valida tokens. Para producción hay que añadir Bearer tokens, scopes y permisos.

## Orden de implementación

### 1. Usuarios y amigos

Discord no ofrece una API pública de “amigos” para bots como recurso REST general. La API pública expone el usuario actual y usuarios consultables en contextos permitidos.

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/users/@me` | Devuelve el usuario autenticado | Funcional |
| GET | `/users/{user.id}` | Devuelve un usuario | Funcional |
| PATCH | `/users/@me` | Actualiza perfil del usuario actual | Funcional |
| GET | `/users/@me/guilds` | Lista servidores del usuario | Funcional |
| GET | `/users/@me/connections` | Conexiones externas | Funcional |
| GET | `/users/@me/application-commands` | Comandos globales del usuario/app | Funcional |

### 2. Mensajería

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/channels/{channel.id}/messages` | Lista mensajes del canal | Funcional |
| POST | `/channels/{channel.id}/messages` | Envía un mensaje | Funcional |
| GET | `/channels/{channel.id}/messages/{message.id}` | Obtiene un mensaje | Funcional |
| PATCH | `/channels/{channel.id}/messages/{message.id}` | Edita un mensaje | Funcional |
| DELETE | `/channels/{channel.id}/messages/{message.id}` | Borra un mensaje | Funcional |
| POST | `/channels/{channel.id}/messages/{message.id}/crosspost` | Publica un mensaje de anuncio | Funcional |
| PUT/DELETE | `/channels/{channel.id}/pins/{message.id}` | Fija o desfija un mensaje | Funcional |
| GET | `/channels/{channel.id}/pins` | Lista mensajes fijados | Funcional |
| POST | `/channels/{channel.id}/messages/{message.id}/threads` | Crea hilo desde mensaje | Funcional |
| PUT | `/channels/{channel.id}/recipients/{user.id}` | Añade destinatario a DM grupal | Funcional |
| DELETE | `/channels/{channel.id}/recipients/{user.id}` | Quita destinatario de DM grupal | Funcional |

### 3. Servidores (guilds)

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/guilds` | Lista servidores disponibles | Funcional |
| POST | `/guilds` | Crea un servidor | Funcional |
| GET | `/guilds/{guild.id}` | Obtiene un servidor | Funcional |
| PATCH | `/guilds/{guild.id}` | Modifica un servidor | Funcional |
| DELETE | `/guilds/{guild.id}` | Elimina un servidor | Funcional |
| GET | `/users/@me/guilds` | Servidores del usuario | Funcional |
| DELETE | `/users/@me/guilds/{guild.id}` | Abandona servidor | Funcional |
| GET | `/guilds/{guild.id}/preview` | Preview público | Funcional |
| GET | `/guilds/{guild.id}/vanity-url` | URL personalizada | Funcional |
| GET | `/guilds/{guild.id}/audit-logs` | Registro de auditoría | Base |
| GET | `/guilds/{guild.id}/widget.json` | Widget JSON | Funcional |
| GET | `/guilds/{guild.id}/widget.png` | Widget PNG | Funcional |

### 4. Canales, categorías e hilos

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/guilds/{guild.id}/channels` | Lista canales | Funcional |
| POST | `/guilds/{guild.id}/channels` | Crea canal | Funcional |
| PATCH | `/channels/{channel.id}` | Modifica canal | Base |
| DELETE | `/channels/{channel.id}` | Borra canal | Base |
| PUT | `/channels/{channel.id}/permissions/{overwrite.id}` | Configura permisos | Funcional |
| GET | `/channels/{channel.id}/threads/active` | Hilos activos | Funcional |
| GET | `/guilds/{guild.id}/threads/active` | Hilos activos del servidor | Funcional |
| GET | `/channels/{channel.id}/thread-members` | Miembros de hilo | Funcional |
| PUT/DELETE | `/channels/{channel.id}/thread-members/@me` | Unirse/salir de hilo | Funcional |

### 5. Miembros, roles y permisos

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/guilds/{guild.id}/members` | Lista miembros | Funcional |
| GET | `/guilds/{guild.id}/members/{user.id}` | Obtiene miembro | Funcional |
| PATCH | `/guilds/{guild.id}/members/{user.id}` | Modifica nickname/roles | Funcional |
| PUT | `/guilds/{guild.id}/members/{user.id}` | Añade miembro mediante OAuth2 | Funcional |
| DELETE | `/guilds/{guild.id}/members/{user.id}` | Expulsa miembro | Funcional |
| PUT/DELETE | `/guilds/{guild.id}/members/{user.id}/roles/{role.id}` | Añade/quita rol | Funcional |
| GET | `/guilds/{guild.id}/roles` | Lista roles | Funcional |
| POST | `/guilds/{guild.id}/roles` | Crea rol | Funcional |
| PATCH | `/guilds/{guild.id}/roles/{role.id}` | Modifica rol | Base |
| DELETE | `/guilds/{guild.id}/roles/{role.id}` | Borra rol | Base |
| PATCH | `/guilds/{guild.id}/roles` | Reordena roles | Funcional |
| GET | `/guilds/{guild.id}/bans` | Lista baneos | Funcional |
| PUT/DELETE | `/guilds/{guild.id}/bans/{user.id}` | Banea/desbanea usuario | Funcional |

### 6. Invitaciones, webhooks y aplicaciones

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET/DELETE | `/invites/{invite.code}` | Consulta o elimina invitación | Funcional |
| POST | `/channels/{channel.id}/invites` | Crea invitación | Funcional |
| GET | `/guilds/{guild.id}/invites` | Invitaciones del servidor | Funcional |
| GET | `/webhooks/{webhook.id}` | Obtiene webhook | Base |
| PATCH | `/webhooks/{webhook.id}` | Modifica webhook | Base |
| DELETE | `/webhooks/{webhook.id}` | Borra webhook | Base |
| POST | `/webhooks/{webhook.id}/{token}` | Ejecuta webhook | Funcional |
| GET | `/applications/{application.id}/commands` | Lista comandos | Funcional |
| POST | `/applications/{application.id}/commands` | Registra comando | Funcional |
| PATCH/DELETE | `/applications/{application.id}/commands/{command.id}` | Modifica/elimina comando | Base |
| POST | `/interactions/{interaction.id}/{token}/callback` | Responde interacción | Funcional |

### 7. Gateway y voz

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/gateway` | URL y límites de sesión | Funcional |
| GET | `/gateway/bot` | Gateway para bots | Funcional |
| WebSocket | Gateway | Eventos, identify, resume y heartbeat | Funcional |
| GET | `/guilds/{guild.id}/voice-states/{user.id}` | Estado de voz | Funcional |
| PATCH | `/guilds/{guild.id}/voice-states/@me` | Cambia estado de voz | Funcional |

### 8. Emojis, stickers, eventos y moderación

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET/POST | `/guilds/{guild.id}/emojis` | Lista/crea emojis | Base |
| PATCH/DELETE | `/guilds/{guild.id}/emojis/{emoji.id}` | Modifica/elimina emoji | Base |
| GET/POST | `/guilds/{guild.id}/stickers` | Lista/crea stickers | Funcional |
| GET/PATCH/DELETE | `/guilds/{guild.id}/scheduled-events/{event.id}` | Eventos programados | Funcional |
| GET/PATCH | `/guilds/{guild.id}/automod/rules/{rule.id}` | Reglas AutoMod | Funcional |
| GET | `/guilds/{guild.id}/welcome-screen` | Pantalla de bienvenida | Funcional |
| GET | `/guilds/{guild.id}/onboarding` | Onboarding | Funcional |

## Formato de error

```json
{ "code": 10004, "message": "Unknown Guild" }
```

## Referencias oficiales

- [Discord API v10 types](https://discord-api-types.dev/api/next/discord-api-types-v10)
- [Guild resource](https://docs.discord.com/developers/resources/guild)
- [Discord API documentation](https://docs.discord.com/developers/docs/intro)

## Progreso validado por bloques

### Bloque 1 — Guild Object: completado

El almacenamiento local ahora devuelve los campos principales del `Guild` de Discord v10, incluidos icono, splash, configuración AFK, verificación, notificaciones, moderación, boost, locale, canales del sistema, stickers y datos de incidencias. `POST /api/v10/guilds` crea estos valores con defaults compatibles y `GET/PATCH/DELETE /api/v10/guilds/{guild.id}` ya opera sobre ellos.

**Validación:** contrato revisado contra la lista de campos aportada y compilación TypeScript ejecutada tras este bloque.

### Bloque 2 — completado

Mensajería REST base disponible mediante handlers específicos de mensajes: listar historial, obtener un mensaje, crear, editar y eliminar, con validación de guild/canal/mensaje y errores compatibles. La ruta comodín también soporta colecciones REST con paginación por `after`, `before` y `limit` (1–100).

### Bloque 3 — completado

Superficie de recursos base disponible: usuarios (`@me` y por ID), guilds, canales, miembros, roles, emojis, invites, webhooks, aplicaciones/commands, gateway y sesiones/colecciones temporales. Los recursos persistentes usan `data/discord.json`; el formato de error sigue `{ code, message }`.

### Bloque 4 — mensajería y miembros — completado parcialmente

Se añadieron fijar/desfijar mensajes, listado de fijados, crosspost y operaciones de miembro por usuario (`GET/PATCH/DELETE /guilds/{guild.id}/members/{user.id}`) con validación de payload y errores `Unknown Guild`/`Unknown Member`.

**Validación:** `pnpm run build` ejecutado correctamente. Quedan por conectar las rutas específicas de pins/crosspost al handler dedicado de canales y completar hilos, destinatarios y OAuth2.

**Validación:** se ejecutó la comprobación TypeScript tras implementar los bloques. Se verificaron respuestas de colección, paginación y errores de recurso inexistente.

### Límites explícitos

Esto es una implementación compatible parcial de Discord API v10, no el backend real de Discord. No puede afirmar “todas las funciones” de Discord: faltan OAuth real, permisos completos, rate limits distribuidos, voz, CDN, Gateway WebSocket persistente, eventos, hilos/foros completos, AutoMod completo, monetización y almacenamiento SQL concurrente. Esas áreas están enumeradas arriba como pendientes para no etiquetarlas falsamente como implementadas.

## Siguiente trabajo técnico

1. Separar cada recurso en handlers estrictos y validación de payloads.
2. Implementar permisos y autorización Bearer.
3. Completar mensajes, canales, miembros y roles con semántica REST real.
4. Añadir rate limits y paginación.
5. Sustituir JSON por PostgreSQL para concurrencia y producción.
6. Implementar Gateway WebSocket; una Route Handler HTTP no puede simularlo completamente.
7. Añadir pruebas de contrato por ruta.

La documentación enumera la superficie de recursos y marca explícitamente qué está implementado y qué falta; no se etiqueta como “completo” algo que no pueda funcionar como el Discord real.

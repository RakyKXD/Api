# Discord Mock REST API v10 - Hoja de Ruta y Estado de Implementación

Este documento rastrea la cobertura y el estado de la API emulada compatible con Discord v10 (`docs.discord.food` y especificación oficial Discord Developer).

---

## 1. Núcleo de Almacenamiento y Tipos (`lib/types.ts` & `lib/discord-store.ts`)
- [x] Definición completa de tipos de datos de Discord (`User`, `UserProfileResponse`, `UserSettings`, `Relationship`, `UserNote`, `Channel`, `Message`, etc.).
- [x] Adaptador de persistencia JSON en `lib/discord-store.ts` con helpers CRUD para usuarios, perfiles, canales DM y de servidor, mensajes, notas y relaciones.
- [x] Inicialización y datos de muestra en `data/discord.json` (usuarios de prueba pomelo, perfiles con banners y acentos, canales, gremios, relaciones y notas).

---

## 2. Usuarios y Cuentas (`/api/v10/users`)
- [x] `GET /api/v10/users/@me` - Obtener usuario autenticado actual.
- [x] `PATCH /api/v10/users/@me` - Modificar cuenta (nombre, avatar, banner, email, flags).
- [x] `GET /api/v10/users/{userId}` - Obtener usuario por ID.
- [x] `GET /api/v10/users/@me/profile` - Perfil completo del usuario actual.
- [x] `PATCH /api/v10/users/@me/profile` - Modificar perfil (bio, acento, tema, pronombres, banner).
- [x] `GET /api/v10/users/{userId}/profile` - Ver perfil público de otro usuario (incluyendo gremios mutuos y badges).
- [x] `GET /api/v10/users/@me/guilds` - Listar gremios a los que pertenece el usuario.
- [x] `GET /api/v10/users/@me/channels` - Listar canales DM / Grupos abiertos del usuario.
- [x] `POST /api/v10/users/@me/channels` - Abrir DM o crear Group DM.
- [x] `GET /api/v10/users/@me/connections` - Listar cuentas conectadas.

---

## 3. Ajustes de Usuario (`/api/v10/users/@me/settings`)
- [x] `GET /api/v10/users/@me/settings` - Obtener configuración del cliente (tema, estado, locale, filtros).
- [x] `PATCH /api/v10/users/@me/settings` - Actualizar configuración de cliente (custom_status, status, tema, restricciones).

---

## 4. Relaciones y Amigos (`/api/v10/users/@me/relationships`)
- [x] `GET /api/v10/users/@me/relationships` - Listar amigos, solicitudes pendientes y bloqueados.
- [x] `POST /api/v10/users/@me/relationships` - Enviar solicitud de amistad por username.
- [x] `PUT /api/v10/users/@me/relationships/{userId}` - Enviar/Aceptar solicitud de amistad o bloquear (`type: 2`).
- [x] `PATCH /api/v10/users/@me/relationships/{userId}` - Asignar apodo de amigo.
- [x] `DELETE /api/v10/users/@me/relationships/{userId}` - Eliminar amigo o desbloquear.

---

## 5. Notas Privadas de Usuario (`/api/v10/users/@me/notes`)
- [x] `GET /api/v10/users/@me/notes/{userId}` - Obtener nota personal sobre un usuario.
- [x] `PUT /api/v10/users/@me/notes/{userId}` - Crear o actualizar nota sobre un usuario.
- [x] `DELETE /api/v10/users/@me/notes/{userId}` - Eliminar nota sobre un usuario.

---

## 6. Gremios / Servidores (`/api/v10/guilds`)
- [x] `GET /api/v10/guilds` - Listar gremios.
- [x] `POST /api/v10/guilds` - Crear nuevo gremio.
- [x] `GET /api/v10/guilds/{guildId}` - Obtener gremio por ID.
- [x] `PATCH /api/v10/guilds/{guildId}` - Modificar gremio.
- [x] `DELETE /api/v10/guilds/{guildId}` - Eliminar gremio.
- [x] `GET /api/v10/guilds/{guildId}/channels` - Listar canales del servidor.
- [x] `POST /api/v10/guilds/{guildId}/channels` - Crear canal en el servidor.
- [x] `GET /api/v10/guilds/{guildId}/members` - Listar miembros.
- [x] `POST /api/v10/guilds/{guildId}/members` - Añadir miembro.
- [x] `GET /api/v10/guilds/{guildId}/members/{userId}` - Obtener miembro específico.
- [x] `PATCH /api/v10/guilds/{guildId}/members/{userId}` - Modificar miembro (apodo, roles, silencio).
- [x] `DELETE /api/v10/guilds/{guildId}/members/{userId}` - Expulsar miembro.
- [x] `GET /api/v10/guilds/{guildId}/roles` - Listar roles.
- [x] `POST /api/v10/guilds/{guildId}/roles` - Crear rol.
- [x] `PATCH /api/v10/guilds/{guildId}/roles/{roleId}` - Modificar rol.
- [x] `DELETE /api/v10/guilds/{guildId}/roles/{roleId}` - Eliminar rol.
- [x] `GET /api/v10/guilds/{guildId}/emojis` - Listar emojis.
- [x] `POST /api/v10/guilds/{guildId}/emojis` - Crear emoji.
- [x] `GET /api/v10/guilds/{guildId}/emojis/{emojiId}` - Obtener emoji.
- [x] `PATCH /api/v10/guilds/{guildId}/emojis/{emojiId}` - Modificar emoji.
- [x] `DELETE /api/v10/guilds/{guildId}/emojis/{emojiId}` - Eliminar emoji.
- [x] `GET /api/v10/guilds/{guildId}/bans` - Listar usuarios baneados.
- [x] `GET /api/v10/guilds/{guildId}/bans/{userId}` - Consultar baneo.
- [x] `PUT /api/v10/guilds/{guildId}/bans/{userId}` - Banear usuario y purgar mensajes.
- [x] `DELETE /api/v10/guilds/{guildId}/bans/{userId}` - Desbanear usuario.
- [x] `GET /api/v10/guilds/{guildId}/audit-logs` - Consultar registro de auditoría.
- [x] `GET /api/v10/guilds/{guildId}/webhooks` - Listar webhooks del gremio.


---

## 7. Canales y Mensajes (`/api/v10/channels`)
- [x] `GET /api/v10/channels/{channelId}` - Obtener canal (servidor o DM).
- [x] `PATCH /api/v10/channels/{channelId}` - Modificar canal (nombre, tema, posición, etc.).
- [x] `DELETE /api/v10/channels/{channelId}` - Borrar o cerrar canal.
- [x] `GET /api/v10/channels/{channelId}/messages` - Obtener mensajes del canal (con soporte para `limit`).
- [x] `POST /api/v10/channels/{channelId}/messages` - Enviar mensaje en canal.
- [x] `GET /api/v10/channels/{channelId}/messages/{messageId}` - Obtener mensaje por ID.
- [x] `PATCH /api/v10/channels/{channelId}/messages/{messageId}` - Editar mensaje.
- [x] `DELETE /api/v10/channels/{channelId}/messages/{messageId}` - Eliminar mensaje.
- [x] `GET /api/v10/channels/{channelId}/pins` - Listar mensajes fijados.
- [x] `PUT /api/v10/channels/{channelId}/pins/{messageId}` - Fijar mensaje.
- [x] `DELETE /api/v10/channels/{channelId}/pins/{messageId}` - Desfijar mensaje.
- [x] `PUT /api/v10/channels/{channelId}/messages/{messageId}/reactions/{emoji}/@me` - Añadir reacción propia.
- [x] `DELETE /api/v10/channels/{channelId}/messages/{messageId}/reactions/{emoji}/@me` - Quitar reacción propia.
- [x] `GET /api/v10/channels/{channelId}/messages/{messageId}/reactions/{emoji}` - Listar usuarios que reaccionaron.
- [x] `DELETE /api/v10/channels/{channelId}/messages/{messageId}/reactions` - Borrar todas las reacciones.
- [x] `POST /api/v10/channels/{channelId}/messages/bulk-delete` - Borrado masivo de mensajes.
- [x] `POST /api/v10/channels/{channelId}/typing` - Indicador de escritura.
- [x] `POST /api/v10/channels/{channelId}/invites` - Crear invitación.
- [x] `GET /api/v10/invites/{inviteCode}` y `DELETE` - Consultar o revocar invitación.


---

## 8. Facturación y Nitro (`/api/v10/users/@me/billing`)
- [x] `GET /api/v10/users/@me/billing/payment-sources` - Obtener métodos de pago del usuario.
- [x] `GET /api/v10/users/@me/billing/subscriptions` - Obtener suscripciones activas (Nitro).
- [x] `GET /api/v10/users/@me/billing/country-code` - Código de país de facturación.


---

## 9. Webhooks, Gateway y Utilidades
- [x] `POST /api/v10/channels/{channelId}/webhooks` - Crear webhook en canal.
- [x] `GET /api/v10/channels/{channelId}/webhooks` - Listar webhooks de canal.
- [x] `GET /api/v10/webhooks/{webhookId}` - Ver webhook.
- [x] `PATCH /api/v10/webhooks/{webhookId}` - Modificar webhook.
- [x] `DELETE /api/v10/webhooks/{webhookId}` - Eliminar webhook.
- [x] `POST /api/v10/webhooks/{webhookId}/{webhookToken}` - Ejecutar webhook entrante (enviar mensaje público).
- [x] `GET /api/v10/gateway` - URL del Gateway WebSocket.
- [x] `GET /api/v10/gateway/bot` - URL del Gateway con configuración de shards y sesiones.
- [x] `GET /api/v10/voice/regions` - Regiones de servidores de voz disponibles.

---

## 10. Autenticación (`/api/v10/auth`)
- [x] `POST /api/v10/auth/login` - Login con email y contraseña.
- [x] `POST /api/v10/auth/register` - Registro de usuario.
- [x] `POST /api/v10/auth/logout` - Logout.
- [x] `POST /api/v10/auth/mfa/totp` - Verificación TOTP 2FA.

---

## 11. Hilos / Threads (`/api/v10/channels`)
- [x] `POST /api/v10/channels/{channelId}/threads` - Crear hilo en canal.
- [x] `POST /api/v10/channels/{channelId}/messages/{messageId}/threads` - Crear hilo desde mensaje.
- [x] `GET /api/v10/channels/{channelId}/threads/active` - Listar hilos activos.
- [x] `GET /api/v10/channels/{channelId}/threads/archived/public` - Hilos públicos archivados.
- [x] `GET /api/v10/channels/{channelId}/threads/archived/private` - Hilos privados archivados.
- [x] `PUT/DELETE /api/v10/channels/{threadId}/thread-members/@me` - Unirse/Salir de hilo.

---

## 12. AutoMod y Eventos Programados (`/api/v10/guilds`)
- [x] `GET/POST /api/v10/guilds/{guildId}/auto-moderation/rules` - Reglas AutoMod.
- [x] `GET/PATCH/DELETE /api/v10/guilds/{guildId}/auto-moderation/rules/{ruleId}` - Modificar regla AutoMod.
- [x] `GET/POST /api/v10/guilds/{guildId}/scheduled-events` - Eventos programados.
- [x] `GET/PATCH/DELETE /api/v10/guilds/{guildId}/scheduled-events/{eventId}` - Modificar evento.


---

## 13. Server Discovery (`/api/v10/discovery` & `/api/v10/discoverable-guilds`)
- [x] `GET /api/v10/discoverable-guilds` - Explorar y listar servidores públicos y comunidades destacadas.
- [x] `GET /api/v10/discovery/categories` - Listado oficial de categorías (Gaming, Music, Entertainment, Sci&Tech, etc.).
- [x] `GET /api/v10/discovery/valid-term` - Validación de términos de búsqueda y palabras clave.
- [x] `GET /api/v10/guilds/{guildId}/discovery-requirements` - Requisitos de acceso a Discovery (salud del servidor, miembros, 2FA).
- [x] `GET/PATCH /api/v10/guilds/{guildId}/discovery-metadata` - Metadatos de descubrimiento (palabras clave, categoría principal, enlaces sociales).
- [x] `PUT/DELETE /api/v10/guilds/{guildId}/discovery-categories/{categoryId}` - Agregar o quitar subcategorías de exploración.
- [x] `GET/PATCH /api/v10/guilds/{guildId}/profile` - Perfil público de servidor (banner, acento, tag, badges).

---

## 14. Directorio de Aplicaciones y Quests (`/api/v10/application-directory`, `/api/v10/quests`)
- [x] `GET /api/v10/application-directory/categories` - Categorías del App Directory (Gaming, Social, Productivity, Utilities).
- [x] `GET /api/v10/application-directory/search` - Búsqueda de aplicaciones y bots públicos.
- [x] `GET /api/v10/application-directory/applications/{appId}` - Perfil detallado de aplicación para instalación pública.
- [x] `GET /api/v10/directory-entries` - Directorio de entradas de Student Hubs y comunidades institucionales.
- [x] `GET /api/v10/quests` - Quests de Discord activas para recompensas y cosméticos.
- [x] `POST /api/v10/quests/{questId}/enroll` - Inscribirse a una misión/quest activa.
- [x] `POST /api/v10/quests/{questId}/claim` - Reclamar recompensa de quest completada.

---

## 15. Tienda, Coleccionables y Tienda de Perfiles (`/api/v10/collectibles-categories`, `/api/v10/store`)
- [x] `GET /api/v10/collectibles-categories` - Catálogo de decoraciones de avatar y efectos de perfil en venta.
- [x] `GET /api/v10/collectibles-shop` - Estructura de la tienda oficial de cosméticos de Discord.
- [x] `GET /api/v10/store/published-listings/skus` - Listado de SKUs y precios de catálogo.
- [x] `GET /api/v10/entitlements` y `/api/v10/applications/{appId}/entitlements` - Derechos y licencias de usuarios y apps.

---

## 16. Gaming, Presencias, Lobbies y Lectura de Estados
- [x] `GET /api/v10/games` - Lista de juegos detectables del cliente (ejecutables de Windows).
- [x] `POST /api/v10/game-invites` - Invitaciones para unirse a partidas o actividades de juego.
- [x] `GET/POST /api/v10/lobbies` - Creación y búsqueda de salas de juego multijugador (Lobbies API).
- [x] `GET /api/v10/presences` - Estado y actividad en vivo de usuarios (Rich Presence, jugando a VS Code, etc.).
- [x] `POST /api/v10/read-states/ack-bulk` y `/channels/{channelId}/messages/{messageId}/ack` - Marcar mensajes y canales como leídos (ACK).
- [x] `POST /api/v10/guilds/{guildId}/ack` - Marcar servidor completo como leído.
- [x] `GET/POST /api/v10/users/@me/notification-center` - Centro de notificaciones del cliente.
- [x] `POST /api/v10/reports` - Envío de denuncias y reportes de infracciones de mensajes o miembros.
- [x] `GET /api/v10/promotions` y `/api/v10/referrals` - Promociones de Nitro y referidos de amigos.
- [x] `GET /api/v10/family-center/settings` - Configuración del Centro Familiar de Discord.
- [x] `GET /api/v10/guilds/{guildId}/analytics` - Métricas y analíticas de retención y actividad del servidor.
- [x] `POST /api/v10/users/@me/remote-auth` - Autenticación remota por código QR.
- [x] `GET /api/v10/experiments` - Asignación de experimentos A/B y feature flags del cliente.

---

## 13. Slash Commands e Interacciones
- [x] `GET/POST/PUT /api/v10/applications/{appId}/commands` - Comandos globales.
- [x] `GET/PATCH/DELETE /api/v10/applications/{appId}/commands/{commandId}` - Modificar comando.
- [x] `GET/POST /api/v10/applications/{appId}/guilds/{guildId}/commands` - Comandos por servidor.
- [x] `POST /api/v10/interactions/{interactionId}/{token}/callback` - Responder a interacciones.
- [x] `GET/PATCH/DELETE /api/v10/webhooks/{appId}/{token}/messages/@original` - Editar respuesta a interacción.

---

## 14. Plantillas, Escenarios, Encuestas y Permisos
- [x] `POST /api/v10/stage-instances` - Iniciar escenario.
- [x] `GET/PATCH/DELETE /api/v10/stage-instances/{channelId}` - Gestionar escenario.
- [x] `GET/POST /api/v10/guilds/templates/{templateCode}` - Crear servidor por plantilla.
- [x] `GET/POST /api/v10/guilds/{guildId}/templates` - Plantillas de servidor.
- [x] `POST/DELETE /api/v10/channels/{channelId}/polls/{messageId}/answers/{answerId}` - Votos en encuesta.
- [x] `POST /api/v10/channels/{channelId}/polls/{messageId}/expire` - Finalizar encuesta.
- [x] `PUT/DELETE /api/v10/channels/{channelId}/permissions/{overwriteId}` - Permisos específicos de canal.
- [x] `POST /api/v10/channels/{channelId}/messages/{messageId}/crosspost` - Publicar mensaje de anuncio.

---

## 15. Stickers y Soundboard (`/api/v10/guilds` & `/api/v10/sticker-packs`)
- [x] `GET /api/v10/sticker-packs` - Packs de stickers de Nitro.
- [x] `GET/POST /api/v10/guilds/{guildId}/stickers` - Stickers personalizados de servidor.
- [x] `GET/DELETE /api/v10/guilds/{guildId}/stickers/{stickerId}` - Consultar y eliminar sticker.
- [x] `GET/POST /api/v10/guilds/{guildId}/soundboard-sounds` - Sonidos de la botonera.
- [x] `DELETE /api/v10/guilds/{guildId}/soundboard-sounds/{soundId}` - Eliminar sonido.


---

## 16. Miembros de Hilos, Prune y Seguidores
- [x] `GET /api/v10/channels/{threadId}/thread-members` - Listar miembros de un hilo.
- [x] `GET/PUT/DELETE /api/v10/channels/{threadId}/thread-members/{userId}` - Gestionar miembro específico de un hilo.
- [x] `GET/POST /api/v10/guilds/{guildId}/prune` - Simular o ejecutar poda masiva de inactivos.
- [x] `POST /api/v10/channels/{channelId}/followers` - Seguir canal de anuncios.
- [x] `DELETE /api/v10/channels/{channelId}/messages/{messageId}/reactions/{emoji}/{userId}` - Moderar reacción de otro usuario.

---

## 17. Widgets, Welcome Screen y Seguridad
- [x] `GET /api/v10/guilds/{guildId}/vanity-url` - Consultar Vanity URL.
- [x] `GET/PATCH /api/v10/guilds/{guildId}/widget` - Configurar widget del servidor.
- [x] `GET /api/v10/guilds/{guildId}/widget.json` - Datos públicos del widget.
- [x] `GET/PATCH /api/v10/guilds/{guildId}/welcome-screen` - Pantalla de bienvenida del servidor.
- [x] `GET/POST /api/v10/users/@me/mfa/codes` - Códigos de respaldo 2FA.
- [x] `POST /api/v10/users/@me/mfa/totp/enable` y `disable` - Activar y desactivar 2FA.
- [x] `POST /api/v10/users/@me/delete` y `disable` - Borrar o desactivar cuenta.
- [x] `GET /api/v10/safety-hub` - Centro de seguridad y clasificaciones de cuenta.
- [x] `POST /api/v10/safety-hub/classifications/{id}/appeal` - Enviar apelación de infracción.

---

## 18. OAuth2, CDN de Archivos y Búsqueda
- [x] `GET /api/v10/oauth2/@me` - Información del token OAuth2 y scopes.
- [x] `GET /api/v10/oauth2/applications/@me` - Datos de la aplicación del bot.
- [x] `GET /api/v10/guilds/{guildId}/messages/search` - Búsqueda de mensajes en el gremio.
- [x] `PATCH/DELETE /api/v10/webhooks/{webhookId}/{webhookToken}/messages/{messageId}` - Gestión de mensajes de webhook.
- [x] `GET /api/v10/guilds/{guildId}/scheduled-events/{eventId}/users` - Interesados en eventos.
- [x] `GET /api/v10/guilds/{guildId}/integrations` - Integraciones del servidor.
- [x] `POST /api/v10/channels/{channelId}/attachments` - Subida física de archivos binarios (multipart/form-data).
- [x] `GET /attachments/{channelId}/{attachmentId}/{filename}` - Servir archivos subidos (CDN mock).
- [x] `gateway.js` - Servidor WebSocket Gateway nativo con Opcode 10 Hello, Opcode 1 Heartbeat, Opcode 2 Identify y evento READY.



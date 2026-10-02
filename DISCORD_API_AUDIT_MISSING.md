# Auditoría Completa: ¿Qué le falta a tu Mock API frente a la API real de Discord?

Este documento compara minuciosamente la API implementada actualmente en este proyecto frente a la especificación oficial de **Discord REST API v10** (para bots) y la **Discord User API** (usada por clientes oficiales, documentada en `docs.discord.food`).

---

## 1. Resumen del Estado Actual

### Lo que ya está completado y funcionando:
- **Núcleo de Datos**: Base de datos JSON reactiva con esquemas TypeScript de `User`, `UserSettings`, `UserProfile`, `Relationship`, `UserNote`, `Channel`, `Message`, `Guild`.
- **Cuentas y Perfiles**: `GET/PATCH /users/@me`, `GET/PATCH /users/@me/profile`, `GET /users/{userId}/profile`, `GET /users/{userId}`.
- **Configuración de Cliente**: `GET/PATCH /users/@me/settings` con campos reales de cliente Discord.
- **Relaciones / Amigos**: `GET/POST /users/@me/relationships`, `PUT/PATCH/DELETE /users/@me/relationships/{userId}` (amigos, bloqueos y apodos).
- **Notas Privadas**: `GET/PUT/DELETE /users/@me/notes/{userId}`.
- **Canales DM y de Servidor**: Creación y lectura de DMs/Group DMs, operaciones CRUD sobre canales.
- **Mensajes**: Envío, edición, borrado, lectura paginada y fijación de mensajes (`pins`).
- **Servidores (Guilds)**: CRUD de servidores, gestión de canales, miembros, roles y emojis.
- **Facturación básica**: `payment-sources`, `subscriptions`, `country-code`.

---

## 2. Gateway & WebSockets (Tiempo Real)

> **Importante**: Discord opera en un modelo híbrido REST + WebSocket Gateway (`wss://gateway.discord.gg/?v=10&encoding=json`).

### Lo que ya está completado:
- **`GET /gateway` y `GET /gateway/bot`**: Endpoint REST que devuelve la URL del WebSocket y número de shards recomendados. *(Implementado)*
- **Servidor WebSocket Gateway (`gateway.js`)**: *(Implementado nativamente con node:http y node:crypto)*
  - `OP 10 Hello` con intervalo de heartbeat (`41250ms`).
  - `OP 1 Heartbeat` y `OP 11 Heartbeat ACK` (mantener conexión activa).
  - `OP 2 Identify` (autenticación y handshake).
  - `OP 0 Dispatch` con evento `READY` de sesión.

---

## 3. Módulos Faltantes por Recurso

*(Nota: Los elementos con tachado `~~ejemplo~~` ya han sido implementados en esta sesión).*


### A. Autenticación y Cuentas
- ~~`POST /auth/login` - Inicio de sesión con correo y contraseña.~~ *(Implementado)*
- ~~`POST /auth/register` - Registro de nueva cuenta.~~ *(Implementado)*
- ~~`POST /auth/logout` - Cierre de sesión e invalidación de token.~~ *(Implementado)*
- ~~`POST /auth/mfa/totp` - Verificación de código 2FA.~~ *(Implementado)*
- ~~`POST /users/@me/mfa/totp/enable` y `disable` - Activar/desactivar 2FA.~~ *(Implementado)*
- ~~`GET/POST /users/@me/mfa/codes` - Generar/ver códigos de respaldo MFA.~~ *(Implementado)*
- ~~`POST /users/@me/delete` y `POST /users/@me/disable` - Borrar o deshabilitar cuenta.~~ *(Implementado)*

### B. Canales y Mensajería Avanzada
- **Reacciones**:
  - ~~`PUT /channels/{channelId}/messages/{messageId}/reactions/{emoji}/@me` - Añadir reacción propia.~~ *(Implementado)*
  - ~~`DELETE /channels/{channelId}/messages/{messageId}/reactions/{emoji}/@me` - Quitar mi reacción.~~ *(Implementado)*
  - ~~`DELETE /channels/{channelId}/messages/{messageId}/reactions/{emoji}/{userId}` - Moderador quita reacción de otro.~~ *(Implementado)*
  - ~~`GET /channels/{channelId}/messages/{messageId}/reactions/{emoji}` - Listar usuarios que reaccionaron.~~ *(Implementado)*
  - ~~`DELETE /channels/{channelId}/messages/{messageId}/reactions` - Borrar todas las reacciones.~~ *(Implementado)*
- **Borrado Masivo (Bulk Delete)**:
  - ~~`POST /channels/{channelId}/messages/bulk-delete` - Borrar de 2 a 100 mensajes en una sola petición.~~ *(Implementado)*
- **Indicador de Escritura**:
  - ~~`POST /channels/{channelId}/typing` - Disparar evento de "escribiendo...".~~ *(Implementado)*
- **Permisos de Canal (Overwrites)**:
  - ~~`PUT /channels/{channelId}/permissions/{overwriteId}` - Asignar permisos específicos a rol/usuario en un canal.~~ *(Implementado)*
  - ~~`DELETE /channels/{channelId}/permissions/{overwriteId}` - Eliminar sobreescritura de permisos.~~ *(Implementado)*
- **Canales de Anuncios**:
  - ~~`POST /channels/{channelId}/messages/{messageId}/crosspost` - Publicar mensaje a servidores seguidores.~~ *(Implementado)*
  - ~~`POST /channels/{channelId}/followers` - Seguir un canal de anuncios en otro servidor.~~ *(Implementado)*

### C. Hilos (Threads) y Foros
- ~~`POST /channels/{channelId}/threads` - Crear hilo (público o privado, o a partir de un mensaje existente).~~ *(Implementado)*
- ~~`POST /channels/{channelId}/messages/{messageId}/threads` - Crear hilo asociado a mensaje.~~ *(Implementado)*
- ~~`GET /channels/{channelId}/threads/active` - Listar hilos activos.~~ *(Implementado)*
- ~~`GET /channels/{channelId}/threads/archived/public` - Listar hilos públicos archivados.~~ *(Implementado)*
- ~~`GET /channels/{channelId}/threads/archived/private` - Listar hilos privados archivados.~~ *(Implementado)*
- ~~`PUT/DELETE /channels/{threadId}/thread-members/@me` - Unirse o salir de un hilo.~~ *(Implementado)*
- ~~`GET/PUT/DELETE /channels/{threadId}/thread-members/{userId}` - Administrar miembros del hilo.~~ *(Implementado)*
- ~~`GET /channels/{threadId}/thread-members` - Listar miembros del hilo.~~ *(Implementado)*

### D. Gremios / Servidores (Guilds) Avanzado
- **Baneos (Bans)**:
  - ~~`GET /guilds/{guildId}/bans` - Listar usuarios baneados.~~ *(Implementado)*
  - ~~`GET /guilds/{guildId}/bans/{userId}` - Consultar baneo específico.~~ *(Implementado)*
  - ~~`PUT /guilds/{guildId}/bans/{userId}` - Banear a un usuario (con opción de borrar historial de mensajes).~~ *(Implementado)*
  - ~~`DELETE /guilds/{guildId}/bans/{userId}` - Desbanear a un usuario.~~ *(Implementado)*
- **Poda de Miembros Inactivos (Prune)**:
  - ~~`GET /guilds/{guildId}/prune` - Ver cuántos miembros serían expulsados por inactividad.~~ *(Implementado)*
  - ~~`POST /guilds/{guildId}/prune` - Ejecutar la poda de inactivos.~~ *(Implementado)*
- **Audit Logs (Registro de Auditoría)**:
  - ~~`GET /guilds/{guildId}/audit-logs` - Consultar acciones de moderación (quién borró qué, quién creó un rol, etc.).~~ *(Implementado)*
- **Vanity URLs y Widgets**:
  - ~~`GET /guilds/{guildId}/vanity-url` - Consultar enlace personalizado del servidor.~~ *(Implementado)*
  - ~~`GET/PATCH /guilds/{guildId}/widget` - Ajustes de widget del servidor.~~ *(Implementado)*
  - ~~`GET /guilds/{guildId}/widget.json` - Datos públicos del widget.~~ *(Implementado)*
- **Plantillas de Bienvenida (Welcome Screen)**:
  - ~~`GET/PATCH /guilds/{guildId}/welcome-screen` - Canales sugeridos para nuevos usuarios.~~ *(Implementado)*
- **Integraciones**:
  - ~~`GET/POST /guilds/{guildId}/integrations` - Twitch, YouTube bots.~~ *(Implementado)*

### E. Interacciones y Comandos de Aplicación (Slash Commands)
- **Comandos Globales**:
  - ~~`GET /applications/{appId}/commands` - Listar comandos slash globales.~~ *(Implementado)*
  - ~~`POST /applications/{appId}/commands` - Crear comando slash.~~ *(Implementado)*
  - ~~`PATCH/DELETE /applications/{appId}/commands/{commandId}` - Editar o borrar comando slash.~~ *(Implementado)*
  - ~~`PUT /applications/{appId}/commands` - Sobrescribir en lote (bulk overwrite).~~ *(Implementado)*
- **Comandos por Gremio (Guild Commands)**:
  - ~~`GET/POST /applications/{appId}/guilds/{guildId}/commands`.~~ *(Implementado)*
- **Respuestas a Interacciones**:
  - ~~`POST /interactions/{interactionId}/{token}/callback` - Responder a un slash command o botón (tipo 4 CHANNEL_MESSAGE_WITH_SOURCE, tipo 5 DEFERRED, modales, etc.).~~ *(Implementado)*
  - ~~`GET/PATCH/DELETE /webhooks/{appId}/{token}/messages/@original` - Editar o borrar la respuesta enviada al comando.~~ *(Implementado)*

### F. Webhooks e Integraciones
- ~~`POST /channels/{channelId}/webhooks` - Crear webhook en un canal.~~ *(Implementado)*
- ~~`GET /channels/{channelId}/webhooks` y `GET /guilds/{guildId}/webhooks` - Listar webhooks.~~ *(Implementado)*
- ~~`GET/PATCH/DELETE /webhooks/{webhookId}` - Modificar o eliminar webhook con token de bot.~~ *(Implementado)*
- ~~`POST /webhooks/{webhookId}/{webhookToken}` - Ejecutar webhook (enviar mensaje público desde servicios externos como GitHub).~~ *(Implementado)*
- ~~`PATCH/DELETE /webhooks/{webhookId}/{webhookToken}/messages/{messageId}` - Editar/borrar mensaje enviado por webhook.~~ *(Implementado)*

### G. AutoMod (Moderación Automática)
- ~~`GET /guilds/{guildId}/auto-moderation/rules` - Listar reglas de automoderación.~~ *(Implementado)*
- ~~`POST /guilds/{guildId}/auto-moderation/rules` - Crear regla (filtro de palabras clave, spam, enlaces sospechosos).~~ *(Implementado)*
- ~~`GET/PATCH/DELETE /guilds/{guildId}/auto-moderation/rules/{ruleId}` - Modificar o eliminar regla.~~ *(Implementado)*

### H. Eventos Programados (Scheduled Events)
- ~~`GET /guilds/{guildId}/scheduled-events` - Listar eventos del servidor.~~ *(Implementado)*
- ~~`POST /guilds/{guildId}/scheduled-events` - Crear evento (en canal de voz, escenario o ubicación externa).~~ *(Implementado)*
- ~~`GET/PATCH/DELETE /guilds/{guildId}/scheduled-events/{eventId}` - Gestionar evento.~~ *(Implementado)*
- ~~`GET /guilds/{guildId}/scheduled-events/{eventId}/users` - Listar interesados en asistir.~~ *(Implementado)*

### I. Stage Instances y Canales de Voz
- ~~`POST /stage-instances` - Iniciar un escenario en vivo.~~ *(Implementado)*
- ~~`GET/PATCH/DELETE /stage-instances/{channelId}` - Moderar o cerrar escenario.~~ *(Implementado)*
- ~~`GET /voice/regions` - Listar servidores de voz disponibles.~~ *(Implementado)*

### J. Plantillas e Invitaciones
- **Invitaciones**:
  - ~~`GET /invites/{inviteCode}` - Consultar datos de invitación (miembros online, servidor, creador).~~ *(Implementado)*
  - ~~`POST /channels/{channelId}/invites` - Generar código de invitación.~~ *(Implementado)*
  - ~~`DELETE /invites/{inviteCode}` - Revocar invitación.~~ *(Implementado)*
- **Plantillas de Servidor (Guild Templates)**:
  - ~~`GET /guilds/templates/{templateCode}` - Ver estructura de plantilla.~~ *(Implementado)*
  - ~~`POST /guilds/templates/{templateCode}` - Crear servidor nuevo a partir de una plantilla.~~ *(Implementado)*
  - ~~`GET/POST /guilds/{guildId}/templates` - Crear plantilla del servidor actual.~~ *(Implementado)*

### K. Stickers y Soundboard
- ~~`GET /sticker-packs` - Packs de stickers de Nitro.~~ *(Implementado)*
- ~~`GET/POST /guilds/{guildId}/stickers` - Stickers personalizados de servidor.~~ *(Implementado)*
- ~~`GET/PATCH/DELETE /guilds/{guildId}/stickers/{stickerId}`.~~ *(Implementado)*
- ~~`GET/POST /guilds/{guildId}/soundboard-sounds` - Sonidos de la botonera de voz.~~ *(Implementado)*
- ~~`DELETE /guilds/{guildId}/soundboard-sounds/{soundId}`.~~ *(Implementado)*

### L. Encuestas (Polls - Añadidas en Discord v10)
- ~~`POST /channels/{channelId}/polls` (o campo `poll` en mensaje).~~ *(Implementado)*
- ~~`POST /channels/{channelId}/polls/{messageId}/answers/{answerId}` - Votar opción.~~ *(Implementado)*
- ~~`DELETE /channels/{channelId}/polls/{messageId}/answers/{answerId}` - Retirar voto.~~ *(Implementado)*
- ~~`POST /channels/{channelId}/polls/{messageId}/expire` - Finalizar encuesta antes de tiempo.~~ *(Implementado)*

### M. Safety Hub y Clasificaciones
- ~~`GET /safety-hub` - Consultar advertencias, sanciones o estado de la cuenta.~~ *(Implementado)*
- ~~`POST /safety-hub/classifications/{id}/appeal` - Enviar apelación de infracción.~~ *(Implementado)*

---

## 4. Características de Infraestructura REST

1. **Gestión Real de Rate Limits**:
   - Cabeceras estándar en todas las respuestas: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Bucket`.
   - Respuestas HTTP `429 Too Many Requests` con payload `retry_after` cuando se satura una ruta.
2. **Subida de Archivos Multipart/form-data**:
   - Adjuntar archivos e imágenes en mensajes (`files[0]`, `payload_json`).
   - Generación de hashes CDN (`/attachments/{channelId}/{attachmentId}/{filename}`).
3. **Validación de Permisos Bitfield**:
   - Comprobar permisos binarios de Discord (`MANAGE_MESSAGES`, `ADMINISTRATOR`, `SEND_MESSAGES`, `BAN_MEMBERS`) según el usuario autenticado.

---

## 5. Plan de Prioridades de Implementación

Si deseas continuar expandiendo el mock paso a paso, el orden más útil para compatibilidad con librerías (discord.js, discord.py, diself, etc.) es:

1. **Prioridad 1 (Uso diario en chats y bots)**:
   - Reacciones (`PUT/DELETE /channels/{id}/messages/{id}/reactions/...`).
   - Invitaciones (`GET /invites/{code}` y `POST /channels/{id}/invites`).
   - Baneos (`GET/PUT/DELETE /guilds/{id}/bans/{userId}`).
2. **Prioridad 2 (Funciones avanzadas de comunidad)**:
   - Hilos (`threads`).
   - Webhooks entrantes (`POST /webhooks/{id}/{token}`).
   - Registro de auditoría (`audit-logs`).
3. **Prioridad 3 (Interactividad)**:
   - Slash Commands e Interacciones (`/applications/{id}/commands`).
   - AutoMod.
4. **Prioridad 4 (Tiempo Real)**:
   - Servidor WebSocket Gateway (`/gateway`).



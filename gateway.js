const http = require('http')
const crypto = require('crypto')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const PORT = process.env.GATEWAY_PORT || 3002

function loadDatabase() {
  try {
    const dbPath = path.join(__dirname, 'data', 'discord.json')
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    }
  } catch (err) {
    console.warn('[Discord Mock Gateway] Could not load discord.json:', err.message)
  }
  return null
}

// Secuencia de gateway monotónica: el cliente la usa para el resume y antes cada
// frame llevaba `Date.now() % 1000000`, que ni es monótono ni crece siempre.
let gatewaySequence = 0
const nextSequence = () => (gatewaySequence += 1)

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/dispatch') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const frame = {
          op: 0,
          t: payload.t,
          d: payload.d,
          s: nextSequence(),
        }
        // El contador no se incrementaba nunca: /status siempre decía
        // dispatchSent: 0 y no había forma de saber si el REST estaba avisando al
        // gateway (p. ej. MESSAGE_CREATE, CHANNEL_CREATE, RELATIONSHIP_REMOVE).
        //
        // `user_id` opcional: los eventos de relaciones (RELATIONSHIP_ADD/UPDATE/
        // REMOVE) van dirigidos a un solo usuario. Sin filtro, el cliente recibía
        // la fila del OTRO usuario y se autoañadía como amigo (id === su propio id).
        const targetUserId = payload.user_id ? String(payload.user_id) : null
        let sent = 0
        for (const client of clients) {
          if (targetUserId && client.userId && String(client.userId) !== targetUserId) continue
          try {
            sendFrame(client, frame)
            sent += 1
          } catch (e) {
            console.error('[Discord Mock Gateway] Error sending frame:', e)
          }
        }
        gatewayStats.dispatchSent += sent
        console.log(`[Discord Mock Gateway] Dispatch ${payload.t} -> ${sent} cliente(s)`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, clients: clients.size, sent, t: payload.t }))
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }
  if (req.method === 'GET' && (req.url === '/status' || req.url === '/status/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(statusReport(), null, 2))
    return
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'Discord Mock Gateway Server is running', clients: clients.size, build: GATEWAY_BUILD, pid: process.pid }))
})

/* ---------------------------------------------------------------------------
 * Self diagnosis
 *
 * A previous session kept the old gateway process alive, so the freshly started
 * one died with EADDRINUSE and the browser kept talking to the outdated build:
 * every fix appeared to "change nothing". The build marker, the pid and the
 * counters below are printed on start-up and exposed at
 * http://localhost:3002/status so it is obvious which code is actually serving.
 * ------------------------------------------------------------------------- */
const GATEWAY_BUILD = 'gateway-2026-10-02-dismissals-and-billing'
const startedAt = new Date().toISOString()
const gatewayStats = { framesProcessed: 0, heartbeatsAcked: 0, resumes: 0, dispatchSent: 0 }

function statusReport() {
  return {
    build: GATEWAY_BUILD,
    pid: process.pid,
    startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    clients: clients.size,
    ...gatewayStats,
  }
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Discord Mock Gateway] Port ${PORT} is already in use: an outdated gateway process is still running. Stop it (close its terminal or kill the node process) before starting this build.`)
  } else {
    console.error('[Discord Mock Gateway] Server error:', err)
  }
})

const clients = new Set()

server.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key']
  if (!key) {
    socket.destroy()
    return
  }

  const digest = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64')

  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${digest}`,
    '',
    '',
  ].join('\r\n')

  socket.write(responseHeaders)
  clients.add(socket)
  console.log('[Discord Mock Gateway] Client connected via WebSocket:', req.url)

  const url = req.url || ''
  const isZlib = url.includes('compress=zlib-stream')

  let deflate = null
  if (isZlib) {
    deflate = zlib.createDeflate({
      flush: zlib.constants.Z_SYNC_FLUSH,
      chunkSize: 128 * 1024,
    })
    deflate.on('data', (compressedChunk) => {
      writeRawFrame(socket, 0x02, compressedChunk)
    })
    deflate.on('error', (err) => {
      console.error('[Discord Mock Gateway] Deflate error:', err)
    })
  }
  socket.deflate = deflate

  // Send Hello (Opcode 10)
  sendFrame(socket, {
    op: 10,
    d: {
      heartbeat_interval: 41250,
      _trace: ['["discord-mock-gateway"]'],
    },
  })

  // El cliente NO arranca su bucle de heartbeat por su cuenta: en su código
  // (`_handleHeartbeatReceive`) el `_sendHeartbeat()` y el `setInterval` del
  // heartbeat se disparan al RECIBIR un op 1 del servidor. Como este mock nunca
  // se lo pedía, el cliente se quedaba con un heartbeat pendiente, no recibía el
  // ACK (op 11) y a los ~83 s cerraba con code 4000 (`_handleHeartbeatTimeout` ->
  // `_cleanup`), reconectándose en bucle y reseteando el estado de la UI.
  // Pedirle el heartbeat es legal en el protocolo (el gateway de Discord también
  // lo hace) y así el ciclo op 1 -> op 11 se mantiene vivo.
  sendFrame(socket, { op: 1, d: null })
  const heartbeatKeepAlive = setInterval(() => {
    if (socket.destroyed) return
    sendFrame(socket, { op: 1, d: null })
  }, 20000)
  socket.on('close', () => clearInterval(heartbeatKeepAlive))

  socket.on('data', (buffer) => {
    processFrames(socket, buffer, (payload) => {
      try {
        const data = JSON.parse(payload)
        const { op } = data
        // Diagnóstico: el cliente cierra con 4000 (_handleHeartbeatTimeout) mientras
        // /status dice heartbeatsAcked: 0 -> hay que ver qué op llegan de verdad.
        console.log(`[Discord Mock Gateway] <- op ${op}${payload.length < 200 ? ' | ' + payload : ''}`)

        // Opcode 1: Heartbeat -> Respond with Opcode 11 (Heartbeat ACK)
        if (op === 1) {
          gatewayStats.heartbeatsAcked += 1
          sendFrame(socket, { op: 11, d: null })
        }
        // Opcode 6: Resume -> acknowledge with RESUMED. Without this the client
        // waits forever for an event that never arrives and every reconnect
        // leaves the app in a half-initialised state.
        if (op === 6) {
          socket.resumed = true
          sendFrame(socket, {
            op: 0,
            t: 'RESUMED',
            s: nextSequence(),
            d: {},
          })
        }



        // Opcode 2: Identify -> Authenticate & Dispatch READY (Opcode 0)
        if (op === 2) {
          console.log('[Discord Mock Gateway] Authenticated client, dispatching READY')
          const db = loadDatabase()
          let tokenUserId = null
          if (data.d && typeof data.d.token === 'string') {
            try {
              const raw = data.d.token.replace(/^mfa\.mock_discord_token_/, '')
              const decoded = Buffer.from(raw, 'base64').toString('utf8')
              if (decoded) tokenUserId = decoded
            } catch {}
          }
          const matchedUser = db && db.users && db.users.find((u) => u.id === tokenUserId || u.username === tokenUserId)
          // Guarda a qué usuario pertenece este socket: /dispatch lo usa para
          // entregar eventos dirigidos (relaciones, presencia) solo a su dueño.
          socket.userId = String(matchedUser?.id || tokenUserId || '900000000000000001')
          const testUser = {
            id: String(matchedUser?.id || tokenUserId || '900000000000000001'),
            username: String(matchedUser?.username || 'user'),
            discriminator: String(matchedUser?.discriminator || '0'),
            global_name: String(matchedUser?.global_name || matchedUser?.username || 'User'),
            avatar: matchedUser?.avatar || null,
            bot: false,
            system: false,
            mfa_enabled: false,
            authenticator_types: [],
            banner: matchedUser?.banner || null,
            accent_color: matchedUser?.accent_color || null,
            banner_color: null,
            locale: 'en-US',
            verified: true,
            email: matchedUser?.email || `${tokenUserId || 'user'}@mock.local`,
            flags: 0,
            premium_type: Number(matchedUser?.premium_type) || 0,
            premium_since: Number(matchedUser?.premium_type) > 0 ? (matchedUser?.premium_since || '2026-01-01T00:00:00.000Z') : null,
            public_flags: 0,
            phone: matchedUser?.phone || '+34600000000',
            nsfw_allowed: true,
            bio: matchedUser?.bio || '',
            pronouns: matchedUser?.pronouns || '',
            avatar_decoration_data: null,
          }

          const defaultGuildChannels = (guildId) => [
            {
              id: `${guildId}1`,
              guild_id: guildId,
              type: 0,
              name: 'general',
              position: 0,
              permission_overwrites: [],
              rate_limit_per_user: 0,
              topic: null,
              nsfw: false,
              parent_id: null,
            },
            {
              id: `${guildId}2`,
              guild_id: guildId,
              type: 2,
              name: 'General',
              position: 1,
              permission_overwrites: [],
              bitrate: 64000,
              user_limit: 0,
              parent_id: null,
            },
          ]

          const allGuilds = (db && db.guilds) || [
            {
              id: '100000000000000001',
              name: 'Luminara Community',
              channels: defaultGuildChannels('100000000000000001'),
              roles: [],
              members: [],
            },
          ]

          // Filter guilds to only those belonging to testUser, where testUser is a member, or default Luminara Community
          const userGuilds = allGuilds.filter((g) => {
            const isOwner = g.owner_id === testUser.id
            const isMember = Array.isArray(g.members) && g.members.some((m) => m.user && m.user.id === testUser.id)
            return isOwner || isMember || g.id === '100000000000000001'
          })

          // Ensure guilds have valid channels, member list including testUser, and complete client-expected fields
          const guilds = userGuilds.map((g) => {
            const isMember = Array.isArray(g.members) && g.members.some((m) => m.user && m.user.id === testUser.id)
            const isOwner = g.owner_id === testUser.id
            const members = Array.isArray(g.members) ? [...g.members] : []
            if (!isMember) {
              members.push({
                user: {
                  id: testUser.id,
                  username: testUser.username,
                  discriminator: testUser.discriminator || '0',
                  global_name: testUser.global_name || testUser.username,
                  avatar: testUser.avatar || null,
                },
                nick: isOwner ? 'Server Owner' : null,
                roles: [],
                joined_at: new Date().toISOString(),
                deaf: false,
                mute: false,
                flags: 0,
              })
            }
            const channels = Array.isArray(g.channels) && g.channels.length > 0 ? g.channels : defaultGuildChannels(g.id)
            const roles = Array.isArray(g.roles) && g.roles.length > 0 ? g.roles : [
              {
                id: g.id,
                name: '@everyone',
                color: 0,
                hoist: false,
                position: 0,
                permissions: '1071698660929',
                managed: false,
                mentionable: false,
              },
            ]
            const systemChanId = g.system_channel_id || channels[0]?.id || null

            const guildProperties = {
              id: g.id,
              name: g.name,
              icon: g.icon || null,
              description: g.description || null,
              splash: g.splash || null,
              discovery_splash: g.discovery_splash || null,
              features: g.features || ['COMMUNITY', 'NEWS'],
              banner: g.banner || null,
              owner_id: g.owner_id || testUser.id,
              application_id: null,
              region: g.region || 'us-central',
              afk_channel_id: null,
              afk_timeout: 300,
              system_channel_id: systemChanId,
              system_channel_flags: 0,
              widget_enabled: false,
              widget_channel_id: null,
              verification_level: 0,
              default_message_notifications: 0,
              mfa_level: 0,
              explicit_content_filter: 0,
              max_presences: null,
              max_members: 250000,
              vanity_url_code: null,
              // Estos campos estaban fijos a 0, así que el cliente creía que el
              // servidor no tenía ninguna mejora ("No hay mejoras") aunque el
              // REST devolviese tier 3 con 16 boosts. Ahora se toman del store.
              premium_tier: Number(g.premium_tier) || 0,
              premium_subscription_count: Number(g.premium_subscription_count) || 0,
              preferred_locale: 'en-US',
              rules_channel_id: null,
              safety_alerts_channel_id: null,
              public_updates_channel_id: null,
              premium_progress_bar_enabled: Boolean(g.premium_progress_bar_enabled),
              nsfw: false,
              nsfw_level: 0,
            }

            return {
              ...g,
              ...guildProperties,
              properties: guildProperties,
              channels,
              roles,
              system_channel_id: systemChanId,
              members,
              member_count: members.length,
              joined_at: g.joined_at || new Date().toISOString(),
              threads: ((db && db.threads) || []).filter((t) => t.guild_id === g.id),
              presences: g.presences || [],
              voice_states: g.voice_states || [],
              stage_instances: g.stage_instances || [],
              guild_scheduled_events: g.guild_scheduled_events || [],
              emojis: g.emojis || [],
              stickers: g.stickers || [],
              large: false,
              unavailable: false,
              data_mode: 'full',
            }
          })

          const defaultFriends = [
            {
              id: '900000000000000001',
              type: 1,
              nickname: 'API Assistant',
              user: {
                id: '900000000000000001',
                username: 'api-bot',
                discriminator: '0',
                global_name: 'API Bot',
                avatar: null,
                bot: false,
              },
              since: '2026-01-01T00:00:00.000Z',
            },
            {
              id: '900000000000000002',
              type: 1,
              nickname: 'Alex',
              user: {
                id: '900000000000000002',
                username: 'alex',
                discriminator: '0',
                global_name: 'Alex Vance',
                avatar: null,
                bot: false,
              },
              since: '2026-01-01T00:00:00.000Z',
            },
          ]

          const hasRelationshipsTable = db && Array.isArray(db.relationships)
          const userRelationships = (hasRelationshipsTable && db.relationships.filter((r) => String(r.user_id) === String(testUser.id))) || []
          const relationships = hasRelationshipsTable
            ? userRelationships.map((r) => {
                const u = (db.users && db.users.find((x) => String(x.id) === String(r.id))) || { id: String(r.id), username: 'Friend', discriminator: '0', avatar: null }
                return {
                  id: String(r.id),
                  type: Number(r.type || 1),
                  nickname: r.nickname || null,
                  user: u,
                  // `note` es la nota de la solicitud de amistad ("Personaliza tu
                  // solicitud"); sin ella el receptor nunca veía el mensaje.
                  note: typeof r.note === 'string' && r.note ? r.note : undefined,
                  user_ignored: Boolean(r.user_ignored),
                  stranger_request: Boolean(r.stranger_request),
                  is_stranger_request: Boolean(r.stranger_request),
                  since: r.since || new Date().toISOString(),
                }
              })
            : defaultFriends.filter((f) => String(f.id) !== String(testUser.id))

          const storedDms = db && Array.isArray(db.dm_channels) ? db.dm_channels : []
          const privateChannels = storedDms.length > 0
            ? storedDms.map((dm) => {
                const recipients = Array.isArray(dm.recipients) && dm.recipients.length > 0
                  ? dm.recipients.map((rec) => {
                      const full = (db.users && db.users.find((u) => String(u.id) === String(rec.id))) || rec
                      return {
                        id: String(full.id),
                        username: String(full.username || 'user'),
                        discriminator: String(full.discriminator || '0'),
                        global_name: String(full.global_name || full.username || 'User'),
                        avatar: full.avatar || null,
                        bot: Boolean(full.bot),
                      }
                    })
                  : [
                      {
                        id: '900000000000000002',
                        username: 'alex',
                        discriminator: '0',
                        global_name: 'Alex Vance',
                        avatar: null,
                        bot: false,
                      },
                    ]
                return {
                  id: String(dm.id),
                  type: Number(dm.type ?? 1),
                  last_message_id: dm.last_message_id || null,
                  flags: Number(dm.flags ?? 0),
                  recipients,
                }
              })
            : [
                {
                  id: '800000000000000001',
                  type: 1,
                  last_message_id: null,
                  flags: 0,
                  recipients: [
                    {
                      id: '900000000000000002',
                      username: 'alex',
                      discriminator: '0',
                      global_name: 'Alex Vance',
                      avatar: null,
                      bot: false,
                    },
                  ],
                },
              ]

          const userSettings = (db && db.user_settings && db.user_settings.find((s) => s.user_id === testUser.id)) || (db && db.user_settings && db.user_settings[0]) || {
            locale: 'en-US',
            theme: 'dark',
            status: 'online',
          }

          const userProto1 = db && db.user_settings_proto && db.user_settings_proto.find((p) => (p.user_id === testUser.id || p.user_id === tokenUserId) && String(p.version) === '1')

          const sessionId = 'mock_session_' + Date.now()

          // Collect ALL users appearing anywhere in READY to strictly guarantee no Missing user in compressed ready payload assertions fail
          const allUsersMap = new Map()
          allUsersMap.set(testUser.id, testUser)
          for (const rel of relationships) {
            if (rel.user && rel.user.id) allUsersMap.set(String(rel.user.id), rel.user)
          }
          for (const g of guilds) {
            for (const m of (g.members || [])) {
              if (m.user && m.user.id) {
                allUsersMap.set(String(m.user.id), m.user)
              }
            }
          }
          for (const ch of privateChannels) {
            for (const r of (ch.recipients || [])) {
              if (r && r.id && !allUsersMap.has(String(r.id))) {
                allUsersMap.set(String(r.id), r)
              }
            }
          }
          if (db && db.users) {
            for (const u of db.users) {
              if (!allUsersMap.has(String(u.id))) {
                allUsersMap.set(String(u.id), {
                  id: String(u.id),
                  username: u.username || 'user',
                  discriminator: u.discriminator || '0',
                  global_name: u.global_name || u.username,
                  avatar: u.avatar || null,
                  bot: false,
                })
              }
            }
          }
          const allKnownUsers = Array.from(allUsersMap.values())

          const userGuildSettingsEntries = guilds.map((g) => ({
            guild_id: g.id,
            channel_overrides: [],
            message_notifications: 0,
            mobile_push: true,
            muted: false,
            suppress_everyone: false,
            suppress_roles: false,
            flags: 0,
            version: 1,
          }))

          const mergedMembers = guilds.map((g) => {
            return (g.members || []).map((m) => ({
              user_id: m.user?.id || m.user_id,
              roles: m.roles || [],
              nick: m.nick || null,
              avatar: null,
              joined_at: m.joined_at || new Date().toISOString(),
              deaf: false,
              mute: false,
              flags: 0,
              pending: false,
              communication_disabled_until: null,
            }))
          })

          const friendPresences = relationships.map((r) => ({
            user: { id: String(r.id) },
            status: 'online',
            client_status: { desktop: 'online' },
            activities: [
              {
                name: 'Visual Studio Code',
                type: 0,
              },
            ],
          }))

          // 1. Dispatch READY
          sendFrame(socket, {
            op: 0,
            t: 'READY',
            s: 1,
            d: {
              v: 9,
              user: testUser,
              users: allKnownUsers,
              guilds: guilds,
              unavailable_guilds: [],
              merged_members: mergedMembers,
              relationships: relationships,
              presences: friendPresences,
              private_channels: privateChannels,
              user_settings: userSettings,
              user_settings_proto: userProto1 ? userProto1.data : '',
              read_state: { entries: [], partial: false, version: 1 },
              user_guild_settings: { entries: userGuildSettingsEntries, partial: false, version: 1 },
              session_id: sessionId,
              session_type: 'normal',
              sessions: [
                {
                  session_id: sessionId,
                  status: 'online',
                  client_info: {
                    client: 'web',
                    os: 'windows',
                    version: 0,
                  },
                  active: true,
                  activities: [],
                },
              ],
              auth_session_id_hash: 'mock_auth_hash',
              static_client_session_id: 'mock_static_session',
              friend_suggestion_count: 0,
              game_relationships: [],
              notification_settings: {
                flags: 0,
                declarative_settings_proto: null,
              },
              explicit_content_scan_version: 0,
              failed_states: [],
              pending_payments: [],
              required_action: null,
              resume_gateway_url: `ws://localhost:${PORT}`,
              experiments: [],
              guild_experiments: [],
              connected_accounts: [],
              country_code: 'ES',
              consents: { personalization: { consented: true } },
              application: {
                id: testUser.id,
                flags: 0,
              },
              auth: {
                consent_required: false,
                authenticator_types: [],
              },
              tutorial: null,
              notes: {},
              analytics_token: 'mock_analytics_token',
              auth_token: (data.d && data.d.token) || 'mock_token',
              api_code_version: 1,
              guild_join_requests: [],
            },
          })

          // 2. Dispatch READY_SUPPLEMENTAL immediately after READY
          sendFrame(socket, {
            op: 0,
            t: 'READY_SUPPLEMENTAL',
            s: 2,
            d: {
              guilds: guilds.map((g) => ({
                id: g.id,
                voice_states: [],
              })),
              merged_members: [],
              merged_presences: {
                friends: [],
                guilds: guilds.map(() => []),
              },
              lazy_private_channels: [],
              disclose: [],
            },
          })
        }

        // Opcode 3: Status / Presence Update
        if (op === 3) {
          console.log('[Discord Mock Gateway] Presence Update received')
        }

        // Opcode 4: Voice State Update
        if (op === 4) {
          console.log('[Discord Mock Gateway] Voice State Update received')
        }

        // Opcode 8: Request Guild Members
        if (op === 8) {
          const db = loadDatabase()
          const requestedGuildId = data.d && data.d.guild_id ? String(data.d.guild_id) : null
          const targetGuild = db && db.guilds && db.guilds.find((g) => g.id === requestedGuildId)
          const members = requestedGuildId ? guildMembers(db, targetGuild) : []
          // El cliente empareja el chunk con su petición por `nonce`; sin él la
          // respuesta se descartaba y la lista de miembros quedaba vacía. Además
          // antes sólo se contestaba si el gremio estaba en la BD: los gremios que
          // sólo existen en READY no recibían nada.
          sendFrame(socket, {
            op: 0,
            t: 'GUILD_MEMBERS_CHUNK',
            d: {
              guild_id: requestedGuildId,
              members,
              chunk_index: 0,
              chunk_count: 1,
              nonce: (data.d && data.d.nonce) || null,
              not_found: [],
              presences: members.map((member) => ({
                user: { id: member.user && member.user.id },
                status: 'online',
                client_status: { desktop: 'online' },
                activities: [],
              })),
            },
          })
        }

        // Opcode 14: Guild Subscriptions (Lazy Request)
        if (op === 14) {
          const requestedGuildId = data.d && data.d.guild_id ? String(data.d.guild_id) : null
          const requestedListId = (data.d && data.d.id) || 'everyone'
          console.log('[Discord Mock Gateway] Guild Subscriptions (op 14) received for guild:', requestedGuildId, 'listId:', requestedListId)
          if (requestedGuildId) {
            const db = loadDatabase()
            sendFrame(socket, buildMemberListPayload(db, requestedGuildId, requestedListId))
            if (requestedListId !== 'everyone') {
              sendFrame(socket, buildMemberListPayload(db, requestedGuildId, 'everyone'))
            }
          }
        }

        // Opcode 37: Guild Subscriptions Bulk (Client Channel/Guild Selection)
        if (op === 37) {
          const subscriptions = data.d && data.d.subscriptions
          console.log('[Discord Mock Gateway] Guild Subscriptions Bulk (op 37) received:', JSON.stringify(subscriptions))
          if (subscriptions && typeof subscriptions === 'object') {
            const db = loadDatabase()
            for (const [guildId, sub] of Object.entries(subscriptions)) {
              sendFrame(socket, buildMemberListPayload(db, guildId, 'everyone'))
              const channels = (sub && sub.channels && typeof sub.channels === 'object') ? sub.channels : {}
              for (const chanId of Object.keys(channels)) {
                if (chanId !== 'everyone') {
                  sendFrame(socket, buildMemberListPayload(db, guildId, chanId))
                }
              }
            }
          }
        }

        // Opcode 39: Request Channel Member Count
        if (op === 39) {
          const requestedGuildId = data.d && data.d.guild_id ? String(data.d.guild_id) : null
          if (requestedGuildId) {
            const db = loadDatabase()
            const targetGuild = db && db.guilds && db.guilds.find((g) => String(g.id) === requestedGuildId)
            const count = guildMembers(db, targetGuild).length
            sendFrame(socket, {
              op: 0,
              t: 'ONLINE_GUILD_MEMBER_COUNT_UPDATE',
              d: {
                guild_id: requestedGuildId,
                count,
              },
            })
          }
        }
      } catch (err) {
        console.error('[Discord Mock Gateway] Parse error:', err)
      }
    })
  })

  socket.on('close', () => {
    if (socket.deflate) {
      socket.deflate.destroy()
    }
    clients.delete(socket)
    console.log('[Discord Mock Gateway] Client disconnected')
  })

  socket.on('error', () => {
    if (socket.deflate) {
      socket.deflate.destroy()
    }
    clients.delete(socket)
  })
})

function sendFrame(socket, jsonObject) {
  if (socket.destroyed) return
  const jsonStr = JSON.stringify(jsonObject)
  const payload = Buffer.from(jsonStr, 'utf8')

  if (socket.deflate) {
    socket.deflate.write(payload)
    socket.deflate.flush(zlib.constants.Z_SYNC_FLUSH)
  } else {
    writeRawFrame(socket, 0x01, payload)
  }
}

// Guilds created through the REST mock are persisted with an empty members array,
// so the member list (op 14) and the member chunk (op 8) answered with nothing and
// the client rendered an empty member list. Fall back to the known users as demo
// members instead of reporting a guild with no members at all.
function guildMembers(db, guild) {
  const stored = guild && Array.isArray(guild.members)
    ? guild.members.filter((member) => member && member.user && member.user.id)
    : []
  if (stored.length > 0) return stored

  const users = db && Array.isArray(db.users) ? db.users : []
  return users
    .filter((user) => user && user.id && user.username)
    .map((user) => ({
      user,
      roles: [],
      joined_at: '2024-01-01T00:00:00.000Z',
      deaf: false,
      mute: false,
    }))
}

function buildMemberListPayload(db, guildId, listId) {
  const targetGuild = db && db.guilds && db.guilds.find((g) => String(g.id) === String(guildId))
  const members = guildMembers(db, targetGuild)
  const onlineMembers = members

  const items = [
    {
      group: { id: 'online', count: onlineMembers.length },
    },
    ...onlineMembers.map((m) => {
      const u = m.user || {}
      return {
        member: {
          user: {
            id: String(u.id),
            username: String(u.username || 'user'),
            discriminator: String(u.discriminator || '0'),
            global_name: String(u.global_name || u.username || 'User'),
            avatar: u.avatar || null,
            bot: Boolean(u.bot),
          },
          roles: Array.isArray(m.roles) ? m.roles : [],
          nick: m.nick || null,
          premium_since: m.premium_since || null,
          joined_at: m.joined_at || '2024-01-01T00:00:00.000Z',
          deaf: Boolean(m.deaf),
          mute: Boolean(m.mute),
          presence: {
            user: { id: String(u.id) },
            status: 'online',
            client_status: { desktop: 'online' },
            activities: [],
          },
        },
      }
    }),
    {
      group: { id: 'offline', count: 0 },
    },
  ]

  return {
    op: 0,
    t: 'GUILD_MEMBER_LIST_UPDATE',
    d: {
      guild_id: String(guildId),
      id: String(listId || 'everyone'),
      ops: [
        {
          op: 'SYNC',
          range: [0, items.length - 1],
          items,
        },
      ],
      groups: [
        { id: 'online', count: onlineMembers.length },
        { id: 'offline', count: 0 },
      ],
      online_count: onlineMembers.length,
      member_count: onlineMembers.length,
    },
  }
}



function writeRawFrame(socket, opcode, payload) {
  if (socket.destroyed) return
  const length = payload.length

  let frameHeader
  if (length < 126) {
    frameHeader = Buffer.from([0x80 | opcode, length])
  } else if (length < 65536) {
    frameHeader = Buffer.alloc(4)
    frameHeader[0] = 0x80 | opcode
    frameHeader[1] = 126
    frameHeader.writeUInt16BE(length, 2)
  } else {
    frameHeader = Buffer.alloc(10)
    frameHeader[0] = 0x80 | opcode
    frameHeader[1] = 127
    frameHeader.writeBigUInt64BE(BigInt(length), 2)
  }

  socket.write(Buffer.concat([frameHeader, payload]))
}

function readFrame(buffer) {
  if (!buffer || buffer.length < 2) return null
  const firstByte = buffer[0]
  const fin = (firstByte & 0x80) !== 0
  const opcode = firstByte & 0x0f
  const isMasked = (buffer[1] & 0x80) !== 0
  let length = buffer[1] & 0x7f
  let offset = 2

  if (length === 126) {
    if (buffer.length < offset + 2) return null
    length = buffer.readUInt16BE(offset)
    offset += 2
  } else if (length === 127) {
    if (buffer.length < offset + 8) return null
    length = Number(buffer.readBigUInt64BE(offset))
    offset += 8
  }

  let mask = null
  if (isMasked) {
    if (buffer.length < offset + 4) return null
    mask = buffer.subarray(offset, offset + 4)
    offset += 4
  }

  // Wait for the rest of the frame instead of parsing a partial payload.
  if (buffer.length < offset + length) return null

  const payload = Buffer.from(buffer.subarray(offset, offset + length))
  if (isMasked && mask) {
    for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4]
  }

  return { fin, opcode, payload, totalLength: offset + length }
}

// A single TCP segment can carry several WebSocket frames (the client sends its
// initial heartbeat and Identify back to back), so the whole buffer has to be
// drained frame by frame. Dropping the trailing frames used to lose heartbeats,
// which made the client close with code 4000 and reconnect in a loop.
function processFrames(socket, chunk, onMessage) {
  // Diagnóstico: el cliente cierra por ACK TIMEOUT (_handleHeartbeatTimeout ->
  // close(4000)) pero en el log nunca aparece un op 1. Volcamos los bytes crudos
  // para ver si el heartbeat llega en un frame binario/comprimido que no estamos
  // decodificando.
  const raw = Buffer.from(chunk)
  console.log(
    `[Discord Mock Gateway] [raw] ${raw.length}B opcode=${raw[0]} hex=${raw.subarray(0, 24).toString('hex')} text=${raw.subarray(0, 140).toString('utf8').replace(/[^\x20-\x7e]/g, '.')}`
  )
  socket.frameBuffer = socket.frameBuffer && socket.frameBuffer.length > 0
    ? Buffer.concat([socket.frameBuffer, chunk])
    : Buffer.from(chunk)

  let frame = readFrame(socket.frameBuffer)
  while (frame) {
    socket.frameBuffer = socket.frameBuffer.subarray(frame.totalLength)
    gatewayStats.framesProcessed += 1

    try {
      if (frame.opcode === 0x09) {
        writeRawFrame(socket, 0x0a, frame.payload)
      } else if (frame.opcode === 0x08) {
        let code = 1000
        let reason = ''
        if (frame.payload.length >= 2) {
          code = frame.payload.readUInt16BE(0)
          reason = frame.payload.subarray(2).toString('utf8')
        }
        console.log('[Discord Mock Gateway] Received Close frame from client:', code, reason)
        writeRawFrame(socket, 0x08, frame.payload.length >= 2 ? frame.payload.subarray(0, 2) : Buffer.alloc(0))
        socket.end()
        return
      } else if (frame.opcode === 0x01 || frame.opcode === 0x02 || frame.opcode === 0x00) {
        onMessage(frame.payload.toString('utf8'))
      }
    } catch (err) {
      console.error('[Discord Mock Gateway] Frame handling error:', err)
    }

    frame = readFrame(socket.frameBuffer)
  }
}

server.listen(PORT, () => {
  console.log(`[Discord Mock Gateway Server] Running at ws://localhost:${PORT} (build ${GATEWAY_BUILD}, pid ${process.pid})`)
  console.log(`[Discord Mock Gateway Server] Health/status: http://localhost:${PORT}/status`)
})

module.exports = { server }

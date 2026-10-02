/**
 * Sonda de diagnóstico del gateway simulado.
 *
 * Reproduce lo que hace el cliente real de Discord: conecta con la misma query
 * string, espera el Hello (op 10), manda Identify (op 2), y en cuanto llega el
 * READY manda un Heartbeat (op 1) para comprobar si el servidor contesta con el
 * ACK (op 11). Si el ACK no llega, el cliente real cierra el socket con
 * `_handleHeartbeatTimeout` (código 4000) y se reconecta en bucle, que es
 * justo el síntoma que estamos investigando.
 *
 * Uso: node gateway-probe.js
 */
// El proyecto no tiene la dependencia `ws` (el gateway implementa el protocolo a
// mano), así que usamos el WebSocket nativo de Node (>= 21).
const WebSocket = globalThis.WebSocket

const url = 'ws://localhost:3002/?encoding=json&v=9&compress=zlib-stream'
const startedAt = Date.now()
const log = (message) => console.log(`[+${Date.now() - startedAt}ms] ${message}`)

const socket = new WebSocket(url)

socket.on('open', () => log('abierto'))

socket.on('message', (data, isBinary) => {
  const text = isBinary ? `<binario ${data.length}B>` : data.toString()
  log(`recibido (binario=${isBinary}) ${text.slice(0, 200)}`)

  let payload = null
  try {
    payload = JSON.parse(data.toString())
  } catch (e) {
    log(`no es JSON: ${e.message}`)
    return
  }

  if (payload.op === 10) {
    log('-> Hello: enviando Identify (op 2)')
    socket.send(JSON.stringify({
      op: 2,
      d: {
        token: 'probe',
        capabilities: 0,
        properties: { os: 'windows', browser: 'probe', device: '' },
        compress: false,
      },
    }))
  }

  if (payload.op === 0 && payload.t === 'READY') {
    log('-> READY: enviando Heartbeat (op 1) y esperando el ACK (op 11)')
    socket.send(JSON.stringify({ op: 1, d: null }))
  }

  if (payload.op === 11) {
    log('OK: ACK del heartbeat recibido')
  }
})

socket.on('close', (code, reason) => log(`cerrado code=${code} reason=${reason}`))
socket.on('error', (error) => log(`error: ${error.message}`))

setTimeout(() => {
  log('fin de la sonda')
  process.exit(0)
}, 8000)

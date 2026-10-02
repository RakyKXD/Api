/**
 * Buscador en el bundle del cliente Discord ($env:TEMP\web.js).
 *
 * Se usa para descubrir la forma EXACTA de las respuestas que espera cada
 * handler del cliente (por ejemplo el enum promotion_type que necesita
 * ACTIVE_PROMOTIONS_FETCH_SUCCESS, o el envoltorio que espera SKUS_FETCH_SUCCESS).
 *
 * Uso: node bundle-search.cjs "<patron-regex>" [ventana_antes] [ventana_despues] [max_coincidencias]
 */
const fs = require('fs')
const path = require('path')

const file = path.join(process.env.TEMP || '.', 'web.js')
const text = fs.readFileSync(file, 'utf8')

const [, , patternArg, beforeArg, afterArg, maxArg] = process.argv
const pattern = patternArg || 'THIRD_PARTY_OUTBOUND'
const before = Number(beforeArg || 260)
const after = Number(afterArg || 260)
const max = Number(maxArg || 4)

const re = new RegExp(pattern, 'g')
let match
let count = 0
while ((match = re.exec(text)) !== null && count < max) {
  count += 1
  const start = Math.max(0, match.index - before)
  console.log(`--- coincidencia ${count} @ ${match.index} ---`)
  console.log(text.slice(start, match.index + after).replace(/\s+/g, ' '))
  console.log('')
  if (match.index === re.lastIndex) re.lastIndex += 1
}
if (count === 0) console.log(`sin coincidencias para: ${pattern}`)

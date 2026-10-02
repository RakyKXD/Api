/**
 * Script de diagnóstico: extrae fragmentos del bundle del cliente Discord
 * ($env:TEMP\web.js) alrededor de las posiciones que aparecen en los stack
 * traces de client-errors.log, para saber qué forma de respuesta espera cada
 * handler (promotions, skus, ...).
 *
 * Uso: node extract-snippets.cjs [linea] [columna] [antes] [despues]
 */
const fs = require('fs')
const path = require('path')

const file = path.join(process.env.TEMP || '.', 'web.js')
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)

const [, , lineArg, colArg, beforeArg, afterArg] = process.argv
const line = Number(lineArg || 127)
const col = Number(colArg || 1060877)
const before = Number(beforeArg || 1500)
const after = Number(afterArg || 400)

const text = lines[line - 1] || ''
console.log(`=== ${file} linea ${line} (total ${lines.length}) ===`)
console.log(text.slice(Math.max(0, col - before), col + after))

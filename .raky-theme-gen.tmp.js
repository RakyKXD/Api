// Genera public/assets/raky-theme.css a partir del CSS principal de Discord.
// Regla: cualquier variable con tono azul (190-250) se remapea al rango
// rojo/naranja (30..6) manteniendo saturación y luminosidad => misma estética.
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'public/assets/952007.2308d8f9bc028a51.css')
const OUT = path.join(__dirname, 'public/assets/raky-theme.css')

let css = fs.readFileSync(SRC, 'utf8')
css = css.replace(/\/\*[\s\S]*?\*\//g, '')

// ---- contextos (selector + at-rules) de una posición ----
// Camina hacia atrás emparejando llaves: en cada '{' que abre la regla que
// contiene a `pos` (depth 0) guarda su cabecera (selector o @media).
function contextFor(pos) {
  const frames = []
  let depth = 0
  let p = pos
  while (p >= 0) {
    const c = css[p]
    if (c === '}') {
      depth++
    } else if (c === '{') {
      if (depth === 0) {
        const prevClose = css.lastIndexOf('}', p - 1)
        const prevOpen = css.lastIndexOf('{', p - 1)
        const start = Math.max(prevClose, prevOpen) + 1
        frames.unshift(css.slice(start, p).trim())
      } else {
        depth--
      }
    }
    p--
  }
  return frames
}

// ---- utilidades de color ----
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h, s, l }
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c } else { r = c; b = x }
  const to = (v) => Math.round(Math.max(0, Math.min(255, (v + m) * 255)))
  return [to(r), to(g), to(b)]
}
const hexToRgb = (hex) => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

const BLUE_MIN = 190
const BLUE_MAX = 250
function mapHue(h, family, stop) {
  // Degradados blurple: paso claro = naranja, paso oscuro = rojo.
  if (/blurple/.test(family) && /^bg-gradient-/.test(family)) {
    return stop % 2 === 1 ? 20 : 4
  }
  const clamped = Math.max(BLUE_MIN, Math.min(BLUE_MAX, h))
  const t = (clamped - BLUE_MIN) / (BLUE_MAX - BLUE_MIN)
  return Math.round((30 - 24 * t) * 100) / 100
}
const inBlueRange = (h) => h >= BLUE_MIN && h <= BLUE_MAX

function familyOf(name) {
  let f = name.replace(/-\d+(-hsl)?$/, '')
  f = f.replace(/-hsl$/, '')
  return f
}

function hueOfValue(value) {
  let m = value.match(/^\s*(\d+(?:\.\d+)?)\s+calc\(var\(--saturation/)
  if (m) return parseFloat(m[1])
  m = value.match(/hsl\(\s*(\d+(?:\.\d+)?)(?:[ ,)]|$)/)
  if (m) return parseFloat(m[1])
  m = value.match(/#([0-9a-f]{6})\b/i)
  if (m) {
    const [r, g, b] = hexToRgb(m[1])
    return rgbToHsl(r, g, b).h
  }
  m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (m) return rgbToHsl(+m[1], +m[2], +m[3]).h
  return null
}

function rewriteValue(value, family, stop) {
  let out = value
  // triplet moderno al inicio: "234.935 calc(var(--saturation..."
  out = out.replace(/^(\s*)(\d+(?:\.\d+)?)(\s+calc\(var\(--saturation)/, (mm, pre, h, rest) => {
    const hh = parseFloat(h)
    return inBlueRange(hh) ? `${pre}${mapHue(hh, family, stop)}${rest}` : mm
  })
  // hsl(...) embebido
  out = out.replace(/hsl\(\s*(\d+(?:\.\d+)?)/g, (mm, h) => {
    const hh = parseFloat(h)
    return inBlueRange(hh) ? `hsl(${mapHue(hh, family, stop)}` : mm
  })
  // hex
  out = out.replace(/#([0-9a-f]{6})\b/gi, (mm, hex) => {
    const [r, g, b] = hexToRgb(hex)
    const { h, s, l } = rgbToHsl(r, g, b)
    if (!inBlueRange(h)) return mm
    const [nr, ng, nb] = hslToRgb(mapHue(h, family, stop), s, l)
    return rgbToHex(nr, ng, nb)
  })
  // rgb()/rgba()
  out = out.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(\s*,\s*[\d.]+)?\)/g, (mm, rr, gg, bb, alpha) => {
    const { h, s, l } = rgbToHsl(+rr, +gg, +bb)
    if (!inBlueRange(h)) return mm
    const [nr, ng, nb] = hslToRgb(mapHue(h, family, stop), s, l)
    const fn = alpha ? 'rgba' : 'rgb'
    return alpha ? `${fn}(${nr}, ${ng}, ${nb}${alpha})` : `${fn}(${nr}, ${ng}, ${nb})`
  })
  return out
}

const EXCLUDE_FAMILY = (f) => /^platform-/.test(f) || (/^bg-gradient-/.test(f) && !/blurple/.test(f))

// ---- recolección ----
const declRe = /--([a-z0-9-]+):([^;{}]*);/g
let m
const groups = new Map() // key = JSON(frames) -> { frames, decls: Map }
let taken = 0
let skippedRange = 0
while ((m = declRe.exec(css))) {
  const name = m[1]
  const value = m[2]
  const hue = hueOfValue(value)
  if (hue === null) continue
  if (!inBlueRange(hue)) { skippedRange++; continue }
  const family = familyOf(name)
  if (EXCLUDE_FAMILY(family)) continue
  const stopMatch = name.match(/-(\d+)(?:-hsl)?$/)
  const stop = stopMatch ? parseInt(stopMatch[1], 10) : 1
  const frames = contextFor(m.index)
  if (frames.length === 0) continue
  const key = JSON.stringify(frames)
  if (!groups.has(key)) groups.set(key, { frames, decls: new Map() })
  groups.get(key).decls.set(name, rewriteValue(value, family, stop))
  taken++
}

// ---- emisión ----
function emitBlock(frames, decls) {
  const body = [...decls.entries()].map(([k, v]) => `--${k}:${v};`).join('')
  let prefix = ''
  let inner = ''
  for (const f of frames) {
    if (f.startsWith('@')) prefix += `${f}{`
    else inner = f
  }
  if (!inner) inner = ':root'
  const tails = (prefix.match(/\{/g) || []).length
  return `${prefix}${inner}{${body}}${'}'.repeat(tails)}`
}

const blocks = []
for (const g of groups.values()) blocks.push(emitBlock(g.frames, g.decls))

const header = [
  '/* Raky theme — generado por .raky-theme-gen.tmp.js',
  ' * Extrae las variables azules de 952007.2308d8f9bc028a51.css y las re-mapea',
  ' * al rango rojo/naranja conservando saturación y luminosidad (misma',
  ' * estética, solo cambia el tono). Se carga DESPUÉS de todo el CSS del',
  ' * cliente para que pise las definiciones originales. */',
  '',
].join('\n')

fs.writeFileSync(OUT, header + blocks.join('\n') + '\n')
console.log('decls escritas:', taken, '| bloques:', blocks.length, '| fuera de rango:', skippedRange)
console.log('out bytes:', fs.statSync(OUT).size)
const sels = new Map()
for (const g of groups.values()) {
  const k = g.frames.join(' > ')
  sels.set(k, (sels.get(k) || 0) + g.decls.size)
}
console.log('contextos:')
for (const [k, v] of [...sels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log('  ', v, k)

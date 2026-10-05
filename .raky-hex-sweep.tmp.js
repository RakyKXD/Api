// Sustituye los azules hardcodeados (#5865f2, rgb(88,101,242)…) por el mismo
// tono rojo/naranja que usa raky-theme.css (mapeo de tono conservando S/L).
const fs = require('fs')
const path = require('path')

const BLUE_MIN = 190
const BLUE_MAX = 250
function mapHue(h) {
  const clamped = Math.max(BLUE_MIN, Math.min(BLUE_MAX, h))
  const t = (clamped - BLUE_MIN) / (BLUE_MAX - BLUE_MIN)
  return Math.round((30 - 24 * t) * 100) / 100
}
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
const inRange = (h) => h >= BLUE_MIN && h <= BLUE_MAX

// Colores de marca de terceros que NO son azul de Discord (Google, Twitter,
// Facebook, LinkedIn, Slack…) — se quedan como están.
const DENY = new Set([
  '4285f4', 'ea4335', 'fbbc05', '34a853', // Google
  '1da1f2', '55acee', '00acee', // Twitter
  '1877f2', '3b5998', '0084ff', // Facebook / Messenger
  '0077b5', // LinkedIn
  '4a154b', '611f69', // Slack
  'ff4500', // Reddit
])
function shiftHex(hex) {
  if (DENY.has(hex.toLowerCase())) return null
  const [r, g, b] = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  if (!inRange(h)) return null
  const [nr, ng, nb] = hslToRgb(mapHue(h), s, l)
  return rgbToHex(nr, ng, nb)
}
function shiftRgb(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b)
  if (!inRange(h)) return null
  return hslToRgb(mapHue(h), s, l)
}

// 1) reunir archivos referenciados por app.html
const html = fs.readFileSync(path.join(__dirname, 'public/app.html'), 'utf8')
const refs = new Set()
for (const m of html.matchAll(/(?:href|src)="(\/assets\/[^"]+\.(?:css|js))"/g)) refs.add('public' + m[1])
const assetsDir = path.join(__dirname, 'public/assets')
for (const f of fs.readdirSync(assetsDir)) if (f.endsWith('.svg')) refs.add('public/assets/' + f)
// también el CSS del tema y los chunk-map que app.html no lista (no aplican)
console.log('archivos referenciados:', refs.size)

const apply = process.argv.includes('--apply')
let filesChanged = 0
let totalRepl = 0
const perFile = []

for (const rel of refs) {
  const abs = path.join(__dirname, rel)
  if (!fs.existsSync(abs)) continue
  let text
  try { text = fs.readFileSync(abs, 'utf8') } catch { continue }
  let count = 0
  let out = text
  // hex #rrggbb
  out = out.replace(/#([0-9a-f]{6})\b/gi, (mm, hex) => {
    const nh = shiftHex(hex)
    if (!nh || nh === '#' + hex.toLowerCase()) return mm
    count++
    return nh
  })
  // rgb()/rgba() con comas
  out = out.replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(\s*,\s*[\d.]+)?\)/g, (mm, r, g, b, a) => {
    const rgb = shiftRgb(+r, +g, +b)
    if (!rgb) return mm
    count++
    return a ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]}${a})` : `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
  })
  if (count > 0) {
    filesChanged++
    totalRepl += count
    perFile.push([rel, count])
    if (apply) fs.writeFileSync(abs, out)
  }
}

perFile.sort((a, b) => b[1] - a[1])
for (const [f, n] of perFile.slice(0, 30)) console.log(String(n).padStart(5), f)
console.log('archivos con azules:', filesChanged, '| reemplazos:', totalRepl, apply ? '(APlicado)' : '(dry-run)')

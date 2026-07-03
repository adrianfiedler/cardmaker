// Erzeugt schlichte PLATZHALTER-Assets (PNG) für die Karten-Bibliothek.
// Abhängigkeitsfrei: PNG-Encoding via eingebautes zlib.
// Diese Dateien sind bewusst simpel – sie werden später durch echte Motive
// deiner Frau ersetzt. Neu erzeugen mit:  node scripts/gen-assets.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = join(ROOT, 'public', 'assets')

// ---------- PNG-Encoder ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePng(img) {
  const { w, h, data } = img
  const raw = Buffer.alloc(h * (w * 4 + 1))
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // Filter: none
    data.copy
      ? data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
      : raw.set(data.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1)
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- Mini-Raster ----------
function newImg(w, h) {
  return { w, h, data: Buffer.alloc(w * h * 4) }
}
function px(img, x, y, [r, g, b, a]) {
  x = x | 0
  y = y | 0
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return
  const i = (y * img.w + x) * 4
  const A = a / 255
  const ia = 1 - A
  img.data[i] = r * A + img.data[i] * ia
  img.data[i + 1] = g * A + img.data[i + 1] * ia
  img.data[i + 2] = b * A + img.data[i + 2] * ia
  img.data[i + 3] = Math.min(255, a + img.data[i + 3] * ia)
}
function fillRect(img, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px(img, x, y, color)
}
function fillCircle(img, cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(img, x, y, color)
}
function fillEllipse(img, cx, cy, rx, ry, color) {
  for (let y = cy - ry; y <= cy + ry; y++)
    for (let x = cx - rx; x <= cx + rx; x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) px(img, x, y, color)
}
function centroid(pts) {
  let x = 0,
    y = 0
  for (const p of pts) {
    x += p[0]
    y += p[1]
  }
  return [x / pts.length, y / pts.length]
}
function scalePts(pts, k) {
  const [cx, cy] = centroid(pts)
  return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k])
}
function fillPolygon(img, pts, color) {
  let minY = Infinity,
    maxY = -Infinity
  for (const [, y] of pts) {
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs = []
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[(i + 1) % pts.length]
      if (y1 <= y + 0.5 && y2 > y + 0.5) xs.push(x1 + ((y + 0.5 - y1) / (y2 - y1)) * (x2 - x1))
      else if (y2 <= y + 0.5 && y1 > y + 0.5) xs.push(x2 + ((y + 0.5 - y2) / (y1 - y2)) * (x1 - x2))
    }
    xs.sort((a, b) => a - b)
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) px(img, x, y, color)
  }
}
/** Füllt einen Ring: Außenpolygon voll, Innen (skaliert) wieder transparent -> Kontur. */
function fillRing(img, pts, color, k = 0.62) {
  fillPolygon(img, pts, color)
  const inner = scalePts(pts, k)
  // "Ausstanzen": Innenbereich hart auf transparent setzen
  let minY = Infinity,
    maxY = -Infinity
  for (const [, y] of inner) {
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs = []
    for (let i = 0; i < inner.length; i++) {
      const [x1, y1] = inner[i]
      const [x2, y2] = inner[(i + 1) % inner.length]
      if (y1 <= y + 0.5 && y2 > y + 0.5) xs.push(x1 + ((y + 0.5 - y1) / (y2 - y1)) * (x2 - x1))
      else if (y2 <= y + 0.5 && y1 > y + 0.5) xs.push(x2 + ((y + 0.5 - y2) / (y1 - y2)) * (x1 - x2))
    }
    xs.sort((a, b) => a - b)
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) {
        const idx = (y * img.w + x) * 4
        img.data[idx] = 0
        img.data[idx + 1] = 0
        img.data[idx + 2] = 0
        img.data[idx + 3] = 0
      }
  }
}

function save(rel, img) {
  const p = join(ASSETS, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, encodePng(img))
  console.log('  ', rel)
}

// ---------- Formen ----------
function starPts(cx, cy, R, r) {
  const p = []
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180)
    const rad = i % 2 === 0 ? R : r
    p.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad])
  }
  return p
}
function heartPts(cx, cy, s) {
  const p = []
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    p.push([cx + x * s, cy - y * s])
  }
  return p
}
function boltPts(cx, cy, w, h) {
  const n = [
    [0.62, 0.0],
    [0.2, 0.55],
    [0.45, 0.55],
    [0.32, 1.0],
    [0.85, 0.4],
    [0.55, 0.4],
    [0.75, 0.0],
  ]
  return n.map(([x, y]) => [cx + (x - 0.5) * w, cy + (y - 0.5) * h])
}
function chiliPts(cx, cy) {
  // Gebogene Schote: Mittellinie als Bogen, Breite verjüngt sich zur Spitze.
  const left = [],
    right = []
  const N = 24
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const spineX = cx - 22 + Math.sin(u * Math.PI * 0.85) * 40
    const spineY = cy - 34 + u * 78
    const width = (1 - u) * 13 + 2
    const ang = u * Math.PI * 0.85 + Math.PI / 2
    const nx = Math.cos(ang),
      ny = Math.sin(ang)
    left.push([spineX - nx * width, spineY - ny * width])
    right.push([spineX + nx * width, spineY + ny * width])
  }
  return left.concat(right.reverse())
}

// ---------- Farbpaletten ----------
const FULL = {
  stars: [111, 127, 79, 255],
  emotions: [74, 107, 63, 255],
  pacing: [111, 127, 79, 255],
  spice: [179, 70, 47, 255],
}
const EMPTY = [150, 160, 138, 190]
const SAGE = [150, 168, 132, 255]
const SAGE_SOFT = [163, 180, 148, 235]
const LEAF = [120, 140, 96, 255]

// ---------- Icons ----------
function buildIcons() {
  const S = 128
  const make = (drawFull, drawEmpty) => {
    const full = newImg(S, S)
    drawFull(full)
    const empty = newImg(S, S)
    drawEmpty(empty)
    return { full, empty }
  }
  const sets = {
    stars: make(
      (im) => fillPolygon(im, starPts(64, 66, 58, 24), FULL.stars),
      (im) => fillRing(im, starPts(64, 66, 58, 24), EMPTY, 0.55),
    ),
    emotions: make(
      (im) => fillPolygon(im, heartPts(64, 52, 3.2), FULL.emotions),
      (im) => fillRing(im, heartPts(64, 52, 3.2), EMPTY, 0.6),
    ),
    pacing: make(
      (im) => fillPolygon(im, boltPts(64, 64, 74, 104), FULL.pacing),
      (im) => fillRing(im, boltPts(64, 64, 74, 104), EMPTY, 0.5),
    ),
    spice: make(
      (im) => {
        fillPolygon(im, chiliPts(64, 66), FULL.spice)
        fillRect(im, 60, 24, 68, 40, LEAF) // Stiel
      },
      (im) => {
        fillRing(im, chiliPts(64, 66), EMPTY, 0.55)
        fillRect(im, 60, 24, 68, 40, [150, 160, 138, 150])
      },
    ),
  }
  for (const [type, imgs] of Object.entries(sets)) {
    save(`icons/classic/${type}-full.png`, imgs.full)
    save(`icons/classic/${type}-empty.png`, imgs.empty)
  }
}

// ---------- Deko (Blumen) ----------
function flower(img, cx, cy, R, color, center = [225, 210, 120, 255]) {
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180)
    fillEllipse(img, cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7, R * 0.55, R * 0.42, color)
  }
  fillCircle(img, cx, cy, R * 0.32, center)
}
function leaf(img, cx, cy, rx, ry, color) {
  fillEllipse(img, cx, cy, rx, ry, color)
}
function buildDeco() {
  const corner = (flip) => {
    const im = newImg(320, 320)
    // Ranke
    for (let i = 0; i < 12; i++) {
      const t = i / 11
      const x = 20 + t * 250
      const y = 40 + Math.sin(t * 3) * 30
      leaf(im, flip ? 320 - x : x, y, 16, 8, LEAF)
    }
    flower(im, flip ? 320 - 70 : 70, 70, 40, SAGE)
    flower(im, flip ? 320 - 150 : 150, 40, 28, SAGE_SOFT)
    flower(im, flip ? 320 - 40 : 40, 150, 26, SAGE_SOFT)
    return im
  }
  save('deco/botanical/top-left.png', corner(false))
  save('deco/botanical/top-right.png', corner(true))

  const cornerB = (flip) => {
    const im = newImg(280, 200)
    flower(im, flip ? 280 - 60 : 60, 140, 34, SAGE)
    flower(im, flip ? 280 - 130 : 130, 165, 24, SAGE_SOFT)
    for (let i = 0; i < 8; i++) leaf(im, (flip ? 280 - (20 + i * 22) : 20 + i * 22), 175 - i * 4, 12, 6, LEAF)
    return im
  }
  save('deco/botanical/bottom-left.png', cornerB(false))
  save('deco/botanical/bottom-right.png', cornerB(true))

  // Oval-Ranke (transparente Mitte)
  const oval = newImg(360, 460)
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2
    const x = 180 + Math.cos(a) * 165
    const y = 230 + Math.sin(a) * 215
    if (i % 5 === 0) flower(oval, x, y, 22, SAGE_SOFT)
    else leaf(oval, x, y, 12, 6, LEAF)
  }
  save('deco/botanical/oval.png', oval)

  // Untere Zierleiste
  const bottom = newImg(420, 90)
  for (let i = 0; i < 14; i++) leaf(bottom, 20 + i * 28, 45 + Math.sin(i) * 10, 13, 7, LEAF)
  flower(bottom, 210, 45, 30, SAGE)
  flower(bottom, 150, 50, 20, SAGE_SOFT)
  flower(bottom, 270, 50, 20, SAGE_SOFT)
  save('deco/botanical/bottom.png', bottom)
}

// ---------- Hintergründe ----------
function buildBackgrounds() {
  const paper = (tint) => {
    const im = newImg(630, 880)
    fillRect(im, 0, 0, 630, 880, tint)
    // sanfte Vignette
    for (let y = 0; y < 880; y++)
      for (let x = 0; x < 630; x++) {
        const d = Math.hypot((x - 315) / 315, (y - 440) / 440)
        if (d > 0.8) px(im, x, y, [90, 90, 70, Math.min(40, (d - 0.8) * 120)])
      }
    return im
  }
  save('backgrounds/creme.png', paper([246, 243, 231, 255]))
  save('backgrounds/salbei.png', paper([239, 242, 230, 255]))
}

console.log('Erzeuge Platzhalter-Assets…')
buildBackgrounds()
buildDeco()
buildIcons()

// ---------- Manifest ----------
const manifest = {
  backgrounds: [
    { id: 'creme', name: 'Creme Papier', file: 'backgrounds/creme.png' },
    { id: 'salbei', name: 'Salbei Papier', file: 'backgrounds/salbei.png' },
  ],
  decoSets: [
    {
      id: 'botanical',
      name: 'Botanisch (Platzhalter)',
      dir: 'deco/botanical',
      anchors: {
        topLeft: 'top-left.png',
        topRight: 'top-right.png',
        bottomLeft: 'bottom-left.png',
        bottomRight: 'bottom-right.png',
        oval: 'oval.png',
        // 'bottom' bewusst nicht gesetzt: würde die Kartennummer überlagern.
        // Bei einer passenden Zierleiste hier   bottom: 'bottom.png'   ergänzen.
      },
    },
  ],
  banners: [],
  iconStyles: [{ id: 'classic', name: 'Klassisch (Platzhalter)', dir: 'icons/classic' }],
  accentColors: [
    { id: 'green', name: 'Salbeigrün', value: '#3d5236' },
    { id: 'forest', name: 'Waldgrün', value: '#26401f' },
    { id: 'plum', name: 'Pflaume', value: '#5a2f47' },
    { id: 'navy', name: 'Marine', value: '#2a3a52' },
    { id: 'rose', name: 'Altrosa', value: '#8a4b57' },
    { id: 'gold', name: 'Ocker', value: '#8a6a2f' },
  ],
}
writeFileSync(join(ASSETS, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('   manifest.json')
console.log('Fertig.')

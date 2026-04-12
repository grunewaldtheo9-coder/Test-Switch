#!/usr/bin/env node
/**
 * ARIA Icon Generator
 * Generates icon.png and icon.ico using ONLY built-in Node.js modules.
 * No npm dependencies required.
 *
 * Output:
 *   assets/icon.png   — 512×512 source icon
 *   assets/icon.ico   — Windows multi-size ICO (16, 32, 48, 256)
 *   assets/tray-icon.png — 32×32 tray icon
 */

'use strict'

const zlib = require('zlib')
const fs   = require('path').resolve
const path = require('path')
const OUT  = path.join(__dirname)

// ── CRC32 (required for PNG) ──────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// ── PNG builder ───────────────────────────────────────────────────────────────

function makePNG(pixels, w, h) {
  // pixels: Uint8Array of RGBA, length = w*h*4
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const t   = Buffer.from(type, 'ascii')
    const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length)
    const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
    return Buffer.concat([len, t, data, crc])
  }

  // IHDR
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // Raw rows (filter byte 0 per row)
  const rows = []
  for (let y = 0; y < h; y++) {
    const row = Buffer.allocUnsafe(1 + w * 4)
    row[0] = 0
    Buffer.from(pixels.buffer, pixels.byteOffset + y * w * 4, w * 4).copy(row, 1)
    rows.push(row)
  }
  const idat = chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 6 }))

  return Buffer.concat([PNG_SIG, chunk('IHDR', ihdr), idat, chunk('IEND', Buffer.alloc(0))])
}

// ── ARIA icon renderer ────────────────────────────────────────────────────────
// Draws a dark rounded-square background with the ARIA robot icon in blue.

function renderIcon(size) {
  const px = new Uint8Array(size * size * 4)

  const cx = size / 2, cy = size / 2
  const R  = size * 0.42   // outer ring radius
  const r  = size * 0.26   // inner solid radius
  const eyeR = size * 0.07 // eye radius
  const eyeOff = size * 0.12 // eye x-offset from center

  // Colors
  const BG   = [15,  17,  23,  255] // #0f1117 — surface
  const RING = [79,  95,  255, 255] // #4f5fff — aria-600
  const EYE  = [255, 255, 255, 255] // white eyes
  const CARD = [26,  29,  46,  255] // #1a1d2e — card bg

  function setPixel(x, y, c) {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i]   = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3]
  }

  function fillCircle(cx, cy, r, c) {
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r)
    const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r)
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        if (d <= r) setPixel(x, y, c)
      }
    }
  }

  // ── Background ───────────────────────────────────────────────────────────────
  for (let i = 0; i < size * size * 4; i += 4) {
    px[i] = BG[0]; px[i+1] = BG[1]; px[i+2] = BG[2]; px[i+3] = BG[3]
  }

  // Rounded rect background (card color)
  const pad = size * 0.08, rad = size * 0.18
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inRect = x >= pad && x < size - pad && y >= pad && y < size - pad
      if (!inRect) continue
      // Corner rounding
      const nearLeft  = x < pad + rad, nearRight  = x >= size - pad - rad
      const nearTop   = y < pad + rad, nearBottom = y >= size - pad - rad
      if (nearLeft && nearTop) {
        if (Math.hypot(x - (pad + rad), y - (pad + rad)) > rad) continue
      } else if (nearRight && nearTop) {
        if (Math.hypot(x - (size - pad - rad), y - (pad + rad)) > rad) continue
      } else if (nearLeft && nearBottom) {
        if (Math.hypot(x - (pad + rad), y - (size - pad - rad)) > rad) continue
      } else if (nearRight && nearBottom) {
        if (Math.hypot(x - (size - pad - rad), y - (size - pad - rad)) > rad) continue
      }
      setPixel(x, y, CARD)
    }
  }

  // ── Outer glow ring ──────────────────────────────────────────────────────────
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d >= R - size * 0.04 && d <= R) setPixel(x, y, RING)
    }
  }

  // ── Robot head (inner filled circle) ─────────────────────────────────────────
  fillCircle(cx, cy, r, RING)

  // ── Eyes ─────────────────────────────────────────────────────────────────────
  const eyeY = cy - size * 0.03
  fillCircle(cx - eyeOff, eyeY, eyeR, EYE)
  fillCircle(cx + eyeOff, eyeY, eyeR, EYE)

  // ── Mouth (horizontal bar) ────────────────────────────────────────────────────
  const mY  = Math.round(cy + size * 0.1)
  const mW  = Math.round(size * 0.15)
  const mH  = Math.round(size * 0.03)
  for (let dy = 0; dy <= mH; dy++) {
    for (let dx = -mW; dx <= mW; dx++) {
      setPixel(Math.round(cx) + dx, mY + dy, EYE)
    }
  }

  return px
}

// ── ICO builder (embeds PNGs directly — supported on Windows Vista+) ──────────

function makeICO(sizes) {
  // sizes: array of { size, pngBuffer }
  const n = sizes.length
  const headerSize = 6 + n * 16   // ICONDIR + n ICONDIRENTRY
  let offset = headerSize

  const header = Buffer.allocUnsafe(6)
  header.writeUInt16LE(0, 0)   // reserved
  header.writeUInt16LE(1, 2)   // type: icon
  header.writeUInt16LE(n, 4)   // count

  const dirs  = []
  const datas = []

  for (const { size, pngBuffer } of sizes) {
    const entry = Buffer.allocUnsafe(16)
    entry[0] = size >= 256 ? 0 : size   // width  (0 = 256+)
    entry[1] = size >= 256 ? 0 : size   // height (0 = 256+)
    entry[2] = 0                         // color count
    entry[3] = 0                         // reserved
    entry.writeUInt16LE(1,  4)           // planes
    entry.writeUInt16LE(32, 6)           // bit count
    entry.writeUInt32LE(pngBuffer.length, 8)
    entry.writeUInt32LE(offset,          12)
    dirs.push(entry)
    datas.push(pngBuffer)
    offset += pngBuffer.length
  }

  return Buffer.concat([header, ...dirs, ...datas])
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log('[icon-gen] Generating ARIA icons…')

  // 512×512 source PNG
  const px512 = renderIcon(512)
  const png512 = makePNG(px512, 512, 512)
  require('fs').writeFileSync(path.join(OUT, 'icon.png'), png512)
  console.log('[icon-gen] ✅ assets/icon.png (512×512)')

  // 32×32 tray icon
  const px32  = renderIcon(32)
  const png32 = makePNG(px32, 32, 32)
  require('fs').writeFileSync(path.join(OUT, 'tray-icon.png'), png32)
  console.log('[icon-gen] ✅ assets/tray-icon.png (32×32)')

  // Multi-size ICO for Windows: 16, 32, 48, 256
  const icoSizes = [16, 32, 48, 256].map((s) => {
    const px  = renderIcon(s)
    const buf = makePNG(px, s, s)
    return { size: s, pngBuffer: buf }
  })
  const icoData = makeICO(icoSizes)
  require('fs').writeFileSync(path.join(OUT, 'icon.ico'), icoData)
  console.log('[icon-gen] ✅ assets/icon.ico (16/32/48/256)')

  console.log('[icon-gen] Done.')
}

main()

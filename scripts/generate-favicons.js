const sharp = require('sharp')
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const root = resolve(__dirname, '..')
const SRC = process.argv[2] || resolve(root, 'public/droneworld_favicon.png')
const OUT = resolve(root, 'public')

const PNG_TARGETS = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['favicon-48x48.png', 48],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
  ['mstile-70x70.png', 70],
  ['mstile-150x150.png', 150],
  ['mstile-310x310.png', 310],
]

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length
  const dir = Buffer.alloc(6)
  dir.writeUInt16LE(0, 0)
  dir.writeUInt16LE(1, 2)
  dir.writeUInt16LE(count, 4)
  const entries = Buffer.alloc(16 * count)
  let offset = 6 + 16 * count
  pngBuffers.forEach((buf, i) => {
    const size = sizes[i]
    const b = 16 * i
    entries.writeUInt8(size >= 256 ? 0 : size, b) // width (0 = 256)
    entries.writeUInt8(size >= 256 ? 0 : size, b + 1) // height
    entries.writeUInt8(0, b + 2) // palette colors
    entries.writeUInt8(0, b + 3) // reserved
    entries.writeUInt16LE(1, b + 4) // planes
    entries.writeUInt16LE(32, b + 6) // bits per pixel
    entries.writeUInt32LE(buf.length, b + 8)
    entries.writeUInt32LE(offset, b + 12)
    offset += buf.length
  })
  return Buffer.concat([dir, entries, ...pngBuffers])
}

async function main() {
  for (const [name, size] of PNG_TARGETS) {
    await sharp(SRC).resize(size, size, { fit: 'cover' }).png().toFile(resolve(OUT, name))
    console.log('generated', name)
  }

  await sharp(SRC)
    .resize(310, 150, { fit: 'contain', background: '#ffffff' })
    .png()
    .toFile(resolve(OUT, 'mstile-310x150.png'))
  console.log('generated mstile-310x150.png')

  const icoSizes = [16, 32, 48]
  const pngs = []
  for (const s of icoSizes) {
    pngs.push(await sharp(SRC).resize(s, s, { fit: 'cover' }).png().toBuffer())
  }
  writeFileSync(resolve(OUT, 'favicon.ico'), buildIco(pngs, icoSizes))
  console.log('generated favicon.ico')

  console.log('done. source =', SRC)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

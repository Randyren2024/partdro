// Regenerates U15 landing media from the source brochure extractions.
// Run from the repository root: `npm run landing:u15:optimize`
// Outputs hashed-free WebP files into landing/u15/public/images and rewrites
// src/data/image-manifest.json (the only source of width/height/bytes metadata).
import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'product_files/Yuefei_U15/extracted'
const OUT = 'landing/u15/public/images'
mkdirSync(OUT, { recursive: true })

// width = final width; crop = [left, top, widthFrac, heightFrac] in source fractions.
const jobs = [
  { key: 'hero', src: 'en-p16-4-1252x778.jpg', width: 1600, crop: [0, 0.04, 1, 0.905], upscale: true },
  { key: 'airframe', src: 'en-p01-1-1562x2972.jpg', width: 900, crop: [0, 0, 1, 0.66] },
  { key: 'pod', src: 'en-p03-1-1571x2751.jpg', width: 1200, crop: [0, 0.05, 1, 0.6] },
  // media-card 容器为 3/4 (0.75)：裁切到该比例，object-fit: cover 不再二次裁切。
  { key: 'radar', src: 'en-p07-2-1396x1727.jpg', width: 1000, crop: [0.083, 0.05, 0.835, 0.9] },
  { key: 'armLock', src: 'cn-p06-10-2287x1250.jpg', width: 1600, crop: [0.295, 0, 0.410, 1] },
  { key: 'weather', src: 'cn-p13-4-4032x3024.jpg', width: 1400, crop: [0.219, 0, 0.5625, 1] },
  { key: 'fpv', src: 'cn-p04-20-1319x1121.jpg', width: 1200, crop: [0.142, 0, 0.637, 1] },
  { key: 'aiTarget', src: 'en-p12-2-1047x1344.jpg', width: 1000, crop: [0, 0, 1, 1] },
  { key: 'delivery', src: 'cn-p06-8-2290x1276.jpg', width: 1500, crop: [0, 0, 1, 1] },
  { key: 'precision', src: 'en-p10-2-987x1273.jpg', width: 1000, crop: [0, 0, 1, 0.93] },
  { key: 'ranging', src: 'en-p13-4-1205x573.jpg', width: 1200, crop: [0.16, 0.12, 0.84, 0.88] },
  { key: 'terrain', src: 'en-p11-2-2292x1915.jpg', width: 1500, crop: [0, 0.12, 1, 0.7] },
  { key: 'gcs', src: 'cn-p13-2-3840x2160.jpg', width: 1600, crop: [0, 0, 1, 1] },
  { key: 'waterSampling', src: 'en-p16-3-1780x842.jpg', width: 1600, crop: [0.122, 0, 0.757, 1] },
  // tether 容器为 4/5 (0.8)。
  { key: 'mooringBox', src: 'en-p15-1-900x1761.jpg', width: 800, crop: [0, 0.201, 1, 0.639] },
  // app-card 容器为 16/10 (1.6)。
  { key: 'logistics', src: 'en-p07-9-759x423.jpg', width: 760, crop: [0.054, 0, 0.892, 1] },
  { key: 'inspection', src: 'cn-p09-2-2292x1915.jpg', width: 1500, crop: [0.032, 0.12, 0.936, 0.7] },
  { key: 'emergency', src: 'cn-p07-8-2508x1442.jpg', width: 1400, crop: [0.040, 0, 0.920, 1] },
  { key: 'fireGas', src: 'cn-p09-4-970x647.jpg', width: 970, crop: [0, 0.032, 1, 0.937] },
  { key: 'nightPatrol', src: 'en-p07-5-1163x574.jpg', width: 1163, crop: [0.105, 0, 0.790, 1] }
]

const manifest = {}

for (const job of jobs) {
  const input = join(SRC, job.src)
  const meta = await sharp(input).metadata()
  const [left, top, wf, hf] = job.crop
  const extract = {
    left: Math.round(left * meta.width),
    top: Math.round(top * meta.height),
    width: Math.round(wf * meta.width),
    height: Math.round(hf * meta.height)
  }
  const info = await sharp(input)
    .extract(extract)
    .resize({
      width: job.upscale ? job.width : Math.min(job.width, extract.width),
      kernel: 'lanczos3',
      withoutEnlargement: false
    })
    .webp({ quality: 80, effort: 5 })
    .toFile(join(OUT, `${job.key}.webp`))
  manifest[job.key] = {
    file: `images/${job.key}.webp`,
    width: info.width,
    height: info.height,
    bytes: info.size
  }
  console.log(`${job.key}: ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}kB`)
}

// 1200x630 OG card from the hero shot.
const og = await sharp(join(SRC, 'en-p16-4-1252x778.jpg'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 82 })
  .toFile(join(OUT, 'og-u15.jpg'))
manifest.og = { file: 'images/og-u15.jpg', width: 1200, height: 630, bytes: og.size }
console.log(`og: 1200x630 ${(og.size / 1024).toFixed(0)}kB`)

// Brand logo is reused from the C500 landing; it is not a product asset.
const logoSource = 'landing/eavision-c500/public/images/logo-45620478.webp'
await sharp(logoSource).toFile(join(OUT, 'logo.webp'))
const logoInfo = await sharp(logoSource).metadata()
manifest.logo = {
  file: 'images/logo.webp',
  width: logoInfo.width,
  height: logoInfo.height,
  bytes: statSync(join(OUT, 'logo.webp')).size
}

writeFileSync('landing/u15/src/data/image-manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log('manifest written')

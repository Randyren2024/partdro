#!/usr/bin/env node
// Build the landing page's local image set from the EAVision CDN and the
// standalone project's custom artwork. Run only when media changes; the
// generated WebP files and manifest are committed so CI never downloads them.
//
// Usage:
//   npm run landing:c500:optimize
//   C500_SOURCE_DIR=/path/to/eavision_c500_landing_page_vue/public npm run landing:c500:optimize

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const landingDir = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(landingDir, '../..')
const publicDir = path.join(landingDir, 'public')
const imagesDir = path.join(publicDir, 'images')
const packagesDir = path.join(publicDir, 'packages')
const manifestPath = path.join(landingDir, 'src/data/image-manifest.json')
const cacheDir = path.join(repoRoot, '.tmp/c500-source-images')
const sourceDir =
  process.env.C500_SOURCE_DIR ||
  path.resolve(repoRoot, '../eavision_c500_landing_page_vue/public')

const REMOTE_BASE =
  'https://eavision-front-prod.oss-cn-hangzhou.aliyuncs.com/guanwang/products/new/c500/'
const remote = (name) => `${REMOTE_BASE}${name}`
const local = (name) => path.join(sourceDir, name)

// Longest edge is capped; smaller sources are never enlarged. Shared artwork is
// optimized once and referenced by multiple manifest keys where appropriate.
const SOURCES = [
  { key: 'hero', source: remote('hero@2x.png'), width: 1920, quality: 80 },
  { key: 'technology', source: local('images/technology.png'), width: 1600, quality: 82 },
  { key: 'abilityPayload', source: remote('ability-payload@2x.png'), width: 1200, quality: 78 },
  { key: 'abilitySpeed', source: local('images/ability-speed.png'), width: 1200, quality: 78 },
  { key: 'abilityShort', source: remote('ability-short@2x.png'), width: 1200, quality: 78 },
  { key: 'abilityDecision', source: remote('ability-decision@2x.png'), width: 1200, quality: 78 },
  { key: 'abilityBattery', source: remote('ability-battery@2x.png'), width: 1200, quality: 78 },
  { key: 'abilityCluster', source: remote('ability-cluster@2x.png'), width: 1200, quality: 78 },
  { key: 'abilityApplications', source: remote('ability-applications@2x.png'), width: 1200, quality: 78 },
  { key: 'performance', source: remote('dlgx.png'), width: 1920, quality: 80 },
  { key: 'storyPlaceholder', source: remote('story-placeholder@2x.png'), width: 1600, quality: 74 },
  { key: 'functionsBackground', source: remote('functions-background@2x.png'), width: 1600, quality: 78 },
  { key: 'landscape', source: remote('landscape-placeholder@2x.png'), width: 1600, quality: 74 },
  { key: 'powerFront', source: remote('power-front@2x.png'), width: 1400, quality: 78 },
  { key: 'powerStructure', source: remote('power-structure@2x.png'), width: 1400, quality: 78 },
  { key: 'energyAltitude', source: remote('energy-altitude@2x.png'), width: 1400, quality: 78 },
  { key: 'clusterQuad', source: remote('cluster-quad@2x.png'), width: 1400, quality: 78 },
  { key: 'functionPlaceholder', source: remote('function-placeholder@2x.png'), width: 1400, quality: 78 },
  { key: 'functionAirlift', source: remote('function-airlift@2x.png'), width: 1400, quality: 78 },
  { key: 'decisionPlaceholder', source: remote('decision-placeholder@2x.png'), width: 1200, quality: 78 },
  { key: 'applicationSolar', source: remote('application-solar@2x.png'), width: 1200, quality: 78 },
  { key: 'applicationTimber', source: remote('application-timber@2x.png'), width: 1200, quality: 78 },
  { key: 'applicationSteel', source: remote('application-steel@2x.png'), width: 1200, quality: 78 },
  { key: 'applicationEmergency', source: remote('application-emergency@2x.png'), width: 1200, quality: 78 },
  {
    key: 'packageStandardCharger',
    source: local('packages/package-standard-charger.png'),
    width: 1200,
    quality: 80,
    dir: packagesDir,
  },
  {
    key: 'packageStandardStation',
    source: local('packages/package-standard-station.png'),
    width: 1200,
    quality: 80,
    dir: packagesDir,
  },
  {
    key: 'packageAirliftCharger',
    source: local('packages/package-airlift-charger.png'),
    width: 1200,
    quality: 80,
    dir: packagesDir,
  },
  {
    key: 'packageAirliftStation',
    source: local('packages/package-airlift-station.png'),
    width: 1200,
    quality: 80,
    dir: packagesDir,
  },
  {
    key: 'logo',
    source: path.join(repoRoot, 'public/partdro_logo_white.png'),
    width: 320,
    quality: 90,
    dir: imagesDir,
  },
]

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 8)
}

async function readSource(source) {
  if (/^https?:\/\//i.test(source)) {
    await fs.mkdir(cacheDir, { recursive: true })
    const cachePath = path.join(cacheDir, source.split('/').pop())
    try {
      return await fs.readFile(cachePath)
    } catch {
      // Download once; subsequent runs reuse the cache.
    }
    let lastError
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(source, { signal: AbortSignal.timeout(90_000) })
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
        const buffer = Buffer.from(await response.arrayBuffer())
        await fs.writeFile(cachePath, buffer)
        return buffer
      } catch (error) {
        lastError = error
        await new Promise((resolve) => setTimeout(resolve, 1200 * attempt))
      }
    }
    throw new Error(`Failed to download ${source}: ${lastError?.message || lastError}`)
  }
  return fs.readFile(source)
}

async function main() {
  await fs.mkdir(imagesDir, { recursive: true })
  await fs.mkdir(packagesDir, { recursive: true })
  await fs.rm(imagesDir, { recursive: true, force: true })
  await fs.rm(packagesDir, { recursive: true, force: true })
  await fs.mkdir(imagesDir, { recursive: true })
  await fs.mkdir(packagesDir, { recursive: true })

  const manifest = {}
  let totalBytes = 0

  for (const item of SOURCES) {
    const input = await readSource(item.source)
    const outputDir = item.dir || imagesDir
    const pipeline = sharp(input).rotate()
    const meta = await pipeline.metadata()
    const resized = meta.width && meta.width > item.width
      ? pipeline.resize({ width: item.width, withoutEnlargement: true })
      : pipeline
    const buffer = await resized.webp({ quality: item.quality, effort: 5 }).toBuffer()
    const outMeta = await sharp(buffer).metadata()
    const filename = `${item.key}-${hash(buffer)}.webp`
    await fs.writeFile(path.join(outputDir, filename), buffer)
    const prefix = outputDir === packagesDir ? 'packages' : 'images'
    manifest[item.key] = {
      file: `${prefix}/${filename}`,
      width: outMeta.width,
      height: outMeta.height,
      bytes: buffer.length,
    }
    totalBytes += buffer.length
    console.log(
      `✓ ${item.key.padEnd(22)} ${String(outMeta.width).padStart(5)}x${String(outMeta.height).padEnd(5)} ${(buffer.length / 1024).toFixed(0)} KB`
    )
  }

  // Social cards need a widely supported raster format. Derive it from the
  // optimized hero rather than shipping another large source image.
  const heroBuffer = await fs.readFile(path.join(imagesDir, manifest.hero.file.split('/').pop()))
  const ogBuffer = await sharp(heroBuffer)
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
  await fs.writeFile(path.join(imagesDir, 'og-c500.jpg'), ogBuffer)
  manifest.og = {
    file: 'images/og-c500.jpg',
    width: 1200,
    height: 630,
    bytes: ogBuffer.length,
  }
  totalBytes += ogBuffer.length

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`\nManifest: ${path.relative(repoRoot, manifestPath)}`)
  console.log(`Total optimized images: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

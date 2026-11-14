import manifest from './image-manifest.json'

const base = '/products/u15-multi-mission-drone/'

export const demoVideo = `${base}video/u15-water-sampling.mp4`

export function image(key) {
  const entry = manifest[key]
  if (!entry) throw new Error(`Unknown landing image: ${key}`)
  return `${base}${entry.file}`
}

export function imageSize(key) {
  const entry = manifest[key]
  return { width: entry?.width, height: entry?.height }
}

export const ogImage = image('og')
export const logo = image('logo')
export const logoSize = imageSize('logo')

const img = (key) => ({
  image: image(key),
  ...imageSize(key)
})

export const media = {
  hero: img('hero'),
  airframe: img('airframe'),
  pod: img('pod'),
  radar: img('radar'),
  armLock: img('armLock'),
  weather: img('weather'),
  fpv: img('fpv'),
  aiTarget: img('aiTarget'),
  delivery: img('delivery'),
  precision: img('precision'),
  ranging: img('ranging'),
  terrain: img('terrain'),
  gcs: img('gcs'),
  waterSampling: img('waterSampling'),
  mooringBox: img('mooringBox'),
  logistics: img('logistics'),
  inspection: img('inspection'),
  emergency: img('emergency'),
  fireGas: img('fireGas'),
  nightPatrol: img('nightPatrol')
}

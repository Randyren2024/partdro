import manifest from './image-manifest.json'

const viteBase = import.meta.env.BASE_URL.replace(/\/?$/, '/')
const base = viteBase.startsWith('/products/vf50p-long-endurance-vtol-uav/') ? viteBase : '/products/vf50p-long-endurance-vtol-uav/'

export const demoVideo = `${base}video/vf50p-demo-flight.mp4`

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
  tail: img('tail'),
  engine: img('engine'),
  poster: img('poster')
}

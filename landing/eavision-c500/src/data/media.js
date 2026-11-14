import manifest from './image-manifest.json'

const base = '/products/c500-partdro-eavision/'

export const VIDEO_BASE =
  'https://eavision-front-prod.oss-cn-hangzhou.aliyuncs.com/guanwang/products/new/c500/video/'

export const vid = (index) => `${VIDEO_BASE}${index}.mp4`

export const heroVideoId = 'SXnInhaaUQ4'
export const heroVideo = `https://www.youtube.com/embed/${heroVideoId}?start=1&autoplay=1&rel=0&playsinline=1`

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
  ...imageSize(key),
})

export const media = {
  hero: img('hero'),
  technology: img('technology'),
  abilities: [
    { ...img('abilityPayload'), video: vid(1) },
    { ...img('abilitySpeed'), video: '' },
    { ...img('abilityShort'), video: vid(2) },
    { ...img('abilityShort'), video: vid(3) },
    { ...img('abilityDecision'), video: vid(4) },
    { ...img('abilityBattery'), video: '' },
    { ...img('abilityCluster'), video: '' },
    { ...img('abilityApplications'), video: '' }
  ],
  stories: {
    performance: { id: 'c500-performance', ...img('performance'), video: '', metrics: true },
    energy: { id: 'c500-energy-story', ...img('storyPlaceholder'), video: vid(23) },
    perception: { id: 'c500-perception-story', ...img('storyPlaceholder'), video: vid(24) },
    decision: { id: 'c500-decision-story', ...img('storyPlaceholder'), video: vid(25) },
    cluster: { id: 'c500-cluster-story', ...img('storyPlaceholder'), video: vid(26) },
    functions: { id: 'c500-functions-story', ...img('functionsBackground'), video: '' }
  },
  galleries: {
    power: {
      name: 'power',
      variant: 'slides',
      autoplay: true,
      items: [
        { ...img('powerFront'), video: vid(21) },
        { ...img('powerStructure'), video: vid(22) }
      ]
    },
    energy: {
      name: 'energy',
      variant: 'tabs',
      autoplay: true,
      items: [
        { ...img('landscape'), video: vid(5) },
        { ...img('landscape'), video: vid(6) },
        { ...img('energyAltitude'), video: '' }
      ]
    },
    perception: {
      name: 'perception',
      variant: 'tabs',
      autoplay: false,
      items: [
        { ...img('landscape'), video: vid(7) },
        { ...img('landscape'), video: vid(8) },
        { ...img('landscape'), video: vid(9) },
        { ...img('landscape'), video: vid(10) }
      ]
    },
    cluster: {
      name: 'cluster',
      variant: 'slides',
      autoplay: true,
      overlayCaption: true,
      items: [
        { ...img('landscape'), video: vid(20) },
        { ...img('landscape'), video: vid(14) },
        { ...img('clusterQuad'), video: '' }
      ]
    },
    functions: {
      name: 'functions',
      variant: 'cards',
      autoplay: true,
      items: [
        { ...img('functionPlaceholder'), video: vid(15) },
        { ...img('functionPlaceholder'), video: vid(16) },
        { ...img('functionPlaceholder'), video: vid(17) },
        { ...img('functionAirlift'), video: vid(18) },
        { ...img('functionAirlift'), video: vid(19) }
      ]
    }
  },
  decisions: [
    { ...img('decisionPlaceholder'), video: vid(11) },
    { ...img('decisionPlaceholder'), video: vid(12) },
    { ...img('decisionPlaceholder'), video: vid(13) }
  ],
  applications: [
    img('applicationSolar'),
    img('applicationTimber'),
    img('applicationSteel'),
    img('applicationEmergency')
  ],
  packages: [
    img('packageStandardCharger'),
    img('packageStandardStation'),
    img('packageAirliftCharger'),
    img('packageAirliftStation')
  ]
}

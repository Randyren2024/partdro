// Mirrors src/composables/useAttribution.ts on the main site so paid clicks
// arrive in the same `inquiries` attribution columns with the same semantics.
const STORAGE_KEY = 'pd_attribution_v1'
const TTL_MS = 90 * 24 * 60 * 60 * 1000
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

function emptyAttribution() {
  return {
    ts: 0,
    landing_page: null,
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    gclid: null,
  }
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAttribution()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.ts !== 'number') return emptyAttribution()
    if (Date.now() - parsed.ts > TTL_MS) return emptyAttribution()
    return { ...emptyAttribution(), ...parsed }
  } catch {
    return emptyAttribution()
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Attribution is an enhancement; storage failures must never block a lead.
  }
}

export function captureAttribution() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const incoming = {}
  let hasCampaignParams = false

  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) {
      incoming[key] = value
      hasCampaignParams = true
    }
  }
  const gclid = params.get('gclid') || params.get('gbraid') || params.get('wbraid')
  if (gclid) {
    incoming.gclid = gclid
    hasCampaignParams = true
  }

  const stored = readStored()
  if (!stored.landing_page) {
    stored.landing_page = window.location.pathname + window.location.search
    stored.referrer = document.referrer || null
    stored.ts = Date.now()
  }

  if (hasCampaignParams) {
    Object.assign(stored, incoming)
    stored.ts = Date.now()
  }

  writeStored(stored)
}

export function attributionFields(pagePath, productSlug) {
  const stored = readStored()
  return {
    page_path: pagePath,
    landing_page: stored.landing_page,
    referrer: stored.referrer,
    utm_source: stored.utm_source,
    utm_medium: stored.utm_medium,
    utm_campaign: stored.utm_campaign,
    utm_term: stored.utm_term,
    utm_content: stored.utm_content,
    gclid: stored.gclid,
    product_slug: productSlug,
  }
}

// Keep attribution fields aligned with the main site's inquiry schema.
const STORAGE_KEY = 'pd_attribution_v1'
const TTL_MS = 90 * 24 * 60 * 60 * 1000
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'dclid', 'fbclid']

function emptyAttribution() {
  return {
    ts: 0,
    first_visit_at: null,
    landing_page: null,
    first_landing_page: null,
    referrer: null,
    first_referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    gclid: null,
    gbraid: null,
    wbraid: null,
    dclid: null,
    fbclid: null,
    gclid_captured_at: null,
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
  let hasGoogleClickId = false

  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) {
      incoming[key] = value
      hasCampaignParams = true
    }
  }

  for (const key of CLICK_ID_KEYS) {
    const value = params.get(key)
    if (value) {
      incoming[key] = value
      hasCampaignParams = true
      if (key === 'gclid' || key === 'gbraid' || key === 'wbraid') hasGoogleClickId = true
    }
  }

  const stored = readStored()
  const isFirstTouch = !stored.first_visit_at && !stored.landing_page
  if (isFirstTouch) {
    const firstLandingPage = window.location.pathname + window.location.search
    const firstReferrer = document.referrer || null
    const firstVisitAt = new Date().toISOString()
    stored.first_visit_at = firstVisitAt
    stored.landing_page = firstLandingPage
    stored.first_landing_page = firstLandingPage
    stored.referrer = firstReferrer
    stored.first_referrer = firstReferrer
    stored.ts = Date.now()
  }

  if (hasCampaignParams) {
    Object.assign(stored, incoming)
    stored.ts = Date.now()
  }
  if (hasGoogleClickId) stored.gclid_captured_at = new Date().toISOString()
  writeStored(stored)
}

export function attributionFields(pagePath, productSlug) {
  const stored = readStored()
  return {
    page_path: pagePath,
    landing_page: stored.landing_page,
    first_landing_page: stored.first_landing_page,
    referrer: stored.referrer,
    first_referrer: stored.first_referrer,
    first_visit_at: stored.first_visit_at,
    utm_source: stored.utm_source,
    utm_medium: stored.utm_medium,
    utm_campaign: stored.utm_campaign,
    utm_term: stored.utm_term,
    utm_content: stored.utm_content,
    gclid: stored.gclid,
    gbraid: stored.gbraid,
    wbraid: stored.wbraid,
    dclid: stored.dclid,
    fbclid: stored.fbclid,
    gclid_captured_at: stored.gclid_captured_at,
    product_slug: productSlug,
  }
}

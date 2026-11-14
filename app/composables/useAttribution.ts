// 询盘归因：记录客户「从哪来、看的是哪个产品页」，让每条线索可归因、CAC 可计算。
//
// 首次触点保留 90 天；UTM 和广告 click ID 在出现新活动参数时更新。
// 不同平台的 click ID 分开保存，避免把 gbraid / wbraid 错记成 gclid。

const STORAGE_KEY = 'pd_attribution_v1'
const TTL_MS = 90 * 24 * 60 * 60 * 1000

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'dclid', 'fbclid'] as const

interface StoredAttribution {
  ts: number
  first_visit_at: string | null
  landing_page: string | null
  first_landing_page: string | null
  referrer: string | null
  first_referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  dclid: string | null
  fbclid: string | null
  gclid_captured_at: string | null
}

function emptyAttribution(): StoredAttribution {
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

function readStored(): StoredAttribution {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAttribution()
    const parsed = JSON.parse(raw) as Partial<StoredAttribution>
    if (!parsed || typeof parsed.ts !== 'number') return emptyAttribution()
    if (Date.now() - parsed.ts > TTL_MS) return emptyAttribution()
    // Merge defaults so visitors with the previous storage schema remain compatible.
    return { ...emptyAttribution(), ...parsed }
  } catch {
    return emptyAttribution()
  }
}

function writeStored(value: StoredAttribution) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage is an enhancement; it must never block an inquiry submission.
  }
}

/** Capture first touch once, then refresh campaign identifiers only when present. */
export function captureAttribution() {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const incoming: Partial<StoredAttribution> = {}
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
      if (key === 'gclid' || key === 'gbraid' || key === 'wbraid') {
        hasGoogleClickId = true
      }
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

  // Do not overwrite campaign attribution with empty values from internal navigation.
  if (hasCampaignParams) {
    Object.assign(stored, incoming)
    stored.ts = Date.now()
  }

  if (hasGoogleClickId) {
    stored.gclid_captured_at = new Date().toISOString()
  }

  writeStored(stored)
}

/**
 * Fields written to public.inquiries.
 * @param pagePath Page where the inquiry was submitted.
 * @param productSlug Product slug, or null for non-product pages.
 */
export function attributionFields(pagePath: string, productSlug: string | null) {
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

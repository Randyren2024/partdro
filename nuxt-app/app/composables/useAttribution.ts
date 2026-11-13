// 询盘归因：记录客户「从哪来、看的是哪个产品页」，让每条线索可归因、CAC 可计算。
//
// 为什么需要：2026-10-06 加拿大客户 Kal Essa 即将成交的那条询盘，只能事后靠 GA4
// 回溯才查出「google / cpc → /products/d15r」。GA4 数据一旦过期就永久丢失。
//
// 设计取舍：
// - 存在 localStorage 而不是 sessionStorage：B2B 决策周期以周/月计（Kal 从询盘到
//   报价确认用了两周），会话级存储会把这些线索的来源全丢掉。90 天窗口足够覆盖采购周期。
// - 首次落地页 + 首次 referrer 取「第一次」，UTM/gclid 取「最近一次」：
//   前者回答「他最初从哪认识我们」，后者回答「这次是哪条广告/哪个活动把他带回来的」。

const STORAGE_KEY = 'pd_attribution_v1'
const TTL_MS = 90 * 24 * 60 * 60 * 1000

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

interface StoredAttribution {
  ts: number
  landing_page: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  gclid: string | null
}

function emptyAttribution(): StoredAttribution {
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

function readStored(): StoredAttribution {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAttribution()
    const parsed = JSON.parse(raw) as StoredAttribution
    if (!parsed || typeof parsed.ts !== 'number') return emptyAttribution()
    if (Date.now() - parsed.ts > TTL_MS) return emptyAttribution()
    return { ...emptyAttribution(), ...parsed }
  } catch {
    return emptyAttribution()
  }
}

function writeStored(value: StoredAttribution) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // 隐私模式/存储配额满时静默失败：归因是增强项，绝不能因此挡住询盘提交
  }
}

/**
 * 在应用启动时调用一次。首次访问记录落地页与 referrer；
 * 带 UTM 或 gclid 的访问（广告点击/活动链接）覆盖 UTM 部分。
 */
export function captureAttribution() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const incoming: Partial<StoredAttribution> = {}
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
  const isFirstTouch = !stored.landing_page

  if (isFirstTouch) {
    stored.landing_page = window.location.pathname + window.location.search
    stored.referrer = document.referrer || null
    stored.ts = Date.now()
  }

  // 只有带明确广告/活动参数时才覆写 UTM，避免普通站内跳转把来源冲掉
  if (hasCampaignParams) {
    Object.assign(stored, incoming)
    stored.ts = Date.now()
  }

  writeStored(stored)
}

/**
 * 生成要写进 inquiries 的归因字段。
 * @param pagePath 提交表单时所在页面（含语言前缀）
 * @param productSlug 该页面所属产品 slug，非产品页传 null
 */
export function attributionFields(pagePath: string, productSlug: string | null) {
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

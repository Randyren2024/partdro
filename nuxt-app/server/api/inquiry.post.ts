/**
 * Public inquiry endpoint. Supabase service-role credentials stay server-side.
 * Validate and normalize all user-controlled fields before inserting.
 */
interface InquiryBody {
  name?: unknown
  email?: unknown
  phone?: unknown
  company?: unknown
  message?: unknown
  type?: unknown
  product_slug?: unknown
  website?: unknown
  gclid?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_term?: unknown
  utm_content?: unknown
  page_path?: unknown
  landing_page?: unknown
  referrer?: unknown
}

const LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  company: 160,
  message: 5000,
  product_slug: 160,
  website: 200,
  gclid: 512,
  utm: 500,
  page_path: 1000,
  landing_page: 2000,
  referrer: 2000,
} as const

function readString(value: unknown, field: string, max: number): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${field} format.` })
  }
  const normalized = value.trim()
  if (normalized.length > max) {
    throw createError({ statusCode: 400, statusMessage: `${field} is too long.` })
  }
  return normalized
}

export default defineEventHandler(async (event) => {
  assertMethod(event, ['POST'])
  const body = await readBody<InquiryBody>(event)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  // Honeypot: silently accept automated submissions without storing or counting them.
  if (readString(body.website, 'website', LIMITS.website)) {
    return { ok: true, spam: true }
  }

  const name = readString(body.name, 'name', LIMITS.name)
  const email = readString(body.email, 'email', LIMITS.email).toLowerCase()
  const phone = readString(body.phone, 'phone', LIMITS.phone)
  const company = readString(body.company, 'company', LIMITS.company)
  const message = readString(body.message, 'message', LIMITS.message)
  const type = readString(body.type, 'type', 32) || 'contact'
  const productSlug = readString(body.product_slug, 'product_slug', LIMITS.product_slug)

  if (!name || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Name, email and message are required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }
  if (name.length < 2 || message.length < 5) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide a little more detail.' })
  }
  if (!['contact', 'booking', 'franchise'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid inquiry type.' })
  }

  const supabase = getSupabaseServer(event)
  const { data, error } = await supabase.from('inquiries').insert({
    name,
    email,
    message,
    phone: phone || null,
    company: company || null,
    type,
    product_slug: productSlug || null,
    gclid: readString(body.gclid, 'gclid', LIMITS.gclid) || null,
    utm_source: readString(body.utm_source, 'utm_source', LIMITS.utm) || null,
    utm_medium: readString(body.utm_medium, 'utm_medium', LIMITS.utm) || null,
    utm_campaign: readString(body.utm_campaign, 'utm_campaign', LIMITS.utm) || null,
    utm_term: readString(body.utm_term, 'utm_term', LIMITS.utm) || null,
    utm_content: readString(body.utm_content, 'utm_content', LIMITS.utm) || null,
    page_path: readString(body.page_path, 'page_path', LIMITS.page_path) || null,
    landing_page: readString(body.landing_page, 'landing_page', LIMITS.landing_page) || null,
    referrer: readString(body.referrer, 'referrer', LIMITS.referrer) || null,
  }).select('id').single()

  if (error) {
    console.error('[inquiry] Supabase insert failed:', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'We could not receive your message. Please email info@droneworld.tech instead.',
    })
  }

  return { ok: true, id: data?.id }
})

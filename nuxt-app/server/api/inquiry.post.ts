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
  gclid: 512,
  utm: 500,
  page_path: 1000,
  landing_page: 2000,
  referrer: 2000,
} as const

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export default defineEventHandler(async (event) => {
  assertMethod(event, ['POST'])
  const body = await readBody<InquiryBody>(event)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
  }

  // Honeypot: silently accept automated submissions without storing or counting them.
  if (clean(body.website, 200)) {
    return { ok: true, spam: true }
  }

  const name = clean(body.name, LIMITS.name)
  const email = clean(body.email, LIMITS.email).toLowerCase()
  const phone = clean(body.phone, LIMITS.phone)
  const company = clean(body.company, LIMITS.company)
  const message = clean(body.message, LIMITS.message)
  const type = clean(body.type, 32) || 'contact'
  const productSlug = clean(body.product_slug, LIMITS.product_slug)

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
  if (body.name !== undefined && typeof body.name !== 'string'
    || body.email !== undefined && typeof body.email !== 'string'
    || body.message !== undefined && typeof body.message !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid field format.' })
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
    gclid: clean(body.gclid, LIMITS.gclid) || null,
    utm_source: clean(body.utm_source, LIMITS.utm) || null,
    utm_medium: clean(body.utm_medium, LIMITS.utm) || null,
    utm_campaign: clean(body.utm_campaign, LIMITS.utm) || null,
    utm_term: clean(body.utm_term, LIMITS.utm) || null,
    utm_content: clean(body.utm_content, LIMITS.utm) || null,
    page_path: clean(body.page_path, LIMITS.page_path) || null,
    landing_page: clean(body.landing_page, LIMITS.landing_page) || null,
    referrer: clean(body.referrer, LIMITS.referrer) || null,
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

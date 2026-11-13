/**
 * 前端联系表单 → Supabase inquiries 表 insert。
 *
 * 从 partdro/src/supabase/client.ts 的 client-side insert 改成 server-side：
 *   - service_role key 不再需要 RLS 放开
 *   - 可以在服务端统一处理归因字段（gclid/utm_*）
 *   - 密钥不落客户端
 */
interface InquiryBody {
  name?: string
  email?: string
  phone?: string
  company?: string
  message?: string
  type?: string
  product_slug?: string
  // 归因（客户端预填）
  gclid?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  page_path?: string
  landing_page?: string
  referrer?: string
}

export default defineEventHandler(async (event) => {
  assertMethod(event, ['POST'])
  const body = await readBody<InquiryBody>(event)
  const config = useRuntimeConfig(event)

  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const message = String(body?.message ?? '').trim()

  if (!name || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Name, email and message are required.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  const supabase = getSupabaseServer(event)
  const { data, error } = await supabase.from('inquiries').insert({
    name, email, message,
    phone: String(body?.phone ?? '').trim() || null,
    company: String(body?.company ?? '').trim() || null,
    type: String(body?.type ?? 'contact').trim() || 'contact',
    product_slug: String(body?.product_slug ?? '').trim() || null,
    // 归因字段
    gclid: body?.gclid || null,
    utm_source: body?.utm_source || null,
    utm_medium: body?.utm_medium || null,
    utm_campaign: body?.utm_campaign || null,
    utm_term: body?.utm_term || null,
    utm_content: body?.utm_content || null,
    page_path: body?.page_path || null,
    landing_page: body?.landing_page || null,
    referrer: body?.referrer || null,
    // 时间戳自动填充
  }).select('id').single()

  if (error) {
    console.error('[inquiry] supabase insert error:', error)
    throw createError({ statusCode: 502, statusMessage: 'We could not receive your message. Please email info@droneworld.tech instead.' })
  }

  return { ok: true, id: data?.id }
})

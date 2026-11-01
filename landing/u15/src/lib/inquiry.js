import { attributionFields } from './attribution'
import { PRODUCT_SLUG } from './contact'
import { insertInquiry } from './supabase'

export function buildInquiryPayload(form, packageLabel) {
  const path = window.location.pathname
  const lines = [
    'C500 quote request',
    `Package: ${packageLabel || 'Not specified'}`,
    `Company: ${form.company || '-'}`,
    `Country / region: ${form.region}`,
    form.message || '',
    `Page: ${path}`,
  ].filter(Boolean)

  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    type: 'contact',
    message: lines.join('\n'),
    ...attributionFields(path, PRODUCT_SLUG),
  }
}

export async function submitInquiry(form, packageLabel) {
  const payload = buildInquiryPayload(form, packageLabel)
  await insertInquiry(payload)
  return payload
}

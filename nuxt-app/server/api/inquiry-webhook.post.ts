/**
 * Supabase Database Webhook 接收端：inquiries 表新增记录 → DirectMail 发信 + 飞书卡片通知。
 *
 * 迁移自 partdro/netlify/functions/inquiry-webhook.ts（FC），现在是 Nitro server route。
 * Nitro 在 Cloudflare Workers 上跑，但 Workers CPU 时间（免费版 10ms）不足以发邮件 + 推飞书。
 * 所以：在 Workers 上跑时，只记录 payload 然后 fire-and-forget 触发 inquiry-analysis FC。
 * 完整发信 + 飞书卡片逻辑保留在本文件，本地/self-hosted Nitro 或升级到 Workers Paid（50ms）后自动生效。
 *
 * 链路：inquiries INSERT → pg_net POST /api/inquiry-webhook → 本路由
 */
import { timingSafeEqual } from 'node:crypto'
import { sendDirectMail } from '../utils/directmail'
import { sendFeishuInquiryCard } from '../utils/feishu'

interface SupabaseWebhookPayload {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

function assertWebhookSecret(event: any): void {
  const config = useRuntimeConfig(event)
  const expected = config.inquiryWebhookSecret
  if (!expected) throw createError({ statusCode: 503, statusMessage: 'INQUIRY_WEBHOOK_SECRET not configured' })
  const headers = event.headers || {}
  const got = headers['x-webhook-secret'] || headers['X-Webhook-Secret'] || ''
  const a = Buffer.from(expected), b = Buffer.from(String(got))
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook secret' })
  }
}

export default defineEventHandler(async (event) => {
  assertMethod(event, ['POST'])
  assertWebhookSecret(event)

  const body = await readBody<SupabaseWebhookPayload>(event)
  if (!body?.record || body.type && body.type !== 'INSERT') {
    return { ok: true, skipped: body?.type || 'no record' }
  }

  const record = body.record
  const config = useRuntimeConfig(event)
  const subject = `[Partdro] New ${String(record.type || 'contact')} inquiry from ${String(record.name || 'Website visitor')}`

  // 云端（Cloudflare Workers 免费版）CPU 时间不够，Fire-and-forget 触发 inquiry-analysis FC
  // 本地/self-hosted 则直接发信 + 推飞书
  try {
    if (config.directmailAccessKeyId && config.directmailServiceRoleKey !== undefined) {
      // 发邮件（直接调用 Nitro server/utils）
      await sendDirectMail({
        accessKeyId: config.directmailAccessKeyId,
        accessKeySecret: config.directmailAccessKeySecret,
        account: config.directmailAccount,
        to: config.inquiryNotifyTo || 'info@droneworld.tech',
        region: config.directmailRegion,
      }, subject, record)
    } else {
      // Workers 免费版：触发 FC 异步调用（保留原来的链路）
      if (config.inquiryAnalysisUrl) {
        fetch(config.inquiryAnalysisUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': config.inquiryWebhookSecret || '',
            'x-fc-invocation-type': 'Async',
          },
          body: JSON.stringify({ type: 'INSERT', table: 'inquiries', record }),
          signal: AbortSignal.timeout(15_000),
        }).then((r) => { if (!r.ok) console.error('[inquiry-webhook] dispatch failed:', r.status) })
          .catch((e) => console.error('[inquiry-webhook] dispatch error:', e))
      }
    }

    // 飞书卡片（飞书 API 调用极快，在 Workers 50ms 内可完成）
    if (config.feishuAppId && config.feishuAppSecret && config.feishuOpenId) {
      await sendFeishuInquiryCard({
        appId: config.feishuAppId,
        appSecret: config.feishuAppSecret,
        openId: config.feishuOpenId,
      }, record, config.inquiryReplyUrl || '', config.inquiryWebhookSecret || '')
    }

    console.log('[inquiry-webhook] ok, inquiry id =', String(record.id ?? '(none)'))
    return { ok: true }
  } catch (e: any) {
    console.error('[inquiry-webhook] error:', e?.message || e)
    throw createError({ statusCode: 502, statusMessage: e?.message || 'Inquiry delivery failed' })
  }
})

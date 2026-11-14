/**
 * 飞书私聊卡片通知。
 * 迁移自 partdro/netlify/functions/inquiry-webhook.ts。
 */
import { createHmac } from 'node:crypto'

function escapeMd(value: string): string {
  return value.replace(/([*_~`])/g, '\\$1')
}

export async function sendFeishuInquiryCard(
  config: { appId: string; appSecret: string; openId: string },
  record: Record<string, unknown>,
  replyUrl: string,
  replySecret: string,
): Promise<void> {
  const fields = Object.entries(record)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => [k, String(v)] as [string, string])

  const type = String(record.type || 'contact')
  const name = String(record.name || 'Website visitor')
  const subject = `[Partdro] New ${type} inquiry from ${name}`

  const md = (pairs: Array<[string, string]>): string =>
    pairs.map(([k, v]) => `**${escapeMd(k)}**\n${escapeMd(v)}`).join('\n')

  const elements: Array<Record<string, any>> = []
  if (fields.length > 4) {
    elements.push({
      tag: 'div',
      fields: fields
        .slice(0, 4)
        .map(([k, v]) => ({
          is_short: true,
          text: { tag: 'lark_md', content: `**${escapeMd(k)}**\n${escapeMd(v)}` },
        })),
    })
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: md(fields.slice(4)) } })
  } else {
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: md(fields) } })
  }
  elements.push({ tag: 'hr' })

  const id = record.id === undefined || record.id === null ? '' : String(record.id)
  if (replyUrl && replySecret && id) {
    const token = createHmac('sha256', replySecret).update(`reply:${id}`).digest('base64url').slice(0, 32)
    const url = new URL(replyUrl); url.searchParams.set('id', id); url.searchParams.set('t', token)
    elements.push({
      tag: 'action',
      actions: [{
        tag: 'button',
        text: { tag: 'plain_text', content: '起草回复（需我批准后发送）' },
        type: 'primary',
        url: url.toString(),
      }],
    })
  }
  elements.push({
    tag: 'note',
    elements: [{ tag: 'plain_text', content: 'Sent automatically from the Partdro website contact form.' }],
  })

  const card = {
    config: { wide_screen_mode: true },
    header: { template: 'blue', title: { tag: 'plain_text', content: subject } },
    elements,
  }

  const tokRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret }),
  })
  const tok = (await tokRes.json().catch(() => ({}))) as any
  if (tok.code !== 0) throw new Error(`Feishu auth failed: ${tok.code} ${tok.msg}`)

  const msgRes = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${tok.tenant_access_token}`,
    },
    body: JSON.stringify({ receive_id: config.openId, msg_type: 'interactive', content: JSON.stringify(card) }),
  })
  const msg = (await msgRes.json().catch(() => ({}))) as any
  if (msg.code !== 0) throw new Error(`Feishu send failed: ${msg.code} ${msg.msg}`)
}

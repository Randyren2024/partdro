// 飞书日报推送：把已发邮件的 Markdown 报告同时推到飞书私聊。
//
// 设计约束（与现有询盘通知保持一致）：
// - 未配置 FEISHU_* 时静默跳过，绝不因为飞书失败而影响 OSS 存档或邮件。
// - 复用与 inquiry-webhook 相同的 tenant_access_token + im/v1/messages 接口。
// - 飞书卡片不支持 Markdown 表格，这里把表格逐行降级成「- 单元格 · 单元格」，
//   保证在手机上仍然可读，同时不丢失任何一行数据。

export type FeishuTemplate = 'blue' | 'green' | 'orange' | 'red' | 'grey'

export interface FeishuReportOptions {
  title: string
  md: string
  template?: FeishuTemplate
  footer?: string
}

/** 飞书卡片单条消息上限约 30KB，这里保守截断，宁可少发也不让接口报错 */
const MAX_CARD_CHARS = 18000

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-')
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

/**
 * Markdown → 飞书卡片可读文本。
 * 表格降级为逐行要点，标题改为加粗，其余原样保留。
 */
export function mdToFeishu(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // 表格：表头 + 分隔行 + 若干数据行
    if (line.includes('|') && isTableSeparator(lines[i + 1] || '')) {
      const header = splitRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      for (const row of rows) {
        const parts = row.map((cell, idx) => (idx === 0 ? `**${cell}**` : cell)).filter((c) => c !== '')
        if (parts.length) out.push(`- ${parts.join(' · ')}`)
      }
      // 表头在降级后意义不强，仅在无数据行时保留一行提示
      if (!rows.length && header.length) out.push(`- ${header.join(' · ')}`)
      continue
    }
    if (line.startsWith('## ')) out.push(`**${line.slice(3)}**`)
    else if (line.startsWith('# ')) out.push(`**${line.slice(2)}**`)
    else if (line.startsWith('> ')) out.push(`> ${line.slice(2)}`)
    else out.push(line)
    i++
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

async function feishuPost(url: string, body: unknown, token?: string): Promise<Record<string, any>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, any>
  if (data.code !== 0) {
    throw new Error(`Feishu API failed (${res.status}): ${data.code} ${String(data.msg || '')}`)
  }
  return data
}

/**
 * 推送一份日报到飞书私聊。
 * @returns 是否真的发出去（未配置凭据时为 false，调用方无需当作错误）
 */
export async function sendFeishuReport(opts: FeishuReportOptions): Promise<boolean> {
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET
  const openId = process.env.FEISHU_OPEN_ID
  if (!appId || !appSecret || !openId) {
    console.log('[feishu-report] FEISHU_* 未配置，跳过飞书推送')
    return false
  }

  let content = mdToFeishu(opts.md)
  if (content.length > MAX_CARD_CHARS) {
    content = content.slice(0, MAX_CARD_CHARS) + '\n\n…（内容过长已截断，完整版见邮件或 OSS 存档）'
  }

  const elements: Array<Record<string, any>> = [
    { tag: 'div', text: { tag: 'lark_md', content } },
    { tag: 'hr' },
    {
      tag: 'note',
      elements: [{ tag: 'plain_text', content: opts.footer || 'Partdro 自动日报（与邮件同源）' }],
    },
  ]

  const card = {
    config: { wide_screen_mode: true },
    header: { template: opts.template || 'blue', title: { tag: 'plain_text', content: opts.title } },
    elements,
  }

  const tok = await feishuPost('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: appId,
    app_secret: appSecret,
  })
  await feishuPost(
    'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
    { receive_id: openId, msg_type: 'interactive', content: JSON.stringify(card) },
    String(tok.tenant_access_token),
  )
  return true
}

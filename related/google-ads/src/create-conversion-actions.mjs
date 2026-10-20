// 创建网站转化操作（询盘表单 / WhatsApp 点击），并提取 GTM 所需的 Conversion ID + Label
// 用法: node src/create-conversion-actions.mjs
// 事件侧已完成：站点通过 GTM dataLayer 推送 'contact_form_submission' 与 'whatsapp_chat_initiated'
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const err = e => (e?.errors || [{ message: e.message }]).map(x => x.message).join(' | ');

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

const ACTIONS = [
  // 类别影响优化目标匹配；SUBMIT_LEAD_FORM = 询盘表单
  { name: 'Inquiry Form Submission - droneworld.tech', category: 'SUBMIT_LEAD_FORM' },
  // CONTACT = 即时通讯/联系类
  { name: 'WhatsApp Chat Initiated - droneworld.tech', category: 'CONTACT' },
];

// 1) 幂等：查现有转化操作
const existing = await customer.report({
  entity: 'conversion_action',
  attributes: [
    'conversion_action.id',
    'conversion_action.name',
    'conversion_action.status',
    'conversion_action.type',
    'conversion_action.tag_snippets',
  ],
});

// 2) 创建缺失的（WEBSITE 类型，ONE 计数，主转化参与智能出价）
for (const a of ACTIONS) {
  if (existing.some(e => e.conversion_action.name === a.name)) {
    console.log(`↷ 已存在: ${a.name}`);
    continue;
  }
  await customer.conversionActions.create([{
    name: a.name,
    category: a.category,
    type: 'WEBPAGE',                    // v25 枚举：网站转化 = WEBPAGE（不是 WEBSITE）
    status: 'ENABLED',
    counting_type: 'ONE_PER_CLICK',     // 每次点击只计 1 次（枚举无 ONE）
    // include_in_conversions_metric 默认 true（主转化，参与智能出价）；create 时传该字段会报 immutable
  }]).then(r => console.log(`✅ 创建: ${a.name} → ${JSON.stringify(r)}`))
     .catch(e => console.error(`⚠️ ${a.name}:`, err(e)));
}

// 3) 读取 tag_snippets，提取 GTM 需要的 AW-XXXX/label
const all = await customer.report({
  entity: 'conversion_action',
  attributes: [
    'conversion_action.id',
    'conversion_action.name',
    'conversion_action.status',
    'conversion_action.tag_snippets',
  ],
});
console.log('\n== GTM 配置所需 ==');
for (const row of all) {
  const ca = row.conversion_action;
  if (!ACTIONS.some(a => a.name === ca.name)) continue;
  const snippets = (ca.tag_snippets ?? []).map(s => s.event_snippet ?? s.global_site_tag ?? '').join('\n');
  const sendTo = snippets.match(/send_to\s*:\s*['"]([^'"]+)['"]/)?.[1]
    ?? snippets.match(/AW-\d+\/[\w-]+/)?.[0];
  const awId = snippets.match(/AW-\d+/)?.[0];
  if (!sendTo) console.log(`[debug] ${ca.name} 原始 snippets:\n${snippets || '(空)'}\n`);
  console.log(`${ca.name}\n  status=${ca.status}  id=${ca.id}\n  conversion_id=${awId ?? '(未取到)'}  send_to=${sendTo ?? '(未取到)'}\n`);
}
console.log('完成。');

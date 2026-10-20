// 将 GA4 导入的转化动作从主要(Primary)降级为次要(Secondary)
// 用法: node src/downgrade-ga4-imports.mjs
// 回滚: 把 IDS 对应 id 的 primary_for_goal 改回 true 再跑一遍
// 说明: primary_for_goal=false 只影响 "Conversions" 竞价列，历史数据保留，仍出现在 "所有转化"
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

// contact_form_submission / whatsapp_chat_initiated / email_click
// 注意: "Lead form - Submit" (7749152869) 是系统管理的表单资产转化，API 禁改 (mutate_error 9)，需在界面切换
const IDS = ['7749160062', '7748962961', '7753041005'];

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customerId = String(process.env.GOOGLE_ADS_CUSTOMER_ID).replace(/\D/g, '');
const customer = client.Customer({
  customer_id: customerId,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
});

// 先读一遍当前状态，避免重复操作
const current = await customer.query(`
  SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.primary_for_goal
  FROM conversion_action
  WHERE conversion_action.id IN (${IDS.map(id => `'${id}'`).join(',')})
`);
console.log('当前状态:');
for (const r of current) {
  const c = r.conversion_action;
  console.log(`  ${c.id} ${c.name} | status=${c.status} primary=${c.primary_for_goal}`);
}

const results = await customer.conversionActions.update(
  IDS.map(id => ({
    resource_name: `customers/${customerId}/conversionActions/${id}`,
    primary_for_goal: false,
  }))
);
console.log('已降级为次要(Secondary):');
const arr = Array.isArray(results) ? results : results?.results ?? [results];
for (const r of arr) console.log(' ', r.resource_name ?? JSON.stringify(r));

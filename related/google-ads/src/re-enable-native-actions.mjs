// 重新启用两个被 REMOVED 的原生网站转化动作（恢复为主要竞价信号）
// 用法: node src/re-enable-native-actions.mjs
// 背景: GA4 导入的 3 个动作已降级为次要 (见 downgrade-ga4-imports.mjs)，
//       原生 Google Ads tag (AW-11160320746) 恢复为新站的主要转化信号
// 回滚: 把 status 改回 'REMOVED' 重跑
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

// WhatsApp Chat Initiated - droneworld.tech / Inquiry Form Submission - droneworld.tech
const IDS = ['7822419540', '7822419813'];

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
    status: 'ENABLED',
  }))
);
console.log('已重新启用(ENABLED):');
const arr = Array.isArray(results) ? results : results?.results ?? [results];
for (const r of arr) console.log(' ', r.resource_name ?? JSON.stringify(r));

// 重命名转化动作（用于把原生 Ads 动作名与 GA4 事件名对齐，便于交叉分析对应）
// 用法: node src/rename-conversion-action.mjs <conversionActionId> "<新名称>"
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const ID = process.argv[2];
const NEW_NAME = process.argv[3];
if (!ID || !NEW_NAME) {
  console.error('用法: node src/rename-conversion-action.mjs <conversionActionId> "<新名称>"');
  process.exit(1);
}

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

// 代理链路会间歇性掉线（ECONNRESET/Premature close），统一加重试
async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /aborted|ECONNRESET|ETIMEDOUT|ECONNREFUSED|UND_ERR|timeout|premature|socket|fetch failed|5\d\d/i.test(msg);
      if (!retryable || i === attempts) throw e;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 60)})，${wait / 1000}s 后重试...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

const before = await withRetry(() => customer.query(
  `SELECT conversion_action.id, conversion_action.name FROM conversion_action WHERE conversion_action.id = '${ID}'`
), '读取当前名称');
if (!before.length) { console.error(`找不到转化动作 ${ID}`); process.exit(2); }
console.log(`原名: ${before[0].conversion_action.name}`);

await withRetry(() => customer.conversionActions.update([{
  resource_name: `customers/${customerId}/conversionActions/${ID}`,
  name: NEW_NAME,
}]), '更新名称');
console.log(`✅ 已重命名 → ${NEW_NAME}`);

const after = await withRetry(() => customer.query(
  `SELECT conversion_action.id, conversion_action.name, conversion_action.status FROM conversion_action WHERE conversion_action.id = '${ID}'`
), '回读确认');
console.log('回读:', JSON.stringify(after[0].conversion_action));
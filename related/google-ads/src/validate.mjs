// 验证（google-ads-api v25）：列出可访问客户 + 读取目标账户现有广告系列（只读）
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const required = ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_REFRESH_TOKEN'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('缺少 .env 配置: ' + missing.join(', '));
  process.exit(1);
}

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

console.log('== 1. 可访问客户列表 ==');
let accounts;
try {
  accounts = await client.listAccessibleCustomers(process.env.GOOGLE_ADS_REFRESH_TOKEN);
  console.log(JSON.stringify(accounts, null, 2));
} catch (e) {
  console.error('listAccessibleCustomers 失败:', e?.errors?.[0]?.message || e.message);
  process.exit(1);
}

const cid = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, '');
if (!cid) {
  console.log('\n未设置 GOOGLE_ADS_CUSTOMER_ID —— 请从上面列表选 Partdro 账户 ID 填入 .env 后重跑。');
  process.exit(0);
}

console.log(`\n== 2. 账户 ${cid} 现有广告系列 ==`);
const customer = client.Customer({
  customer_id: cid,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
});
try {
  const rows = await customer.report({
    entity: 'campaign',
    attributes: ['campaign.id', 'campaign.name', 'campaign.status', 'campaign.advertising_channel_type'],
    limit: 50,
  });
  if (!rows.length) console.log('(空 — 尚无任何广告系列)');
  for (const r of rows) {
    console.log(`#${r.campaign.id}  ${r.campaign.name}  [${r.campaign.status}]  ${r.campaign.advertising_channel_type}`);
  }
  console.log('\n✅ 验证通过：凭据有效、账户可读写。可以运行 npm run create:d15r');
} catch (e) {
  console.error('report 失败:', e?.errors?.[0]?.message || e.message);
  process.exit(1);
}

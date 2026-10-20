// 通用 GAQL 查询器
// 用法: node src/query.mjs "SELECT ... FROM ... [WHERE ...]"
// 注意: GAQL 字符串字面量用单引号；PowerShell 外层用双引号包裹
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const gaql = process.argv[2];
if (!gaql) {
  console.error('用法: node src/query.mjs "<GAQL 查询>"');
  process.exit(1);
}

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
});

let rows;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    rows = await customer.query(gaql);
    break;
  } catch (e) {
    if (attempt === 3) { console.error('查询失败:', e.message); process.exit(2); }
    console.error(`重试 ${attempt}/3: ${e.message}`);
    await new Promise(r => setTimeout(r, 5000));
  }
}
console.log(`共 ${rows.length} 行`);
for (const r of rows) console.log(JSON.stringify(r));

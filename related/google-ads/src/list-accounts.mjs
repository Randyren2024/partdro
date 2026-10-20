// 列出每个可访问账户的名称，找到 Partdro 账户
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const ids = ['3337342376', '2465657011', '9349071364', '2988417972'];
for (const id of ids) {
  const c = client.Customer({ customer_id: id, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN });
  try {
    const rows = await c.report({
      entity: 'customer',
      attributes: ['customer.id', 'customer.descriptive_name', 'customer.currency_code', 'customer.time_zone'],
      limit: 1,
    });
    const r = rows[0]?.customer || {};
    console.log(`${id}  |  ${r.descriptive_name || '?'}  |  ${r.currency_code || '?'}  |  ${r.time_zone || '?'}`);
  } catch (e) {
    console.log(`${id}  |  无法读取: ${e?.errors?.[0]?.message || e.message}`);
  }
}

// 验证各转化操作近30天是否有实际转化记录 —— 判断 GA 导入路径是否仍然有效
// 用法: node src/check-conversion-volume.mjs
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

let rows;
for (let i = 0; i < 5; i++) {
  try {
    rows = await customer.report({
      entity: 'campaign',
      attributes: [
        'campaign.name',
        'segments.conversion_action',
        'metrics.conversions',
        'metrics.all_conversions',
      ],
      where: "metrics.all_conversions > 0 AND segments.date DURING LAST_30_DAYS",
    });
    break;
  } catch (e) {
    if (i === 4) throw e;
    console.error(`网络错误(${e.code ?? e.message})，${10 * (i + 1)}s 后重试...`);
    await new Promise(r => setTimeout(r, 10000 * (i + 1)));
  }
}

if (!rows.length) { console.log('近30天：全账户零转化记录'); process.exit(0); }
console.log('campaign\taction\tconversions\tall_conversions');
for (const r of rows) {
  const m = r.metrics, c = r.campaign;
  // segments.conversion_action 是资源名，截取末段便于核对 id
  console.log(`${c.name}\t${(r.segments?.conversion_action ?? '').split('/').pop()}\t${m.conversions}\t${m.all_conversions}`);
}

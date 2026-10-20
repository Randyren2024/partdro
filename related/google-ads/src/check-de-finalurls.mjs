// 检查 D15R - Search - DE (24314545845) 所有广告的 finalUrl
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

const rows = await customer.query(`
  SELECT ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.final_urls, ad_group_ad.status, ad_group.name
  FROM ad_group_ad
  WHERE campaign.id = 24314545845
    AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
`);
for (const r of rows) {
  const ad = r.ad_group_ad.ad;
  const url = ad.final_urls?.[0] || '-';
  const h1 = ad.responsive_search_ad?.headlines?.[0]?.text || '-';
  console.log(`[${r.ad_group_ad.status}] ${pad(r.ad_group.name, 22)} ${url}`);
  console.log(`    首标题: ${h1}`);
}
function pad(s, n) { return String(s ?? '').padEnd(n); }

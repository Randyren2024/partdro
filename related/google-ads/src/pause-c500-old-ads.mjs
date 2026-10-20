// 暂停 C500 系列旧 5 条 RSA（finalUrl 指向错误 /products/c500）
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24316207812';
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

const ads = await customer.query(`
  SELECT ad_group_ad.resource_name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}
`);
for (const a of ads) {
  const fu = a.ad_group_ad.ad.final_urls?.[0] || '';
  const isOld = fu.includes('/products/c500') && !fu.includes('c500-delivery-drone');
  const s = a.ad_group_ad.status === 2 ? 'ENABLED' : a.ad_group_ad.status === 3 ? 'PAUSED' : a.ad_group_ad.status;
  const tag = isOld ? '⚠ 旧URL' : '✅ 正确URL';
  console.log(`[${a.ad_group.name}] AD ${a.ad_group_ad.ad.id} ${s} ${tag} ${fu}`);
  if (isOld && a.ad_group_ad.status === 2) {
    await customer.adGroupAds.update([{ resource_name: a.ad_group_ad.resource_name, status: 'PAUSED' }]);
    console.log(`  → 已 PAUSED`);
  }
}
console.log('\n✅ 完成');

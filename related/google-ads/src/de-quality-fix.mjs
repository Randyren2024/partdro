// D15R - Search - DE (24314545845) 质量治理 — 2026-10-13
// ① 暂停 v2 Solar & PV (AD 827274840408)——v3 判定胜出（3.72% vs 0.85%）
// ② 加 6 个消费级负词（phrase match），把 Maximize Clicks 往回赶
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const PAUSE_AD_ID = '827274840408';
const NEGATIVES = ['kärcher', 'kränzle', 'reinigungsset', 'bürste', 'teleskopstange', 'isolar'];

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({ customer_id: CUSTOMER_ID, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN });

// ① 暂停 v2 Solar & PV
const adRn = `customers/${CUSTOMER_ID}/adGroupAds/${PAUSE_AD_ID}`;
// resource_name 需含 adGroupId，先查
const adRow = await customer.query(`
  SELECT ad_group_ad.resource_name, ad_group_ad.status, ad_group.name
  FROM ad_group_ad WHERE ad_group_ad.ad.id = ${PAUSE_AD_ID}
`);
const rn = adRow[0].ad_group_ad.resource_name;
console.log(`① 暂停 v2 Solar & PV: ${rn} (当前 ${adRow[0].ad_group_ad.status})`);
await customer.adGroupAds.update([{ resource_name: rn, status: 'PAUSED' }]);
const chk = await customer.query(`
  SELECT ad_group_ad.status FROM ad_group_ad WHERE ad_group_ad.ad.id = ${PAUSE_AD_ID}
`);
console.log(`   → 已变为 ${chk[0].ad_group_ad.status}`);

// ② 幂等加负词（查现有负词，跳过已存在的）
const existing = await customer.query(`
  SELECT campaign_criterion.keyword.text
  FROM campaign_criterion
  WHERE campaign.id = ${CAMPAIGN_ID} AND campaign_criterion.negative = TRUE
`);
const have = new Set(existing.map(r => r.campaign_criterion.keyword.text.replace(/^"|"$/g, '').toLowerCase()));
const toAdd = NEGATIVES.filter(n => !have.has(n.toLowerCase()));
console.log(`② 现有负词 ${have.size} 个，新增 ${toAdd.length} 个: ${toAdd.join(', ')}`);
if (toAdd.length) {
  const res = await customer.campaignCriteria.create(
    toAdd.map(text => ({
      campaign: `customers/${CUSTOMER_ID}/campaigns/${CAMPAIGN_ID}`,
      negative: true,
      keyword: { text, match_type: 3 }, // KeywordMatchType.PHRASE = 3
    }))
  );
  console.log('   → 创建结果:', JSON.stringify(res).slice(0, 300));
}
const after = await customer.query(`
  SELECT campaign_criterion.keyword.text
  FROM campaign_criterion
  WHERE campaign.id = ${CAMPAIGN_ID} AND campaign_criterion.negative = TRUE
`);
console.log(`   验证: 现有负词共 ${after.length} 个`);
after.forEach(r => console.log(`   - ${r.campaign_criterion.keyword.text}`));

// D15R-DE RSA 文案增强 v2：新建增强版 RSA（原10标题+2新标题 / 原3描述+1新描述），暂停旧广告
// UPDATE 不允许改 RSA 资产，只能新建（0 展示广告，无统计损失）
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';
const ADD_HEADLINES = [
  'Drohne für Reinigungsfirmen', // B2B 筛选
  'Warum Regen nicht reicht', // Regen-Mythos
];
const ADD_DESCRIPTION = 'PV-Reinigung ohne Gerüst: Drohne statt Seilzug. Für Reinigungsfirmen.';

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

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

// 拉取现有 RSA（含所属广告组与最终 URL）
const ads = await withRetry(() => customer.query(
  `SELECT ad_group_ad.resource_name, ad_group_ad.ad.id, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.status, ad_group.resource_name FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}`
));

for (const r of ads) {
  const adId = r.ad_group_ad.ad.id;
  const rsa = r.ad_group_ad.ad.responsive_search_ad;
  const headlines = [
    ...(rsa.headlines || []).map(h => ({ text: h.text, ...(h.pinned_field ? { pinned_field: h.pinned_field } : {}) })),
    ...ADD_HEADLINES.map(text => ({ text })),
  ];
  const descriptions = [
    ...(rsa.descriptions || []).map(d => ({ text: d.text, ...(d.pinned_field ? { pinned_field: d.pinned_field } : {}) })),
    { text: ADD_DESCRIPTION },
  ];
  console.log(`AD ${adId}: ${headlines.length} 标题 / ${descriptions.length} 描述`);

  // 新建增强版 RSA
  const newAd = await withRetry(() => customer.adGroupAds.create([{
    status: 'ENABLED',
    ad_group: r.ad_group?.resource_name,
    ad: {
      final_urls: r.ad_group_ad.ad.final_urls,
      responsive_search_ad: { headlines, descriptions },
    },
  }]), `新建RSA(替换${adId})`);
  const newId = newAd?.results?.[0]?.resource_name || JSON.stringify(newAd).slice(0, 150);
  console.log(`  ✅ 新建: ${newId}`);

  // 暂停旧广告
  await withRetry(() => customer.adGroupAds.update([{
    resource_name: r.ad_group_ad.resource_name,
    status: 'PAUSED',
  }]), `暂停旧AD ${adId}`);
  console.log(`  ✅ 旧 AD ${adId} 已暂停`);
}

// 回读
console.log('\n回读验证:');
const check = await withRetry(() => customer.query(
  `SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad.responsive_search_ad.headlines FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}`
));
for (const r of check) {
  console.log(`  [${r.ad_group.name}] AD ${r.ad_group_ad.ad.id} ${r.ad_group_ad.status === 2 ? 'ENABLED' : r.ad_group_ad.status} (${(r.ad_group_ad.ad.responsive_search_ad?.headlines || []).length}H)`);
}
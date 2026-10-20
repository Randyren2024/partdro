// D15R-DE 冷启动优化执行脚本（2026-10-08，用户已批准方案）
// ① 出价策略 MAXIMIZE_CONVERSIONS → MAXIMIZE_CLICKS + CPC 上限 ¥10（≈$1.4/€1.3）
// ② 删除 3 个零搜索量关键词
// ③ 新增 4 个关键词（3 个泛需求 PV 清洗词 + fensterreinigung drohne）
// ④ 展示现有 RSA 文案，追加 B2B 筛选标题（供人工确认后 --ads 执行）
// 用法: node src/optimize-de-campaign.mjs [--ads]
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';
const AG_REINIGUNG = 'customers/3337342376/adGroups/201105008295'; // Reinigungsdrohne
const AG_SOLAR = 'customers/3337342376/adGroups/201805746138'; // Solar & PV
const CPC_CEILING_CNY = 10; // ¥10/次 ≈ $1.4 ≈ €1.3

// 代理链路间歇性掉线，统一重试
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

// ---------- ① 出价策略切换 ----------
console.log(`① 出价策略 → MAXIMIZE_CLICKS (CPC 上限 ¥${CPC_CEILING_CNY})`);
await withRetry(() => customer.campaigns.update([{
  resource_name: `customers/3337342376/campaigns/${CAMPAIGN_ID}`,
  maximize_clicks: { max_cpc_bid_ceiling_micros: CPC_CEILING_CNY * 1e6 },
}]), '切换出价');
console.log('  ✅ 已更新');

// ---------- ② 删除零量词 ----------
const TO_REMOVE = [
  'customers/3337342376/adGroupCriteria/201805746138~2531402397324', // solarreinigung drohne (0/月)
  'customers/3337342376/adGroupCriteria/201805746138~2531402397524', // photovoltaik reinigung drohne (0/月)
  'customers/3337342376/adGroupCriteria/201805746138~2531402397764', // solaranlagen reinigung drohne (0/月)
];
console.log(`② 删除 3 个零量词`);
await withRetry(() => customer.adGroupCriteria.remove(TO_REMOVE), '删除关键词');
console.log('  ✅ 已删除');

// ---------- ③ 新增关键词 ----------
const TO_ADD = [
  { ad_group: AG_SOLAR, text: 'solarpanel reinigen', note: '2400/月 低价$0.99' },
  { ad_group: AG_SOLAR, text: 'pv anlage reinigen', note: '2400/月' },
  { ad_group: AG_SOLAR, text: 'pv reinigung', note: '1300/月' },
  { ad_group: AG_REINIGUNG, text: 'fensterreinigung drohne', note: '30/月 $3.10' },
];
console.log(`③ 新增 ${TO_ADD.length} 个关键词（短语匹配）`);
await withRetry(() => customer.adGroupCriteria.create(
  TO_ADD.map(k => ({
    ad_group: k.ad_group,
    status: 'ENABLED',
    negative: false,
    keyword: { text: k.text, match_type: 'PHRASE' },
  })),
), '新增关键词');
console.log('  ✅ 已新增: ' + TO_ADD.map(k => `"${k.text}"(${k.note})`).join(', '));

// ---------- ④ 展示现有 RSA 文案 ----------
console.log('\n④ 现有 RSA 文案：');
const ads = await withRetry(() => customer.query(
  `SELECT ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.status FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}`
));
for (const r of ads) {
  console.log(`  AD ${r.ad_group_ad.ad.id} (${r.ad_group_ad.status}):`);
  for (const h of r.ad_group_ad.ad.responsive_search_ad?.headlines || []) console.log(`    H: ${h.text}`);
  for (const d of r.ad_group_ad.ad.responsive_search_ad?.descriptions || []) console.log(`    D: ${d.text}`);
}

// ---------- 回读验证 ----------
console.log('\n⑤ 回读验证：');
const check = await withRetry(() => customer.query(
  `SELECT campaign.id, campaign.bidding_strategy_type, campaign.maximize_clicks.max_cpc_bid_ceiling_micros FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}`
));
console.log(JSON.stringify(check[0], null, 1));
const kws = await withRetry(() => customer.query(
  `SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status FROM ad_group_criterion WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED'`
));
console.log(`当前生效关键词 ${kws.length} 个:`);
for (const k of kws) console.log(`  [${k.ad_group.name}] ${k.ad_group_criterion.keyword.match_type} ${k.ad_group_criterion.keyword.text}`);
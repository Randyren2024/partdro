// D15R - Search - Global 诊断：系列/预算/出价/关键词/广告/近30天表现 + 搜索词
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /aborted|ECONNRESET|ETIMEDOUT|ECONNREFUSED|UND_ERR|timeout|premature|socket|fetch failed|5\d\d/i.test(msg);
      if (!retryable || i === attempts) throw e;
      console.log(`  ⚠ ${label} 重试 ${i}...`);
      await new Promise(r => setTimeout(r, 3000 * i));
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

// Step 1: 找到 Global 系列
console.log('=== 所有 D15R 系列 ===');
const camps = await withRetry(() => customer.query(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status,
         campaign.bidding_strategy_type, campaign.bidding_strategy,
         campaign_budget.amount_micros
  FROM campaign WHERE campaign.name LIKE '%D15R%'
`), 'campaigns');
for (const c of camps) {
  console.log(`  [${c.campaign.id}] ${c.campaign.name} | status=${c.campaign.status} serving=${c.campaign.serving_status} | bid=${c.campaign.bidding_strategy_type} | budget=¥${(Number(c.campaign_budget?.amount_micros||0)/1e6).toFixed(0)}`);
  if (c.campaign.bidding_strategy) console.log(`      portfolio: ${c.campaign.bidding_strategy}`);
}

const global = camps.find(c => /global/i.test(c.campaign.name));
if (!global) { console.log('未找到 Global 系列'); process.exit(1); }
const CID = global.campaign.id;
console.log(`\n=== 诊断 Global: ${CID} ===\n`);

// Step 2: 近30天表现
const today = new Date(); const start = new Date(today.getTime() - 30 * 86400000);
const fmt = d => d.toISOString().slice(0, 10);
const DR = `segments.date BETWEEN '${fmt(start)}' AND '${fmt(today)}'`;

const perf = await withRetry(() => customer.query(`
  SELECT metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc,
         metrics.cost_micros, metrics.conversions, metrics.conversions_value
  FROM campaign WHERE campaign.id = ${CID} AND ${DR}
`), 'perf');
for (const r of perf) {
  const m = r.metrics;
  console.log(`近30天: 展示 ${m.impressions} | 点击 ${m.clicks} | CTR ${(Number(m.ctr)*100).toFixed(2)}% | CPC ¥${(Number(m.average_cpc)/1e6).toFixed(2)} | 花费 ¥${(Number(m.cost_micros)/1e6).toFixed(2)} | 转化 ${m.conversions}`);
}

// Step 3: 关键词（含匹配类型）
const kws = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
         ad_group_criterion.status, ad_group_criterion.cpc_bid_micros,
         metrics.impressions, metrics.clicks
  FROM keyword_view WHERE campaign.id = ${CID} AND ${DR}
`), 'keywords');
console.log(`\n关键词（近30天有数据的）:`);
for (const r of kws) {
  console.log(`  [${r.ad_group.name}] "${r.ad_group_criterion.keyword.text}" (${r.ad_group_criterion.keyword.match_type}) ${r.ad_group_criterion.status} | 展示 ${r.metrics.impressions} 点击 ${r.metrics.clicks}`);
}

// 全部关键词（不限时段）
const allKws = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
         ad_group_criterion.status
  FROM ad_group_criterion
  WHERE campaign.id = ${CID} AND ad_group_criterion.type = 'KEYWORD'
`), 'all keywords');
console.log(`\n全部关键词 (${allKws.length}):`);
for (const r of allKws) {
  const s = r.ad_group_criterion.status === 2 ? 'ENABLED' : r.ad_group_criterion.status === 3 ? 'PAUSED' : r.ad_group_criterion.status;
  console.log(`  [${r.ad_group.name}] "${r.ad_group_criterion.keyword.text}" (${r.ad_group_criterion.keyword.match_type}) ${s}`);
}

// Step 4: 广告
const ads = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.ad.responsive_search_ad.headlines
  FROM ad_group_ad WHERE campaign.id = ${CID}
`), 'ads');
console.log(`\n广告 (${ads.length}):`);
for (const r of ads) {
  const s = r.ad_group_ad.status === 2 ? 'ENABLED' : r.ad_group_ad.status === 3 ? 'PAUSED' : r.ad_group_ad.status;
  const h = (r.ad_group_ad.ad.responsive_search_ad?.headlines || []).map(x => x.text);
  console.log(`  [${r.ad_group.name}] AD ${r.ad_group_ad.ad.id} ${s} ${h.length}H | ${h.slice(0,5).join(' | ')}`);
}

// Step 5: 搜索词近30天
const terms = await withRetry(() => customer.query(`
  SELECT search_term_view.search_term, metrics.impressions, metrics.clicks, metrics.conversions
  FROM search_term_view WHERE campaign.id = ${CID} AND ${DR}
`), 'search terms');
console.log(`\n搜索词 Top 25 (近30天, 共${terms.length}条):`);
terms.sort((a,b) => Number(b.metrics.impressions) - Number(a.metrics.impressions));
for (const r of terms.slice(0, 25)) {
  console.log(`  "${r.search_term_view.search_term}" | 展示 ${r.metrics.impressions} 点击 ${r.metrics.clicks} 转化 ${r.metrics.conversions}`);
}

// Step 6: 地理定位
const geo = await withRetry(() => customer.query(`
  SELECT campaign_criterion.location.geo_target_constant, campaign_criterion.status
  FROM campaign_criterion
  WHERE campaign.id = ${CID} AND campaign_criterion.location.geo_target_constant IS NOT NULL
`), 'geo');
console.log(`\n地理定位:`);
for (const r of geo) console.log(`  ${r.campaign_criterion.location.geo_target_constant} (${r.campaign_criterion.status})`);
const lang = await withRetry(() => customer.query(`
  SELECT campaign_criterion.language.language_constant
  FROM campaign_criterion
  WHERE campaign.id = ${CID} AND campaign_criterion.language.language_constant IS NOT NULL
`), 'lang');
console.log(`语言: ${lang.map(r => r.campaign_criterion.language.language_constant).join(', ')}`);

// 通用系列诊断: node src/diag-campaign.mjs <campaign-name-正则> [天数=30]
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const PATTERN = process.argv[2] || 'C500';
const DAYS = Number(process.argv[3] || 30);

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

const camps = await withRetry(() => customer.query(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status,
         campaign.bidding_strategy_type, campaign.bidding_strategy,
         campaign_budget.amount_micros
  FROM campaign WHERE campaign.name LIKE '%${PATTERN}%'
`), 'campaigns');
for (const c of camps) {
  console.log(`[${c.campaign.id}] ${c.campaign.name} | status=${c.campaign.status} serving=${c.campaign.serving_status} | bid=${c.campaign.bidding_strategy_type} | budget=¥${(Number(c.campaign_budget?.amount_micros||0)/1e6).toFixed(0)}`);
  if (c.campaign.bidding_strategy) console.log(`   portfolio: ${c.campaign.bidding_strategy}`);
}
const camp = camps[0];
if (!camp) { console.log('未找到系列'); process.exit(1); }
const CID = camp.campaign.id;

const today = new Date(); const start = new Date(today.getTime() - DAYS * 86400000);
const fmt = d => d.toISOString().slice(0, 10);
const DR = `segments.date BETWEEN '${fmt(start)}' AND '${fmt(today)}'`;

const perf = await withRetry(() => customer.query(`
  SELECT metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc,
         metrics.cost_micros, metrics.conversions
  FROM campaign WHERE campaign.id = ${CID} AND ${DR}
`), 'perf');
for (const r of perf) {
  const m = r.metrics;
  console.log(`\n近${DAYS}天: 展示 ${m.impressions} | 点击 ${m.clicks} | CTR ${m.ctr != null ? (Number(m.ctr)*100).toFixed(2)+'%' : '-'} | CPC ¥${(Number(m.average_cpc)/1e6).toFixed(2)} | 花费 ¥${(Number(m.cost_micros)/1e6).toFixed(2)} | 转化 ${m.conversions}`);
}

const kws = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.status,
         metrics.impressions, metrics.clicks
  FROM keyword_view WHERE campaign.id = ${CID} AND ${DR}
`), 'keywords 30d');
console.log(`\n=== 关键词（近${DAYS}天有数据，按广告组）===`);
let lastG = '';
for (const r of kws.sort((a,b) => a.ad_group.name.localeCompare(b.ad_group.name))) {
  if (r.ad_group.name !== lastG) { console.log(`\n[${r.ad_group.name}]`); lastG = r.ad_group.name; }
  console.log(`  "${r.ad_group_criterion.keyword.text}" | 展示 ${r.metrics.impressions} 点击 ${r.metrics.clicks}`);
}

const ads = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.ad.responsive_search_ad.headlines
  FROM ad_group_ad WHERE campaign.id = ${CID}
`), 'ads');
console.log(`\n=== 广告 (${ads.length}) ===`);
for (const r of ads) {
  const s = r.ad_group_ad.status === 2 ? 'ENABLED' : r.ad_group_ad.status === 3 ? 'PAUSED' : r.ad_group_ad.status;
  const h = (r.ad_group_ad.ad.responsive_search_ad?.headlines || []).map(x => x.text);
  console.log(`  [${r.ad_group.name}] AD ${r.ad_group_ad.ad.id} ${s} ${h.length}H | ${h.slice(0,4).join(' | ')}`);
}

const terms = await withRetry(() => customer.query(`
  SELECT search_term_view.search_term, metrics.impressions, metrics.clicks, metrics.conversions
  FROM search_term_view WHERE campaign.id = ${CID} AND ${DR}
`), 'search terms');
console.log(`\n=== 搜索词 Top 25 (共${terms.length}条) ===`);
terms.sort((a,b) => Number(b.metrics.impressions) - Number(a.metrics.impressions));
for (const r of terms.slice(0, 25)) {
  console.log(`  "${r.search_term_view.search_term}" | 展示 ${r.metrics.impressions} 点击 ${r.metrics.clicks} 转化 ${r.metrics.conversions}`);
}

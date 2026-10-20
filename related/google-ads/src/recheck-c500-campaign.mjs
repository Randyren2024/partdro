// C500 - Search - Global (24316207812) 复查诊断
// 用法: node src/recheck-c500-campaign.mjs [天数=7]
// 背景: 2026-10-10 完成五步优化（启用+MaxClicks¥10上限 / 删17零展示词 / 加10词 / 补22负词 / 5组画像RSA）
// 输出: 按日期看优化前后转折 → 广告组+RSA → 关键词 → 搜索词质量（B2B vs 消费级配送）
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24316207812';
const OPT_DATE = '2026-10-10'; // 优化执行日
const DAYS = Number(process.argv[2] || 7);

async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /aborted|ECONNRESET|ETIMEDOUT|ECONNREFUSED|UND_ERR|timeout|premature|socket|fetch failed|5\d\d/i.test(msg);
      if (!retryable || i === attempts) throw e;
      console.log(`  ⚠ ${label} 第${i}次失败，重试...`);
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

const today = new Date();
const start = new Date(today.getTime() - DAYS * 86400000);
const fmt = d => d.toISOString().slice(0, 10);
const DATE_RANGE = `segments.date BETWEEN '${fmt(start)}' AND '${fmt(today)}'`;

// ============ Part 0: 系列状态确认 ============
console.log(`\n========== Part 0: 系列状态 ==========`);
const st = await withRetry(() => customer.query(`
  SELECT campaign.name, campaign.status, campaign.bidding_strategy_type,
         campaign.ai_max_setting.enable_ai_max
  FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}
`), '系列状态');
for (const r of st) {
  const s = r.campaign.status === 2 ? 'ENABLED ✅' : r.campaign.status === 3 ? 'PAUSED ⚠️' : String(r.campaign.status);
  console.log(`  [${r.campaign.name}] 状态: ${s} | 出价: ${r.campaign.bidding_strategy_type} | AI Max: ${r.campaign.ai_max_setting?.enable_ai_max ? 'ON' : 'OFF（待 3-5 天后开）'}`);
}

// ============ Part 1: 按日期看优化前后转折 ============
console.log(`\n========== Part 1: 逐日表现（近 ${DAYS} 天，优化日 ${OPT_DATE}）==========`);
const daily = await withRetry(() => customer.query(`
  SELECT segments.date, metrics.impressions, metrics.clicks, metrics.ctr,
         metrics.average_cpc, metrics.cost_micros, metrics.conversions
  FROM campaign WHERE campaign.id = ${CAMPAIGN_ID} AND ${DATE_RANGE}
  ORDER BY segments.date
`), '逐日表现');
if (!daily.length) {
  console.log('  （该时段无数据）');
} else {
  for (const r of daily) {
    const m = r.metrics;
    const mark = r.segments.date >= OPT_DATE ? ' ← 优化后' : '';
    const cost = Number(m.cost_micros) / 1e6;
    const ctr = m.ctr != null ? `${(Number(m.ctr) * 100).toFixed(2)}%` : '-';
    const cpc = Number(m.average_cpc) ? `¥${(Number(m.average_cpc) / 1e6).toFixed(2)}` : '-';
    console.log(`  ${r.segments.date} | 展示 ${String(m.impressions).padStart(6)} | 点击 ${String(m.clicks).padStart(4)} | CTR ${ctr} | CPC ${cpc} | 花费 ¥${cost.toFixed(2)} | 转化 ${m.conversions}${mark}`);
  }
}

// ============ Part 2: 广告组 + RSA（新 ENABLED vs 旧 PAUSED）============
console.log(`\n========== Part 2: 广告组 × RSA 表现（近 ${DAYS} 天）==========`);
const ads = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group.status, ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.ad.responsive_search_ad.headlines, metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions
  FROM ad_group_ad
  WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD' AND ${DATE_RANGE}
`), 'RSA 表现');
const ADG_RE = /Heavy Lift|Cargo|FlyCart|Industrial|Winch/i;
const byGroup = new Map();
for (const r of ads) {
  const gn = r.ad_group.name;
  if (!ADG_RE.test(gn)) continue; // 过滤无关广告组
  if (!byGroup.has(gn)) byGroup.set(gn, []);
  byGroup.get(gn).push(r);
}
for (const [gn, rows] of byGroup) {
  const gStatus = rows[0].ad_group.status === 2 ? 'ENABLED' : rows[0].ad_group.status === 3 ? 'PAUSED' : String(rows[0].ad_group.status);
  console.log(`\n  [${gn}] (广告组 ${gStatus})`);
  rows.sort((a, b) => Number(b.metrics.impressions) - Number(a.metrics.impressions));
  for (const r of rows) {
    const status = r.ad_group_ad.status === 2 ? 'ENABLED' : r.ad_group_ad.status === 3 ? 'PAUSED' : String(r.ad_group_ad.status);
    const m = r.metrics;
    const ctr = m.ctr != null ? `${(Number(m.ctr) * 100).toFixed(2)}%` : '-';
    const firstHl = r.ad_group_ad.ad.responsive_search_ad?.headlines?.[0]?.text || '?';
    console.log(`    ${status.padEnd(8)} "${firstHl.slice(0, 30)}" | 展示 ${String(m.impressions).padStart(6)} | 点击 ${String(m.clicks).padStart(4)} | CTR ${ctr} | 转化 ${m.conversions}`);
  }
}

// ============ Part 3: 关键词表现 ============
console.log(`\n========== Part 3: 关键词表现（近 ${DAYS} 天，仅 ENABLED）==========`);
const kws = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.status,
         metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions
  FROM keyword_view
  WHERE campaign.id = ${CAMPAIGN_ID} AND ${DATE_RANGE}
`), '关键词');
const active = kws.filter(r => r.ad_group_criterion.status === 2);
const zeroImp = active.filter(r => Number(r.metrics.impressions) === 0);
const serving = active.filter(r => Number(r.metrics.impressions) > 0).sort((a, b) => Number(b.metrics.impressions) - Number(a.metrics.impressions));
console.log(`  ENABLED 关键词 ${active.length} 个：有展示 ${serving.length} / 零展示 ${zeroImp.length}`);
for (const r of serving.slice(0, 20)) {
  const m = r.metrics;
  const ctr = m.ctr != null ? `${(Number(m.ctr) * 100).toFixed(2)}%` : '-';
  const cpc = Number(m.average_cpc) ? `¥${(Number(m.average_cpc) / 1e6).toFixed(2)}` : '-';
  console.log(`    [${r.ad_group.name}] ${r.ad_group_criterion.keyword.text.padEnd(38)} | 展示 ${String(m.impressions).padStart(6)} | 点击 ${String(m.clicks).padStart(4)} | CTR ${ctr} | CPC ${cpc}`);
}
if (zeroImp.length && zeroImp.length <= 20) {
  console.log(`  零展示词: ${zeroImp.map(r => r.ad_group_criterion.keyword.text).join(' | ')}`);
}

// ============ Part 4: 搜索词质量（B2B 重载意图 vs 消费级配送）============
console.log(`\n========== Part 4: 搜索词 Top 30（近 ${DAYS} 天）==========`);
const terms = await withRetry(() => customer.query(`
  SELECT search_term_view.search_term, ad_group.name,
         metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions
  FROM search_term_view
  WHERE campaign.id = ${CAMPAIGN_ID} AND ${DATE_RANGE}
`), '搜索词');
if (!terms.length) {
  console.log('  （暂无搜索词数据——Maximize Clicks 冷启动后 3~5 天会积累，明天再查）');
} else {
  terms.sort((a, b) => Number(b.metrics.impressions) - Number(a.metrics.impressions));
  for (const r of terms.slice(0, 30)) {
    const m = r.metrics;
    console.log(`  [${r.ad_group.name}] "${r.search_term_view.search_term}" | 展示 ${m.impressions} | 点击 ${m.clicks} | CTR ${(Number(m.ctr) * 100).toFixed(1)}% | 转化 ${m.conversions}`);
  }
  const B2B_RE = /commercial|industrial|construction|farm|agricultur|logistics|freight|cargo|timber|solar|telecom|winch|lifting|payload|business|company|enterprise/i;
  const CONSUMER_RE = /food|amazon|walmart|wing|zipline|prime air|personal|phone|toy|small drone for|camera/i;
  const b2b = terms.filter(r => B2B_RE.test(r.search_term_view.search_term));
  const consumer = terms.filter(r => CONSUMER_RE.test(r.search_term_view.search_term));
  console.log(`\n  B2B 信号词命中: ${b2b.length}/${terms.length} 条 | 消费级配送嫌疑: ${consumer.length} 条`);
  if (consumer.length) console.log(`  ⚠ 消费级嫌疑词: ${consumer.map(r => `"${r.search_term_view.search_term}"`).join(', ')} → 考虑加负词`);
}

console.log(`\n✅ 复查完成。优化才 1 天，属数据积累期：展示应已开始流入，搜索词 3-5 天后再评估质量。AI Max 待搜索词数据积累后开启。`);

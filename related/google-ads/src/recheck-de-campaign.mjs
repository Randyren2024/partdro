// D15R-DE 复查诊断：v2 vs v3 RSA 表现对比 + 搜索词报告
// 用法: node src/recheck-de-campaign.mjs [天数=7]
// 输出: 按广告组分组的 v1/v2/v3 广告表现 + 泛词搜索词质量（B2B vs 房主）
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';
const DAYS = Number(process.argv[2] || 7);

// 广告版本标签（v1=原始已暂停, v2=Reinigungsfirmen 视角, v3=集团扩展型画像）
const VERSION_BY_ID = {
  826885536705: 'v1', 827008493918: 'v1', 827008493972: 'v1',
  827399787341: 'v2', 827399830262: 'v2', 827274840408: 'v2',
  827402096774: 'v3', 827321463037: 'v3', 827321435038: 'v3',
};

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

// ============ Part 1: 广告表现（v2 vs v3 对比核心）============
console.log(`\n========== Part 1: RSA 表现对比（近 ${DAYS} 天）==========\n`);
const ads = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
         metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions
  FROM ad_group_ad
  WHERE campaign.id = ${CAMPAIGN_ID} AND ${DATE_RANGE}
`), '广告表现');

if (!ads.length) {
  console.log('（该时段无任何广告统计数据）');
} else {
  const byGroup = new Map();
  for (const r of ads) {
    const gn = r.ad_group.name;
    if (!byGroup.has(gn)) byGroup.set(gn, []);
    byGroup.get(gn).push(r);
  }
  for (const [gn, rows] of byGroup) {
    console.log(`\n[${gn}]`);
    rows.sort((a, b) => (VERSION_BY_ID[a.ad_group_ad.ad.id] || '?').localeCompare(VERSION_BY_ID[b.ad_group_ad.ad.id] || '?'));
    for (const r of rows) {
      const id = r.ad_group_ad.ad.id;
      const ver = VERSION_BY_ID[id] || '?';
      const status = r.ad_group_ad.status === 2 ? 'ENABLED' : r.ad_group_ad.status === 3 ? 'PAUSED' : String(r.ad_group_ad.status);
      const m = r.metrics;
      const cpc = m.average_cpc ? `¥${(Number(m.average_cpc) / 1e6).toFixed(2)}` : '-';
      const ctr = m.ctr != null ? `${(Number(m.ctr) * 100).toFixed(2)}%` : '-';
      console.log(`  ${ver} ${status.padEnd(8)} AD ${id} | 展示 ${String(m.impressions).padStart(6)} | 点击 ${String(m.clicks).padStart(4)} | CTR ${ctr} | CPC ${cpc} | 转化 ${m.conversions}`);
    }
    // 同组内 v2 vs v3 结论
    const v2 = rows.find(r => VERSION_BY_ID[r.ad_group_ad.ad.id] === 'v2' && r.ad_group_ad.status === 2);
    const v3 = rows.find(r => VERSION_BY_ID[r.ad_group_ad.ad.id] === 'v3' && r.ad_group_ad.status === 2);
    if (v2 && v3 && Number(v2.metrics.impressions) > 100 && Number(v3.metrics.impressions) > 100) {
      const winner = Number(v2.metrics.ctr) >= Number(v3.metrics.ctr) ? 'v2' : 'v3';
      console.log(`  → 判定: ${winner} CTR 更高 (v2 ${(Number(v2.metrics.ctr) * 100).toFixed(2)}% vs v3 ${(Number(v3.metrics.ctr) * 100).toFixed(2)}%)，可考虑暂停败者`);
    }
  }
}

// ============ Part 2: 系列整体 ============
console.log(`\n========== Part 2: 系列整体（近 ${DAYS} 天）==========\n`);
const camp = await withRetry(() => customer.query(`
  SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.ctr,
         metrics.average_cpc, metrics.cost_micros, metrics.conversions
  FROM campaign WHERE campaign.id = ${CAMPAIGN_ID} AND ${DATE_RANGE}
`), '系列整体');
for (const r of camp) {
  const m = r.metrics;
  const cost = Number(m.cost_micros) / 1e6;
  console.log(`[${r.campaign.name}]`);
  const ctr2 = m.ctr != null ? `${(Number(m.ctr) * 100).toFixed(2)}%` : '-';
  console.log(`  展示 ${m.impressions} | 点击 ${m.clicks} | CTR ${ctr2} | CPC ¥${(Number(m.average_cpc) / 1e6).toFixed(2)} | 花费 ¥${cost.toFixed(2)} | 转化 ${m.conversions}`);
  console.log(`  真实 CPA（花费/有效询盘）见 Supabase inquiries 表按日期筛选`);
}

// ============ Part 3: 搜索词质量（泛词进来的流量是 B2B 还是房主）============
console.log(`\n========== Part 3: 搜索词 Top 30（近 ${DAYS} 天）==========\n`);
const terms = await withRetry(() => customer.query(`
  SELECT search_term_view.search_term, ad_group.name,
         metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions
  FROM search_term_view
  WHERE campaign.id = ${CAMPAIGN_ID} AND ${DATE_RANGE}
`), '搜索词');
if (!terms.length) {
  console.log('（暂无搜索词数据——Maximize Clicks 冷启动后 3~5 天会积累）');
} else {
  terms.sort((a, b) => Number(b.metrics.impressions) - Number(a.metrics.impressions));
  for (const r of terms.slice(0, 30)) {
    const m = r.metrics;
    const cpc = m.average_cpc ? `¥${(Number(m.average_cpc) / 1e6).toFixed(2)}` : '-';
    console.log(`  [${r.ad_group.name}] "${r.search_term_view.search_term}" | 展示 ${m.impressions} | 点击 ${m.clicks} | CTR ${(Number(m.ctr) * 100).toFixed(1)}% | CPC ${cpc}`);
  }
  // B2B vs 消费者粗筛
  const B2B_RE = /firma|firmen|unternehmen|gewerb|dienstleistung|bau|immobilie|facility| OBJEKT/i;
  const b2b = terms.filter(r => B2B_RE.test(r.search_term_view.search_term));
  console.log(`\n  B2B 信号词命中: ${b2b.length}/${terms.length} 条搜索词含 firma/unternehmen/gewerblich 等`);
  console.log(`  提示: 泛词（solarpanel reinigen 等）流量以房主为主属预期；靠 'Drohne für Unternehmen' 文案 + 落地页筛选`);
}

console.log(`\n✅ 复查完成。若 v3 判定数据不足（展示<100），再等几天重跑: node src/recheck-de-campaign.mjs 7`);

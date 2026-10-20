// D15R - Search - DE 在 GA4 的互动与页面行为分析 — 2026-10-12
// 过滤: sessionSource/medium = google / cpc + sessionCampaignName 含 D15R - Search - DE
// 报告: ①总览 ②逐日趋势 ③落地页 ④页面浏览 Top ⑤事件拆解(scroll/click/视频/转化) ⑥滚动深度
import 'dotenv/config';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GA4_CLIENT_ID;
const CLIENT_SECRET = process.env.GA4_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GA4_REFRESH_TOKEN;
const ENV_PROPERTY = process.env.GA4_PROPERTY_ID || '';
const DAYS = 14; // 覆盖暂停期前后
const CAMPAIGN = 'D15R - Search - DE';

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: REFRESH_TOKEN });
const dataApi = google.analyticsdata({ version: 'v1beta', auth });

async function withRetry(fn, label, attempts = 4) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const status = e?.response?.status ?? e?.status;
      const retryable = (typeof status === 'number' && (status === 429 || status >= 500))
        || /hang up|ECONNRESET|ETIMEDOUT|UND_ERR|timeout|premature|fetch failed|socket|quota/i.test(String(e?.message || e));
      if (!retryable || i === attempts) break;
      await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
  throw last;
}

async function resolveProperty() {
  if (ENV_PROPERTY) return ENV_PROPERTY;
  const admin = google.analyticsadmin({ version: 'v1beta', auth });
  const { data } = await withRetry(() => admin.accounts.list({ pageSize: 200 }), 'accounts.list');
  for (const acc of data.accounts || []) {
    const { data: pd } = await withRetry(() => admin.properties.list({
      filter: `parent:${acc.name}`, pageSize: 200,
    }), 'properties.list');
    const props = (pd.properties || []).filter(p => p.propertyType !== 'PROPERTY_TYPE_SUBPROPERTY');
    if (props.length === 1) return props[0].name.split('/').pop();
    if (props.length > 1) {
      console.error('多个 GA4 属性，请在 ga4/.env 设 GA4_PROPERTY_ID:');
      props.forEach(p => console.error(`  ${p.name.split('/').pop()}  ${p.displayName}`));
      process.exit(2);
    }
  }
  console.error('未找到 GA4 属性');
  process.exit(2);
}

const campaignFilter = {
  andGroup: {
    expressions: [
      { filter: { fieldName: 'sessionSourceMedium', stringFilter: { matchType: 'EXACT', value: 'google / cpc' } } },
      { filter: { fieldName: 'sessionCampaignName', stringFilter: { matchType: 'EXACT', value: CAMPAIGN } } },
    ],
  },
};

async function runReport(propertyId, { dims, metrics, extraFilter, order, limit = 50 }) {
  const expressions = [campaignFilter];
  if (extraFilter) expressions.push(extraFilter);
  const realDims = dims.filter(n => n && n !== 'none');
  const { data } = await withRetry(() => dataApi.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'yesterday' }],
      dimensions: realDims.map(n => ({ name: n })),
      metrics: metrics.map(n => ({ name: n })),
      dimensionFilter: { andGroup: { expressions } },
      orderBys: order || (realDims[0] === 'date' ? [{ dimension: { dimensionName: 'date' } }] : undefined),
      limit,
    },
  }), 'runReport');
  return (data.rows || []).map(r => [
    ...(r.dimensionValues || []).map(v => v.value || '-'),
    ...r.metricValues.map(v => v.value || '0'),
  ]);
}

const pct = (n, d) => (d > 0 ? `${(n / d * 100).toFixed(1)}%` : '-');
const fmtDate = s => `${s.slice(4, 6)}-${s.slice(6)}`;
const pad = (s, n) => String(s ?? '').padEnd(n);

const prop = await resolveProperty();
console.log(`\n=== GA4 互动分析: ${CAMPAIGN} | 近 ${DAYS} 天 (${DAYS}daysAgo ~ yesterday) | 属性 ${prop} ===`);
console.log('（口径: google/cpc 会话 + 该系列名；GA4 数据有延迟，昨天为部分数据）\n');

// ① 先列出 GA4 里实际存在的系列名（验证 EXACT 匹配是否命中）
const campRows = await runReport(prop, {
  dims: ['sessionCampaignName'], metrics: ['sessions'],
  extraFilter: { filter: { fieldName: 'sessionSourceMedium', stringFilter: { matchType: 'EXACT', value: 'google / cpc' } } },
  limit: 20,
});
console.log('--- 0. 近 14 天 google/cpc 全部系列 ---');
campRows.forEach(r => console.log(`  ${pad(r[0], 40)} 会话 ${r[1]}`));
const hit = campRows.find(r => r[0] === CAMPAIGN);
if (!hit) {
  console.log(`\n⚠ 未找到精确系列名 "${CAMPAIGN}"，请对照上表实际名称调整脚本后重跑`);
  process.exit(0);
}

// ② 会话级总览
const ov = (await runReport(prop, {
  dims: ['none'], metrics: ['sessions', 'engagedSessions', 'bounceRate', 'averageSessionDuration'],
}))[0];
// ③ 事件级总览（页面浏览 + 互动时长 + 关键事件）
const ev0 = (await runReport(prop, {
  dims: ['none'], metrics: ['screenPageViews', 'userEngagementDuration', 'keyEvents'],
}))[0];
const sessions = +ov[0], engaged = +ov[1];
const pageviews = +ev0[0], engSec = +ev0[1], keyEvents = +ev0[2];
console.log('\n--- 1. 总览（14 天） ---');
console.log(`  会话 ${sessions} | 互动会话 ${engaged} | 互动率 ${pct(engaged, sessions)}`);
console.log(`  跳出率 ${(parseFloat(ov[2]) * 100).toFixed(1)}% | 平均会话时长 ${Math.round(parseFloat(ov[3]))}s`);
console.log(`  页面浏览 ${pageviews}（人均 ${(pageviews / sessions).toFixed(1)} 页/会话）`);
console.log(`  总互动时长 ${Math.round(engSec)}s（折 ${(engSec / sessions).toFixed(0)}s/会话）`);
console.log(`  关键事件 keyEvents ${keyEvents}`);

// ④ 逐日趋势
const daily = await runReport(prop, {
  dims: ['date'], metrics: ['sessions', 'engagedSessions', 'bounceRate'],
});
console.log('\n--- 2. 逐日趋势（会话/互动会话/互动率） ---');
daily.forEach(r => console.log(`  ${fmtDate(r[0])}   ${pad(r[1], 6)} ${pad(r[2], 6)} ${pct(+r[2], +r[1])}`));

// ⑤ 落地页
const lp = await runReport(prop, {
  dims: ['landingPage'], metrics: ['sessions', 'engagedSessions', 'bounceRate'],
});
console.log('\n--- 3. 落地页（会话/互动率/跳出率） ---');
lp.forEach(r => console.log(`  ${pad(r[0], 44)} ${pad(r[1], 5)} ${pad(pct(+r[2], +r[1]), 8)} ${(parseFloat(r[3]) * 100).toFixed(0)}%`));

// ⑥ 页面浏览 Top
const pages = await runReport(prop, {
  dims: ['pagePath'], metrics: ['screenPageViews'], limit: 12,
});
console.log('\n--- 4. 页面浏览 Top 12 ---');
pages.forEach(r => console.log(`  ${pad(r[0], 48)} ${r[1]}`));

// ⑦ 事件拆解
const ev = await runReport(prop, { dims: ['eventName'], metrics: ['eventCount'], limit: 40 });
console.log('\n--- 5. 事件拆解（全部，按量排序） ---');
ev.forEach(r => console.log(`  ${pad(r[0], 40)} ${r[1]}`));

// ⑧ 滚动深度（percentScrolled 为自定义维度，未注册则跳过）
try {
  const sc = await runReport(prop, {
    dims: ['percentScrolled'], metrics: ['eventCount'],
    extraFilter: { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'scroll' } } },
  });
  console.log('\n--- 6. 滚动深度（scroll 事件分布） ---');
  sc.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  sc.forEach(r => console.log(`  ${pad(r[0] + '%', 8)} ${r[1]}`));
} catch (e) {
  console.log('\n--- 6. 滚动深度 ---\n  （percentScrolled 自定义维度未注册，跳过）');
}

// ⑨ keyEvents 到底是什么事件（有些属性把 session_start 误标为关键事件）
try {
  const ke = await runReport(prop, { dims: ['eventName'], metrics: ['keyEvents'], limit: 20 });
  console.log('\n--- 7. keyEvents 按事件名分布 ---');
  if (ke.length) ke.forEach(r => console.log(`  ${pad(r[0], 40)} ${r[1]}`));
  else console.log('  无 keyEvents');
} catch (e) {
  console.log('\n--- 7. keyEvents 按事件名分布 ---\n  （keyEvents 指标不可用，跳过）');
}

console.log('\n✅ 分析完成');

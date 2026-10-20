// Google Search Console API 工具集
//   node src/gsc.mjs sites
//   node src/gsc.mjs inspect <页面URL>
//   node src/gsc.mjs analytics --days 28 --dim query --limit 25
//   node src/gsc.mjs sitemaps
//   node src/gsc.mjs submit https://www.droneworld.tech/sitemap.xml
//   node src/gsc.mjs report
import 'dotenv/config';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GSC_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET || process.env.GOOGLE_ADS_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;
let SITE_URL = process.env.GSC_SITE_URL || '';

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('缺少 GSC_CLIENT_ID / GSC_CLIENT_SECRET / GSC_REFRESH_TOKEN（先运行 npm run auth）');
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: REFRESH_TOKEN });
const sc = google.searchconsole({ version: 'v1', auth });

async function withRetry(fn, label, attempts = 4) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      if (!/hang up|ECONNRESET|ETIMEDOUT|UND_ERR|timeout|premature|fetch failed|socket|5\d\d|429|quota/i.test(msg) || i === attempts) break;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 80)})，${wait / 1000}s 后重试...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const ymd = (d) => d.toISOString().slice(0, 10);
const pct = (n) => `${(n * 100).toFixed(2)}%`;

async function resolveSite() {
  if (SITE_URL) return SITE_URL;
  const { data } = await withRetry(() => sc.sites.list(), 'sites.list');
  const sites = (data.siteEntry || []).map((s) => s.siteUrl);
  if (!sites.length) { console.error('该账号在 GSC 下没有已验证属性'); process.exit(2); }
  SITE_URL = sites.find((s) => s.startsWith('sc-domain:')) || sites[0];
  console.log(`（未指定 GSC_SITE_URL，自动选用：${SITE_URL}）`);
  return SITE_URL;
}

async function cmdSites() {
  const { data } = await withRetry(() => sc.sites.list(), 'sites.list');
  console.log('\n已验证的 GSC 属性：');
  (data.siteEntry || []).forEach((s) => console.log(`  ${s.siteUrl}  [${s.permissionLevel}]`));
}

async function cmdInspect() {
  const url = process.argv[3];
  if (!url) { console.error('用法: node src/gsc.mjs inspect <页面URL>'); process.exit(1); }
  const siteUrl = await resolveSite();
  const { data } = await withRetry(() => sc.urlInspection.index.inspect({
    requestBody: { inspectionUrl: url, siteUrl },
  }), 'urlInspection');
  const r = data.inspectionResult || {};
  const ix = r.indexStatusResult || {};
  console.log(`\n=== URL 检查: ${url} ===`);
  console.log(`  verdict        : ${ix.verdict}`);
  console.log(`  coverageState  : ${ix.coverageState}`);
  console.log(`  indexingState  : ${ix.indexingState}`);
  console.log(`  pageFetchState : ${ix.pageFetchState}`);
  console.log(`  robotsTxtState : ${ix.robotsTxtState}`);
  console.log(`  lastCrawlTime  : ${ix.lastCrawlTime || '-'}`);
  console.log(`  googleCanonical: ${ix.googleCanonical || '-'}`);
  console.log(`  userCanonical  : ${ix.userCanonical || '-'}`);
  console.log(`  crawledAs      : ${ix.crawledAs || '-'}`);
  if (ix.sitemaps?.length) console.log(`  sitemaps       : ${ix.sitemaps.join(', ')}`);
  if (r.richResultsResult?.detectedItems?.length) {
    console.log('  rich results   :');
    r.richResultsResult.detectedItems.forEach((d) => console.log(`    - ${d.richResultType} (${d.items?.length || 0})`));
  }
  if (r.mobileUsabilityResult?.verdict) console.log(`  mobile         : ${r.mobileUsabilityResult.verdict}`);
  console.log(`\n  详情: ${r.inspectionResultLink || '-'}`);
}

async function analytics(dim, days, limit) {
  const siteUrl = await resolveSite();
  const end = new Date(Date.now() - 2 * 864e5); // GSC 数据延迟 ~2 天
  const start = new Date(end.getTime() - (days - 1) * 864e5);
  const { data } = await withRetry(() => sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: ymd(start),
      endDate: ymd(end),
      dimensions: [dim],
      rowLimit: limit,
      dataState: 'final',
    },
  }), 'searchanalytics');
  const rows = data.rows || [];
  console.log(`\n=== 搜索表现 ${ymd(start)} ~ ${ymd(end)} | 维度: ${dim} | ${siteUrl} ===`);
  if (!rows.length) { console.log('  无数据（站点可能刚上线或尚无展示）'); return []; }
  console.log(`  ${dim.padEnd(46)} 点击  展示    CTR     平均排名`);
  rows.forEach((r) => {
    const k = (r.keys?.[0] || '').slice(0, 45);
    console.log(`  ${k.padEnd(46)} ${String(r.clicks).padStart(4)} ${String(r.impressions).padStart(6)} ${pct(r.ctr).padStart(7)} ${r.position.toFixed(1).padStart(6)}`);
  });
  const t = rows.reduce((a, r) => ({ c: a.c + r.clicks, i: a.i + r.impressions }), { c: 0, i: 0 });
  console.log(`  ---- 合计: 点击 ${t.c} / 展示 ${t.i} ----`);
  return rows;
}

async function cmdAnalytics() {
  await analytics(arg('dim', 'query'), parseInt(arg('days', '28'), 10), parseInt(arg('limit', '25'), 10));
}

async function cmdSitemaps() {
  const siteUrl = await resolveSite();
  const { data } = await withRetry(() => sc.sitemaps.list({ siteUrl }), 'sitemaps.list');
  console.log(`\n=== 站点地图 (${siteUrl}) ===`);
  const list = data.sitemap || [];
  if (!list.length) { console.log('  未提交任何站点地图'); return; }
  list.forEach((s) => {
    console.log(`  ${s.path}`);
    console.log(`    最后下载: ${s.lastDownloaded || '-'}  错误: ${s.errors ?? 0}  警告: ${s.warnings ?? 0}`);
    (s.contents || []).forEach((c) => console.log(`    类型 ${c.type}: 已提交 ${c.submitted} / 已收录 ${c.indexed ?? '-'}`));
  });
}

async function cmdSubmit() {
  const feed = process.argv[3] || 'https://www.droneworld.tech/sitemap.xml';
  const siteUrl = await resolveSite();
  await withRetry(() => sc.sitemaps.submit({ siteUrl, feedpath: feed }), 'sitemaps.submit');
  console.log(`\n✓ 已提交站点地图: ${feed}`);
}

async function cmdReport() {
  await cmdSites();
  const days = parseInt(arg('days', '28'), 10);
  const q = await analytics('query', days, 50);
  await analytics('page', days, 25);
  await cmdSitemaps();
  const opps = (q || []).filter((r) => r.impressions >= 10 && r.position >= 4 && r.position <= 20 && r.ctr < 0.03);
  if (opps.length) {
    console.log('\n=== SEO 机会（有展示、排名 4-20、CTR<3% → 优化标题/描述/内链） ===');
    opps.forEach((r) => console.log(`  "${r.keys[0]}"  展示 ${r.impressions}  排名 ${r.position.toFixed(1)}  CTR ${pct(r.ctr)}`));
  }
}

const cmds = {
  sites: cmdSites,
  inspect: cmdInspect,
  analytics: cmdAnalytics,
  sitemaps: cmdSitemaps,
  submit: cmdSubmit,
  report: cmdReport,
};
const cmd = process.argv[2] || 'report';
if (!cmds[cmd]) { console.error(`未知命令: ${cmd}\n可用: ${Object.keys(cmds).join(', ')}`); process.exit(1); }
await cmds[cmd]();
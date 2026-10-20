// GSC 收录状态批量巡检：一次性看完全站（含多语言）URL 的收录进度
//
//   node src/audit-urls.mjs                  # 巡检导航页 + 产品页（× 4 语言），打印进度表
//   node src/audit-urls.mjs --all            # 连同 /news/<slug> 文章页一起巡检
//   node src/audit-urls.mjs --save           # 同时把快照写入 snapshots/audit-<日期>.json
//   node src/audit-urls.mjs --diff           # 与最近一次快照对比，标出状态变化
//   node src/audit-urls.mjs --diff <文件>    # 与指定快照对比
//   node src/audit-urls.mjs <url> [<url>…]   # 只巡检指定 URL
//
// 清单默认取自线上 sitemap.xml，新增产品页会自动纳入。
import 'dotenv/config';
import { google } from 'googleapis';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CLIENT_ID = process.env.GSC_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET || process.env.GOOGLE_ADS_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;
let SITE_URL = process.env.GSC_SITE_URL || '';
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('缺少 GSC_CLIENT_ID / GSC_CLIENT_SECRET / GSC_REFRESH_TOKEN（先运行 npm run auth）');
  process.exit(1);
}

const ORIGIN = 'https://www.droneworld.tech';
const SNAPSHOT_DIR = resolve(process.cwd(), 'snapshots');
const CONCURRENCY = 4;
const INCLUDE_NEWS = process.argv.includes('--all');
const SAVE = process.argv.includes('--save');
const DIFF_AT = process.argv.indexOf('--diff');
const DIFF_FILE = DIFF_AT > -1 ? process.argv[DIFF_AT + 1] : null;
const urlArgs = process.argv.slice(2).filter((a) => /^https?:\/\//.test(a));

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: REFRESH_TOKEN });
const sc = google.searchconsole({ version: 'v1', auth });

async function withRetry(fn, label, attempts = 4) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /hang up|ECONNRESET|ETIMEDOUT|UND_ERR|timeout|premature|fetch failed|socket|5\d\d|429|quota/i.test(msg);
      if (!retryable || i === attempts) break;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 70)})，${wait / 1000}s 后重试…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}

async function resolveSite() {
  if (SITE_URL) return SITE_URL;
  const { data } = await withRetry(() => sc.sites.list(), 'sites.list');
  const sites = (data.siteEntry || []).map((s) => s.siteUrl);
  if (!sites.length) {
    console.error('该账号在 GSC 下没有已验证属性');
    process.exit(2);
  }
  SITE_URL = sites.find((s) => s.startsWith('sc-domain:')) || sites[0];
  console.log(`（未指定 GSC_SITE_URL，自动选用：${SITE_URL}）`);
  return SITE_URL;
}

/** 从线上 sitemap.xml 取清单；不可用时回退到内置的导航页 × 4 语言 */
async function collectUrls() {
  if (urlArgs.length) return urlArgs;
  const fallback = () => {
    const routes = ['/', '/products', '/cases', '/news', '/documents', '/about', '/contact'];
    const out = [];
    for (const route of routes) {
      out.push(`${ORIGIN}${route}`);
      for (const l of ['es', 'de', 'fr']) out.push(`${ORIGIN}/${l}${route === '/' ? '' : route}`);
    }
    return out;
  };
  try {
    const res = await fetch(`${ORIGIN}/sitemap.xml`, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    if (!locs.length) throw new Error('sitemap 里没有 <loc>');
    const filtered = INCLUDE_NEWS ? locs : locs.filter((u) => !/\/news\/[^/]+$/.test(u));
    console.log(`[audit] sitemap 共 ${locs.length} 条，本次巡检 ${filtered.length} 条${INCLUDE_NEWS ? '' : '（未含新闻文章，加 --all 纳入）'}`);
    return filtered;
  } catch (e) {
    console.warn(`[audit] sitemap 读取失败(${e.message})，改用内置清单`);
    return fallback();
  }
}

/** 归一化成便于阅读和比对的状态桶 */
function bucket(verdict, coverageState) {
  if (coverageState === 'Submitted and indexed') return 'INDEXED';
  if (coverageState === 'Discovered - currently not indexed') return 'DISCOVERED';
  if (coverageState === 'URL is unknown to Google') return 'UNKNOWN';
  if (!coverageState || coverageState === 'URL is unknown to Google') return 'UNKNOWN';
  return verdict === 'PASS' ? 'INDEXED*' : String(coverageState || '?').toUpperCase().replace(/[\s-]+/g, '_');
}

async function inspectOne(url, siteUrl) {
  try {
    const { data } = await withRetry(
      () => sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: url, siteUrl } }),
      `inspect ${url}`,
    );
    const ix = (data.inspectionResult || {}).indexStatusResult || {};
    return {
      url,
      verdict: ix.verdict || '-',
      coverageState: ix.coverageState || '-',
      bucket: bucket(ix.verdict, ix.coverageState),
      indexingState: ix.indexingState || '-',
      lastCrawlTime: ix.lastCrawlTime || '-',
      googleCanonical: ix.googleCanonical || '-',
      userCanonical: ix.userCanonical || '-',
      ok: true,
    };
  } catch (e) {
    return { url, verdict: '-', coverageState: `ERROR: ${String(e.message).slice(0, 60)}`, bucket: 'ERROR', ok: false };
  }
}

/** 小并发池：URL Inspection API 有分钟级配额，别打太猛 */
async function inspectAll(urls, siteUrl) {
  const results = new Array(urls.length);
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const i = next++;
      results[i] = await inspectOne(urls[i], siteUrl);
      const r = results[i];
      console.log(`  ${String(i + 1).padStart(3)}/${urls.length}  ${r.bucket.padEnd(10)} ${urls[i].replace(ORIGIN, '')}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return results;
}

const pad = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s).padEnd(n));

function printTable(results) {
  console.log(`\n=== 收录进度（${results.length} 条）===`);
  console.log(`  ${pad('路径', 40)} ${pad('状态', 12)} ${pad('coverageState', 34)} ${pad('最后抓取', 21)} googleCanonical`);
  const sorted = [...results].sort((a, b) =>
    a.url.replace(ORIGIN, '').localeCompare(b.url.replace(ORIGIN, '')),
  );
  for (const r of sorted) {
    console.log(
      `  ${pad(r.url.replace(ORIGIN, ''), 40)} ${pad(r.bucket, 12)} ${pad(r.coverageState ?? '-', 34)} ${pad(r.lastCrawlTime ?? '-', 21)} ${(r.googleCanonical ?? '-').replace(ORIGIN, '')}`,
    );
  }
  const tally = {};
  for (const r of results) tally[r.bucket] = (tally[r.bucket] || 0) + 1;
  console.log('\n--- 汇总 ---');
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${pad(k, 14)} ${v}`);
  const pending = results.filter((r) => r.bucket !== 'INDEXED').map((r) => r.url);
  if (pending.length) {
    console.log('\n--- 尚未收录（可在 GSC UI 逐个 Request Indexing）---');
    pending.forEach((u) => console.log(`  ${u}`));
  }
}

function snapshotPath(d = new Date()) {
  return join(SNAPSHOT_DIR, `audit-${d.toISOString().slice(0, 10)}.json`);
}

function saveSnapshot(results) {
  if (!existsSync(SNAPSHOT_DIR)) mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const path = snapshotPath();
  const payload = {
    generatedAt: new Date().toISOString(),
    site: SITE_URL,
    results: Object.fromEntries(
      results.map((r) => [r.url, { bucket: r.bucket, verdict: r.verdict, coverageState: r.coverageState, lastCrawlTime: r.lastCrawlTime }]),
    ),
  };
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n[audit] 快照已写入 ${path}`);
}

function latestSnapshot() {
  if (!existsSync(SNAPSHOT_DIR)) return null;
  const files = readdirSync(SNAPSHOT_DIR).filter((f) => /^audit-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  return files.length ? join(SNAPSHOT_DIR, files[files.length - 1]) : null;
}

function printDiff(results, file) {
  const path = file || latestSnapshot();
  if (!path || !existsSync(path)) {
    console.log('\n[audit] 没有可对比的历史快照（先跑一次 --save）');
    return;
  }
  const prev = JSON.parse(readFileSync(path, 'utf8'));
  console.log(`\n=== 与快照对比：${path}（${prev.generatedAt}） ===`);
  const rank = { UNKNOWN: 0, DISCOVERED: 1, INDEXED: 2, 'INDEXED*': 2 };
  let changed = 0;
  for (const r of results) {
    const before = prev.results?.[r.url];
    if (!before) {
      console.log(`  [新增]   ${r.url.replace(ORIGIN, '')}  → ${r.bucket}`);
      changed++;
      continue;
    }
    if (before.bucket === r.bucket) continue;
    const dir = (rank[r.bucket] ?? 1) > (rank[before.bucket] ?? 1) ? '↑ 改善' : (rank[r.bucket] ?? 1) < (rank[before.bucket] ?? 1) ? '↓ 退化' : '→ 变化';
    console.log(`  [${dir}] ${r.url.replace(ORIGIN, '')}  ${before.bucket} → ${r.bucket}`);
    changed++;
  }
  if (!changed) console.log('  无变化');
  else console.log(`\n  共 ${changed} 条发生变化`);
}

async function main() {
  const siteUrl = await resolveSite();
  const urls = await collectUrls();
  console.log(`[audit] 开始巡检 ${urls.length} 条…`);
  const results = await inspectAll(urls, siteUrl);
  printTable(results);
  if (SAVE) saveSnapshot(results);
  if (DIFF_AT > -1) printDiff(results, DIFF_FILE);
}

await main();
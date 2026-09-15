import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

// PullPush.io 公开 API 抓取 Reddit 帖子 —— 针对 D15R window cleaning drone 的市场调研
// 用法:
//   node scripts/fetch-reddit-d15r.mjs
//   node scripts/fetch-reddit-d15r.mjs --per-query 200 --comments
//   node scripts/fetch-reddit-d15r.mjs --subreddit drones --out data/reddit_d15r.json

const QUERIES = [
  '"window cleaning drone"',
  '"drone window cleaning"',
  '"window washing drone"',
  '"window cleaner drone"',
  '"facade cleaning drone"',
  '"building cleaning drone"',
  '"solar panel cleaning drone"',
  '"drone pressure washing"',
  '"drone power washing"',
  '"D15R"',
  '"JIUSI"',
];

// 本地相关性兜底过滤（PullPush 对引号短语支持不稳定）
const CLEANING_TERMS = [
  'window clean', 'window wash', 'facade clean', 'building clean',
  'glass clean', 'solar panel clean', 'pv panel clean', 'pressure wash',
  'power wash', 'cleaning drone', 'drone clean', 'clean drone',
];
const SUBJECT_TERMS = ['drone', 'uav'];

const API = 'https://api.pullpush.io/reddit/search/';
const UA = { 'User-Agent': 'partdro-market-research/1.0 (node script)' };

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const perQuery = parseInt(arg('per-query', '100'), 10);
const subreddit = arg('subreddit', '');
const outFile = arg('out', 'data/reddit_d15r.json');
const includeComments = args.includes('--comments');
const only = arg('only', '');          // --only "D15R|JIUSI" 只跑指定查询（配合 --merge 续抓）
const merge = args.includes('--merge'); // --merge 读取已有输出文件，增量合并
const queries = only ? only.split('|').map(s => s.trim()).filter(Boolean) : QUERIES;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getJSON(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (res.ok) return await res.json();
      if (res.status === 429 || res.status >= 500) {
        console.warn(`  HTTP ${res.status}, retry ${i + 1}/${tries}...`);
        await sleep(10000 * (i + 1));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(10000 * (i + 1));
    }
  }
  return [];
}

function buildUrl(kind, q, before, sub) {
  const p = new URLSearchParams({
    q,
    size: '100',
    sort: 'desc',
    sort_type: 'created_utc',
  });
  if (sub) p.set('subreddit', sub);
  if (before) p.set('before', String(before));
  return `${API}${kind}/?${p.toString()}`;
}

async function searchKind(kind, q, sub, limit) {
  const out = [];
  let before = null;
  while (out.length < limit) {
    const json = await getJSON(buildUrl(kind, q, before, sub));
    const batch = Array.isArray(json) ? json : (json?.data ?? []);
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    const times = batch.map(d => d.created_utc).filter(v => typeof v === 'number');
    if (times.length === 0) break;
    before = Math.min(...times) - 1;
    if (batch.length < 100) break;
    await sleep(1500);
  }
  return out.slice(0, limit);
}

function textOf(p) {
  return `${p.title || ''} ${p.selftext || p.body || ''}`.toLowerCase();
}

function relevant(p) {
  const t = textOf(p);
  if (t.includes('d15r') || t.includes('jiusi')) return true;
  return SUBJECT_TERMS.some(w => t.includes(w)) && CLEANING_TERMS.some(w => t.includes(w));
}

function normalizeSubmission(p) {
  return {
    id: p.id,
    title: p.title ?? '',
    selftext: p.selftext ?? '',
    subreddit: p.subreddit ?? '',
    author: p.author ?? '',
    created_utc: p.created_utc ?? null,
    created_iso: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
    score: p.score ?? 0,
    num_comments: p.num_comments ?? 0,
    permalink: p.permalink ? `https://www.reddit.com${p.permalink}` : '',
    url: p.url ?? '',
    over_18: p.over_18 ?? false,
  };
}

function normalizeComment(c) {
  return {
    id: c.id,
    body: c.body ?? '',
    subreddit: c.subreddit ?? '',
    author: c.author ?? '',
    created_utc: c.created_utc ?? null,
    created_iso: c.created_utc ? new Date(c.created_utc * 1000).toISOString() : null,
    score: c.score ?? 0,
    link_id: c.link_id ?? '',
    permalink: c.permalink ? `https://www.reddit.com${c.permalink}` : '',
  };
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function collect(kind, map, normalizer) {
  for (const q of QUERIES) {
    console.log(`Searching ${kind}s: ${q}`);
    let items = [];
    try {
      items = await searchKind(kind, q, subreddit, perQuery);
    } catch (e) {
      console.warn(`  failed: ${e.message}`);
    }
    let kept = 0;
    for (const p of items) {
      if (!p || map.has(p.id) || !relevant(p)) continue;
      map.set(p.id, normalizer(p));
      kept++;
    }
    console.log(`  fetched ${items.length}, kept ${kept}, unique total: ${map.size}`);
    await sleep(5000);
  }
}

let existing = null;
if (merge && existsSync(outFile)) {
  existing = JSON.parse(readFileSync(outFile, 'utf8'));
  console.log(`Merging with existing ${outFile} (${existing.submissions?.length ?? 0} submissions)`);
}
const submissions = new Map((existing?.submissions ?? []).map(s => [s.id, s]));
const comments = new Map((existing?.comments ?? []).map(c => [c.id, c]));
await collect('submission', submissions, normalizeSubmission);
if (includeComments) {
  await collect('comment', comments, normalizeComment);
}

const result = {
  fetched_at: new Date().toISOString(),
  source: 'pullpush',
  queries: QUERIES,
  subreddit_filter: subreddit || null,
  submissions: [...submissions.values()],
  comments: includeComments ? [...comments.values()] : undefined,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(`\nSaved JSON -> ${outFile}`);

const csvPath = outFile.replace(/\.json$/, '.csv');
const header = 'id,created_iso,subreddit,score,num_comments,author,title,permalink,selftext';
const rows = result.submissions.map(s =>
  [s.id, s.created_iso, s.subreddit, s.score, s.num_comments, s.author, s.title, s.permalink, s.selftext]
    .map(csvCell).join(',')
);
writeFileSync(csvPath, '\uFEFF' + header + '\n' + rows.join('\n'));
console.log(`Saved CSV  -> ${csvPath}`);

const subs = result.submissions;
console.log(`\n=== Summary: ${subs.length} submissions ===`);
const bySub = {};
for (const s of subs) bySub[s.subreddit] = (bySub[s.subreddit] || 0) + 1;
console.log('Top subreddits:');
for (const [name, n] of Object.entries(bySub).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  r/${name}: ${n}`);
}
if (subs.length) {
  const times = subs.map(s => s.created_utc).filter(v => typeof v === 'number');
  console.log(`Date range: ${new Date(Math.min(...times) * 1000).toISOString()} -> ${new Date(Math.max(...times) * 1000).toISOString()}`);
  console.log('\nTop 10 by score:');
  for (const s of [...subs].sort((a, b) => b.score - a.score).slice(0, 10)) {
    console.log(`  [${s.score}] ${s.title} (r/${s.subreddit})`);
  }
}

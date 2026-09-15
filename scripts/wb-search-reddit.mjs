// 通过 Kimi WebBridge 抓取 Reddit 搜索 JSON —— 短语查询 + 相关性过滤
// 用法: node scripts/wb-search-reddit.mjs
//   可选: --queries 5   只跑前5个查询
//   可选: --no-merge    不合并进 reddit_d15r.json
//   可选: --time all    时间范围: hour/day/week/month/year/all (默认 year)
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';

const DAEMON = 'http://127.0.0.1:10086/command';
const SESSION = 'reddit-search';
const OUT = 'data/reddit_d15r_search.json';
const MERGE_FILE = 'data/reddit_d15r.json';

// 短语查询（带引号强制精确匹配）+ 单独的 subreddit 限定搜索
const QUERIES = [
  '"window cleaning drone"',
  '"window washing drone"',
  '"drone window cleaning"',
  '"drone window washing"',
  '"drone pressure washing"',
  '"drone power washing"',
  '"drone soft wash"',
  '"facade cleaning drone"',
  '"building cleaning drone"',
  '"roof cleaning drone"',
  '"gutter cleaning drone"',
  '"solar panel cleaning drone"',
  '"drone cleaning service"',
  '"cleaning drone business"',
  '"drone cleaning"',
  '"Aerones" drone',
  '"Lucid Bots"',
  '"LucidBots"',
  '"JIUSI" drone',
];

// 相关性过滤：标题或文本必须同时包含 drone/uav 词和 cleaning 词
const CLEANING_TERMS = [
  'window clean', 'window wash', 'facade clean', 'building clean',
  'glass clean', 'solar panel clean', 'pv panel clean', 'pressure wash',
  'power wash', 'soft wash', 'cleaning drone', 'drone clean', 'clean drone',
  'roof clean', 'gutter clean', 'washing drone', 'drone washing',
  'drone pressure', 'drone power', 'drone soft', 'drone cleaning',
  'clean drone', 'drone wash', 'wash drone',
];
const SUBJECT_TERMS = ['drone', 'uav'];
const BRAND_TERMS = ['jiusi', 'aerones', 'lucid bot', 'lucidbot'];

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const maxQueries = parseInt(arg('queries', String(QUERIES.length)), 10);
const timeRange = arg('time', 'year');
const doMerge = !args.includes('--no-merge');
const queries = QUERIES.slice(0, maxQueries);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function cmd(action, args) {
  const body = JSON.stringify({ action, args, session: SESSION });
  const res = await fetch(DAEMON, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`daemon HTTP ${res.status}`);
  return res.json();
}

// 在浏览器上下文内 fetch Reddit JSON API —— 利用用户 cookies 避免 rate limit
function makeFetchCode(query, time) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=${time}&limit=100&raw_json=1`;
  // 内联常量到浏览器代码，避免引用 Node.js 变量
  const subjectTerms = JSON.stringify(SUBJECT_TERMS);
  const brandTerms = JSON.stringify(BRAND_TERMS);
  return `(async () => {
    const SUBJECT_TERMS = ${subjectTerms};
    const BRAND_TERMS = ${brandTerms};
    try {
      const res = await fetch('${url}', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return JSON.stringify({ error: 'HTTP ' + res.status, url: '${url}' });
      const data = await res.json();
      const children = data?.data?.children ?? [];
      const posts = children.map(c => c?.data).filter(d => d).map(d => ({
        id: d.id || '',
        title: d.title || '',
        selftext: (d.selftext || '').slice(0, 500),
        subreddit: d.subreddit || '',
        author: d.author || '',
        created_utc: d.created_utc || null,
        created_iso: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
        score: d.score || 0,
        num_comments: d.num_comments || 0,
        permalink: d.permalink ? 'https://www.reddit.com' + d.permalink : '',
        url: d.url || '',
        over_18: d.over_18 || false,
      }));
      // 只返回前5个被过滤掉的标题用于调试
      const rejectedTitles = posts.filter(p => {
        const t = (p.title + ' ' + p.selftext).toLowerCase();
        return !(SUBJECT_TERMS.some(w => t.includes(w)) || BRAND_TERMS.some(w => t.includes(w)));
      }).slice(0, 5).map(p => p.title.slice(0, 80));
      return JSON.stringify({ count: posts.length, posts, sample_rejected: rejectedTitles });
    } catch (e) {
      return JSON.stringify({ error: e.message });
    }
  })()`;
}

function relevant(p) {
  const t = `${p.title} ${p.selftext}`.toLowerCase();
  // 品牌查询直接通过
  if (BRAND_TERMS.some(w => t.includes(w))) return true;
  return SUBJECT_TERMS.some(w => t.includes(w)) && CLEANING_TERMS.some(w => t.includes(w));
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

console.log(`=== WebBridge Reddit JSON Search v2 ===`);
console.log(`Queries: ${queries.length}, time: ${timeRange}, merge: ${doMerge}`);

console.log('\n[health] checking daemon...');
try {
  const nav = await cmd('navigate', { url: 'https://www.reddit.com', newTab: true, group_title: 'Reddit Search' });
  if (!nav.ok && !nav.success) throw new Error('navigate failed');
  console.log('[health] daemon OK, tab opened');
} catch (e) {
  console.error(`[health] FAILED: ${e.message}`);
  process.exit(1);
}
await sleep(4000);

const collected = new Map();
for (let qi = 0; qi < queries.length; qi++) {
  const q = queries[qi];
  console.log(`\n[${qi + 1}/${queries.length}] ${q}`);
  try {
    const r = await cmd('evaluate', { code: makeFetchCode(q, timeRange) });
    const raw = r?.data?.value || r?.value;
    if (!raw) { console.warn('  no data returned'); continue; }
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (data.error) { console.warn(`  error: ${data.error}`); continue; }

    let kept = 0;
    for (const p of data.posts || []) {
      if (!p.id || collected.has(p.id)) continue;
      if (!relevant(p)) continue;
      collected.set(p.id, p);
      kept++;
    }
    console.log(`  fetched ${data.count}, kept ${kept}, total unique: ${collected.size}`);
    // 调试：如果有 fetched>0 但 kept=0，打印样本
    if (data.count > 0 && kept === 0 && data.sample_rejected?.length) {
      console.log(`  sample rejected titles:`);
      for (const t of data.sample_rejected) console.log(`    - ${t}`);
    }
  } catch (e) {
    console.warn(`  FAILED: ${e.message}`);
  }
  await sleep(2000);
}

console.log(`\n=== Collected ${collected.size} unique relevant posts ===`);

const newSubs = [...collected.values()];

let mergedTotal = newSubs.length;
let mergedFile = null;
if (doMerge && existsSync(MERGE_FILE)) {
  mergedFile = JSON.parse(readFileSync(MERGE_FILE, 'utf8'));
  const existing = new Map((mergedFile.submissions || []).map(s => [s.id, s]));
  let added = 0;
  for (const s of newSubs) {
    if (!existing.has(s.id)) { existing.set(s.id, s); added++; }
  }
  mergedFile.submissions = [...existing.values()];
  mergedFile.fetched_at = new Date().toISOString();
  mergedFile.queries = [...new Set([...(mergedFile.queries || []), ...queries])];
  mergedTotal = mergedFile.submissions.length;
  writeFileSync(MERGE_FILE, JSON.stringify(mergedFile, null, 2));
  console.log(`Merged -> ${MERGE_FILE} (+${added} new, ${mergedTotal} total)`);
}

const result = {
  fetched_at: new Date().toISOString(),
  source: 'kimi-webbridge-json-search',
  queries,
  time_range: timeRange,
  new_posts: newSubs.length,
  submissions: newSubs,
};
mkdirSync('data', { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`Saved -> ${OUT}`);

const csvPath = OUT.replace(/\.json$/, '.csv');
const header = 'id,created_iso,subreddit,score,num_comments,author,title,permalink,selftext';
writeFileSync(csvPath, '\uFEFF' + header + '\n' + newSubs.map(s =>
  [s.id, s.created_iso, s.subreddit, s.score, s.num_comments, s.author, s.title, s.permalink, s.selftext].map(csvCell).join(',')
).join('\n'));
console.log(`Saved -> ${csvPath}`);

const allSubs = mergedFile?.submissions || newSubs;
console.log(`\n=== Summary: ${allSubs.length} submissions ===`);
const bySub = {};
for (const s of allSubs) bySub[s.subreddit] = (bySub[s.subreddit] || 0) + 1;
console.log('Top subreddits:');
for (const [name, n] of Object.entries(bySub).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  r/${name}: ${n}`);
}
const byYear = {};
for (const s of allSubs) {
  const y = s.created_iso?.slice(0, 4);
  if (y) byYear[y] = (byYear[y] || 0) + 1;
}
console.log('By year:');
for (const [y, n] of Object.entries(byYear).sort()) console.log(`  ${y}: ${n}`);
const times = allSubs.map(s => s.created_utc).filter(v => typeof v === 'number');
if (times.length) {
  console.log(`Date range: ${new Date(Math.min(...times) * 1000).toISOString()} -> ${new Date(Math.max(...times) * 1000).toISOString()}`);
}
console.log(`\nRecent 15 (by date):`);
for (const s of [...allSubs].filter(s => s.created_utc).sort((a, b) => b.created_utc - a.created_utc).slice(0, 15)) {
  console.log(`  ${s.created_iso?.slice(0, 10)} [${s.score}|${s.num_comments}c] r/${s.subreddit}: ${s.title.slice(0, 70)}`);
}

try { await cmd('close_session', {}); } catch {}
console.log('\nDone.');

// 一次性脚本：用 PullPush comment search + link_id 抓取指定帖子的全部评论
// 带长退避 429 重试。用法: node scripts/fetch-post-comments-pp.mjs <postId>
import { mkdirSync, writeFileSync } from 'node:fs';

const id = process.argv[2] || '15goh2o';
const linkId = `t3_${id}`;
const UA = { 'User-Agent': 'partdro-market-research/1.0 (node script)' };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getJSON(url, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (res.ok) return await res.json();
      if (res.status === 429 || res.status >= 500) {
        const wait = 20000 * (i + 1);
        console.warn(`  HTTP ${res.status}, wait ${wait / 1000}s, retry ${i + 1}/${tries}...`);
        await sleep(wait);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(15000 * (i + 1));
    }
  }
  return { data: [] };
}

// PullPush 单页上限 100，用 before 游标分页（按 created_utc 倒序）
async function fetchAllByLink() {
  const all = [];
  let before = null;
  for (let page = 0; page < 10; page++) {
    const p = new URLSearchParams({ link_id: linkId, size: '100', sort: 'desc', sort_type: 'created_utc' });
    if (before) p.set('before', String(before));
    const url = `https://api.pullpush.io/reddit/search/comment/?${p.toString()}`;
    console.log(`Page ${page + 1}: ${url}`);
    const j = await getJSON(url);
    const batch = Array.isArray(j) ? j : (j?.data ?? []);
    if (!Array.isArray(batch) || batch.length === 0) { console.log(`  empty, stop`); break; }
    all.push(...batch);
    console.log(`  got ${batch.length}, total ${all.length}`);
    const times = batch.map(d => d.created_utc).filter(v => typeof v === 'number');
    if (times.length === 0) break;
    before = Math.min(...times) - 1;
    if (batch.length < 100) break;
    await sleep(5000);
  }
  return all;
}

console.log(`Fetching comments for ${linkId} via PullPush...`);
let raw = [];
try {
  raw = await fetchAllByLink();
} catch (e) {
  console.error('FAILED:', e.message);
  process.exit(1);
}
console.log(`\nTotal raw comments fetched: ${raw.length}`);

// 过滤掉明显无关的（PullPush link_id 通常精准，但兜底）
const comments = raw.map(c => ({
  id: c.id,
  author: c.author ?? '',
  score: c.score ?? 0,
  body: c.body ?? '',
  created_utc: c.created_utc ?? null,
  created_iso: c.created_utc ? new Date(c.created_utc * 1000).toISOString() : null,
  permalink: c.permalink ? `https://www.reddit.com${c.permalink}` : '',
  link_id: c.link_id ?? '',
  parent_id: c.parent_id ?? '',
})).sort((a, b) => b.score - a.score);

const result = {
  fetched_at: new Date().toISOString(),
  source: 'pullpush-comment-search',
  post_id: id,
  link_id: linkId,
  count: comments.length,
  comments,
};

mkdirSync('data', { recursive: true });
const out = `data/reddit_post_${id}_comments.json`;
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(`Saved -> ${out}`);

const csv = `data/reddit_post_${id}_comments.csv`;
const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
writeFileSync(csv, '\uFEFF' + 'score,id,author,created_iso,parent_id,body\n' + comments.map(c => [c.score, c.id, c.author, c.created_iso, c.parent_id, c.body].map(esc).join(',')).join('\n'));
console.log(`Saved -> ${csv}`);

console.log('\nTop 20 comments by score:');
for (const c of comments.slice(0, 20)) {
  console.log(`  [${c.score}] u/${c.author}: ${c.body.slice(0, 200).replace(/\n/g, ' ')}`);
}

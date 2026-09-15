// 一次性脚本：用 Reddit 公开 JSON 抓取指定帖子的全部评论树并展平
// 用法: node scripts/fetch-post-comments.mjs <postId> [permalink]
import { mkdirSync, writeFileSync } from 'node:fs';

const id = process.argv[2] || '15goh2o';
const perma = process.argv[3] || `/r/drones/comments/${id}/`;
const url = `https://www.reddit.com${perma}.json?limit=500`;
const UA = { 'User-Agent': 'partdro-market-research/1.0 (node script)' };

console.log(`Fetching ${url}`);
let root;
try {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) { console.error('HTTP', res.status); process.exit(1); }
  root = await res.json();
} catch (e) { console.error('ERR', e.cause?.message || e.message); process.exit(1); }

const submission = root?.[0]?.data?.children?.[0]?.data;
if (!submission) { console.error('no submission'); process.exit(1); }
console.log(`Post: ${submission.title} (u/${submission.author}, score ${submission.score}, ${submission.num_comments} comments)`);

const list = root?.[1]?.data?.children ?? [];
const flat = [];
function walk(n, depth, parentId) {
  if (!n) return;
  flat.push({
    id: n.id,
    author: n.author ?? '',
    score: n.score ?? 0,
    body: n.body ?? '',
    depth,
    parent_id: parentId,
    created_utc: n.created_utc ?? null,
    created_iso: n.created_utc ? new Date(n.created_utc * 1000).toISOString() : null,
    permalink: n.permalink ? `https://www.reddit.com${n.permalink}` : '',
    is_submitter: !!n.is_submitter,
    ups: n.ups ?? 0,
    downs: n.downs ?? 0,
  });
  for (const c of n.replies?.data?.children ?? []) {
    if (c.kind === 't1' && c.data) walk(c.data, depth + 1, n.id);
  }
}
for (const c of list) {
  if (c.kind === 't1' && c.data) walk(c.data, 0, null);
}

console.log(`Flattened ${flat.length} comments`);

const result = {
  fetched_at: new Date().toISOString(),
  source: 'reddit-json',
  submission: {
    id: submission.id,
    title: submission.title,
    author: submission.author,
    score: submission.score,
    num_comments: submission.num_comments,
    created_iso: new Date((submission.created_utc ?? 0) * 1000).toISOString(),
    permalink: `https://www.reddit.com${submission.permalink}`,
    selftext: submission.selftext ?? '',
    subreddit: submission.subreddit,
  },
  comments: flat,
};

mkdirSync('data', { recursive: true });
const out = `data/reddit_post_${id}_comments.json`;
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(`Saved -> ${out}`);

const csv = `data/reddit_post_${id}_comments.csv`;
const header = 'depth,id,parent_id,score,author,created_iso,body';
const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
writeFileSync(csv, '\uFEFF' + header + '\n' + flat.map(c => [c.depth, c.id, c.parent_id ?? '', c.score, c.author, c.created_iso, c.body].map(esc).join(',')).join('\n'));
console.log(`Saved -> ${csv}`);

console.log('\nTop comments by score:');
for (const c of [...flat].sort((a, b) => b.score - a.score).slice(0, 15)) {
  console.log(`  [${c.score}] u/${c.author}${c.is_submitter ? ' (OP)' : ''} (d${c.depth}): ${c.body.slice(0, 180).replace(/\n/g, ' ')}`);
}

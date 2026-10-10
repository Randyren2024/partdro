// Arctic Shift 评论抓取（PullPush 限流期的替代源）
// 用法: node scripts/fetch-comments-arctic.mjs <postId> [pages]
// 产物: data/cargo/comments_<postId>.json（全量）+ .csv（score≥3 按 score 降序）
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const postId = process.argv[2];
const maxPages = parseInt(process.argv[3] || '3', 10);
if (!postId) { console.error('usage: node fetch-comments-arctic.mjs <postId> [pages]'); process.exit(1); }

mkdirSync('data/cargo', { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const all = new Map();
let before = null;

for (let page = 1; page <= maxPages; page++) {
  const url = `https://arctic-shift.photon-reddit.com/api/comments/search?link_id=${postId}&limit=100${before ? `&before=${before}` : ''}`;
  let rows = [];
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const out = execFileSync('curl', ['-s', '--compressed', '-A', UA, url], { encoding: 'utf8', timeout: 45000, maxBuffer: 32 * 1024 * 1024 });
      const j = JSON.parse(out);
      rows = Array.isArray(j.data) ? j.data : [];
      break;
    } catch (e) {
      console.error(`  page ${page} attempt ${attempt} failed: ${e.message.slice(0, 80)}`);
      if (attempt === 4) rows = [];
      else execFileSync('cmd', ['/c', 'timeout', '/t', '15', '/nobreak'], { stdio: 'ignore' });
    }
  }
  if (rows.length === 0) break;
  for (const c of rows) all.set(c.id, c);
  console.log(`  page ${page}: +${rows.length} (total ${all.size})`);
  if (rows.length < 100) break;
  before = Math.min(...rows.map(r => r.created_utc));
  await new Promise(r => setTimeout(r, 2500));
}

const comments = [...all.values()].map(c => ({
  id: c.id, author: c.author, body: (c.body || '').replace(/\s+/g, ' ').slice(0, 1200),
  score: c.score ?? 0, created_iso: c.created_utc ? new Date(c.created_utc * 1000).toISOString() : null,
  parent_id: c.parent_id || '', is_submitter: !!c.is_submitter,
})).sort((a, b) => b.score - a.score);

writeFileSync(`data/cargo/comments_${postId}.json`, JSON.stringify({ post_id: postId, total: comments.length, comments }, null, 1));
const keep = comments.filter(c => c.score >= 3 && c.body.length > 40);
const csv = 'score,author,created,body\n' + keep.map(c => `${c.score},"${c.author}","${c.created_iso}","${c.body.replace(/"/g, '""').slice(0, 500)}"`).join('\n');
writeFileSync(`data/cargo/comments_${postId}.csv`, csv);
console.log(`DONE ${postId}: ${comments.length} comments -> data/cargo/comments_${postId}.{json,csv}`);
for (const c of keep.slice(0, 5)) console.log(`  [${c.score}] ${c.body.slice(0, 110)}`);

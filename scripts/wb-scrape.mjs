// 通过 Kimi WebBridge 抓取 Reddit 帖子评论
// 用法: node scripts/wb-scrape.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const DAEMON = 'http://127.0.0.1:10086/command';
const SESSION = 'reddit-d15r';
const OUT = 'data/reddit_post_15goh2o_comments.json';

async function cmd(action, args) {
  const res = await fetch(DAEMON, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args, session: SESSION }),
  });
  return res.json();
}

// 提取评论的 JS 代码（在浏览器页面上下文执行）
const extractCode = `(() => {
  const out = [];
  const els = document.querySelectorAll('shreddit-comment');
  els.forEach((el, i) => {
    const author = el.getAttribute('author') || '';
    const score = el.getAttribute('score') || el.querySelector('shreddit-comment-action-bar')?.getAttribute('score') || '';
    let body = '';
    const bodyEl = el.querySelector('[slot="comment"]') || el.querySelector('#comment-content') || el.querySelector('.md');
    if (bodyEl) body = bodyEl.innerText;
    // 去掉 "Reply" / "Share" 等 action bar 文字
    body = body.replace(/^(Reply|Share|Save|Report|Award|Give Award|Follow|Copy text|Read full text)\\s*$/gm, '').trim();
    out.push({ i, author, score: parseInt(score) || 0, body: body.slice(0, 4000) });
  });
  return JSON.stringify({ count: out.length, title: document.title, url: location.href, comments: out });
})()`;

console.log('Extracting comments...');
const r = await cmd('evaluate', { code: extractCode });
const raw = r.data?.value || r.data?.result || r.value;
if (!raw) {
  console.error('No data returned:', JSON.stringify(r).slice(0, 500));
  process.exit(1);
}

const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
console.log(`Got ${data.count} comments from: ${data.title}`);

mkdirSync('data', { recursive: true });
const result = {
  fetched_at: new Date().toISOString(),
  source: 'kimi-webbridge',
  post_url: data.url,
  post_title: data.title,
  comment_count: data.count,
  comments: data.comments,
};
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`Saved -> ${OUT}`);

// 打印摘要
console.log('\nAll comments (sorted by score):');
const sorted = [...data.comments].sort((a, b) => b.score - a.score);
for (const c of sorted) {
  console.log(`  [${c.score}] u/${c.author}: ${c.body.slice(0, 200).replace(/\n/g, ' ')}`);
}

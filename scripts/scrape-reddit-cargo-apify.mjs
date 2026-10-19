// 用 Apify 补抓 cargo 行业子版 Reddit（PullPush 限流期的已知缺口）
// 用法: node scripts/scrape-reddit-cargo-apify.mjs [maxPerQuery]
// 依赖: APIFY_TOKEN 环境变量（不入库）
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) { console.error('缺少 APIFY_TOKEN 环境变量'); process.exit(1); }

const ACTOR = 'trudax~reddit-scraper';
const maxPerQuery = Number(process.argv[2] || 30);

// 批次2关键词（analysis_report.md 待办）+ 重载核心词补新帖
const QUERIES = [
  'logging drone',
  'forestry drone',
  'drone lifting',
  'disaster relief drone',
  'drone material transport',
  'drone winch',
  'heavy lift drone',
];

// PullPush 当时限流返回 0 的行业子版（analysis_report.md 第一节注记）
const SUB_SEARCHES = [
  'https://www.reddit.com/r/logistics/search/?q=drone&restrict_sr=1&sort=new&t=all',
  'https://www.reddit.com/r/farming/search/?q=drone&restrict_sr=1&sort=new&t=all',
  'https://www.reddit.com/r/Construction/search/?q=drone&restrict_sr=1&sort=new&t=all',
  'https://www.reddit.com/r/Construction/search/?q=lifting&restrict_sr=1&sort=new&t=all',
];

const input = {
  searches: QUERIES,
  startUrls: SUB_SEARCHES.map((url) => ({ url })),
  maxItems: maxPerQuery * (QUERIES.length + SUB_SEARCHES.length),
  sort: 'relevance',
  scrapePostDetails: true,
  scrapeComments: false,
};

console.log(`启动 ${ACTOR}，${QUERIES.length} 搜索 + ${SUB_SEARCHES.length} 子版站内搜索...`);
const runUrl = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${TOKEN}&timeout=290`;

let items = null;
for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    const res = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`运行失败 HTTP ${res.status}: ${body.slice(0, 2000)}`);
      process.exit(1);
    }
    items = await res.json();
    break;
  } catch (e) {
    console.log(`第 ${attempt} 次网络失败（${e.cause?.code || e.message}），重试...`);
    if (attempt === 4) { console.error(e); process.exit(1); }
    await new Promise(r => setTimeout(r, 5000 * attempt));
  }
}
if (!Array.isArray(items)) {
  console.error('返回非数组:', JSON.stringify(items).slice(0, 1000));
  process.exit(1);
}

mkdirSync('data/cargo', { recursive: true });
writeFileSync('data/cargo/posts_apify.json', JSON.stringify(items, null, 1), 'utf8');

// 汇总：帖子 vs 评论分离 + 相关度统计
const cargoWords = /heavy.?lift|cargo|payload|winch|logging|forestry|timber|construction|crane|lifting|transport|freight|dispatch|solar farm|power line|disaster|relief|resupply/i;
const relevant = items.filter((it) => cargoWords.test(`${it.title || ''} ${it.text || it.body || ''}`));
console.log(`\n✅ 已存 data/cargo/posts_apify.json（原始 ${items.length} 条，含 cargo 关键词 ${relevant.length} 条）`);

// 社区分布
const subDist = {};
for (const it of relevant) {
  const sub = (it.url || '').match(/reddit\.com\/r\/([^/]+)/)?.[1] || '?';
  subDist[sub] = (subDist[sub] || 0) + 1;
}
console.log('\n社区分布:', JSON.stringify(Object.fromEntries(Object.entries(subDist).sort((a,b)=>b[1]-a[1]).slice(0,15))));

// 抽样高价值条目（有互动的帖子）
console.log('\n=== 高价值帖子抽样（score>=5）===');
const seen = new Set();
for (const it of relevant.sort((a,b)=>(b.score||0)-(a.score||0))) {
  if (!it.title || it.body?.startsWith('/u/')) continue;
  const t = it.title.slice(0, 110);
  const key = t.slice(0, 40);
  if (seen.has(key)) continue;
  seen.add(key);
  const sub = (it.url || '').match(/reddit\.com\/r\/([^/]+)/)?.[1] || '?';
  console.log(`  [${it.score||0}↑ r/${sub}] ${t}`);
  if (seen.size >= 25) break;
}

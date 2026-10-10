// 用 Apify 抓取德语 Reddit 帖子（清洗无人机相关）
// 用法: node scripts/scrape-reddit-apify.mjs [maxPerQuery]
// 依赖: APIFY_TOKEN 环境变量（不入库）
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) { console.error('缺少 APIFY_TOKEN 环境变量'); process.exit(1); }

const ACTOR = 'trudax~reddit-scraper';
const maxPerQuery = Number(process.argv[2] || 40);

// 德语搜索词：覆盖 D15R-DE 系列的三个广告组主题
const QUERIES = [
  'Reinigungsdrohne',
  'Fassadenreinigung Drohne',
  'Fassadenreinigungsroboter',
  'Gebäudereinigung Drohne',
  'Solarreinigung Drohne',
  'Photovoltaik Reinigung Drohne',
];

// 定向德语社区站内搜索（比全站搜索更相关）
const SUB_SEARCHES = [
  'https://www.reddit.com/r/DeutschePhotovoltaik/search/?q=Drohne&restrict_sr=1&sort=new&t=all',
  'https://www.reddit.com/r/DeutschePhotovoltaik/search/?q=Reinigung&restrict_sr=1&sort=new&t=all',
  'https://www.reddit.com/r/PVAnlagenbesitzer/search/?q=Reinigung&restrict_sr=1&sort=new&t=all',
];

const input = {
  searches: QUERIES,
  startUrls: SUB_SEARCHES.map((url) => ({ url })),
  maxItems: maxPerQuery * (QUERIES.length + SUB_SEARCHES.length),
  sort: 'relevance',
  scrapePostDetails: true,
  scrapeComments: false,
};

console.log(`启动 ${ACTOR}，${QUERIES.length} 个搜索 x 最多 ${maxPerQuery} 条...`);
const runUrl = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${TOKEN}&timeout=290`;

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

const items = await res.json();
if (!Array.isArray(items)) {
  console.error('返回非数组:', JSON.stringify(items).slice(0, 1000));
  process.exit(1);
}

mkdirSync('data/reddit_de', { recursive: true });
writeFileSync('data/reddit_de/posts_apify.json', JSON.stringify(items, null, 1), 'utf8');

// 汇总：帖子 vs 评论分离（评论条目是 "/u/xxx on ..." 形式），统计相关度
const posts = items.filter((it) => {
  const u = it.url || '';
  return u.includes('/comments/') && !/\/comments\/[^/]+\/[^/]+\/[a-z0-9_]+\/?$/i.test(u) && !it.body?.startsWith('/u/');
});
const allForFilter = items;
const deWords = /drohne|reinigung|solar|fassade|photovoltaik|pv-anlage|gebäude/i;
const relevant = allForFilter.filter((it) => deWords.test(`${it.title || ''} ${it.text || it.body || ''}`));
console.log(`\n✅ 已存 data/reddit_de/posts_apify.json（原始 ${items.length} 条）`);
console.log(`   其中含德语关键词条目: ${relevant.length}`);

// 抽样相关条目标题（含所在社区）
console.log('\n=== 相关条目抽样 ===');
const seen = new Set();
for (const it of relevant) {
  const t = (it.title || it.body || '').slice(0, 100);
  const sub = (it.url || '').match(/reddit\.com\/r\/([^/]+)/)?.[1] || '?';
  const key = t.slice(0, 40);
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`  [r/${sub}] ${t}`);
  if (seen.size >= 30) break;
}
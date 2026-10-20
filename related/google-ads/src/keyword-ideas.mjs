// 关键词调研：KeywordPlanIdeaService.generateKeywordIdeas
// 用法: node src/keyword-ideas.mjs [geo=2840(US)] [lang=1000(EN)] [profile=clean|cargo]
// 输出: data/keyword-ideas-<geo>[-cargo].md + 控制台摘要
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';
import { mkdirSync, writeFileSync } from 'node:fs';

const GEO = process.argv[2] || '2840'; // US
const LANG = process.argv[3] || '1000'; // EN
const PROFILE = process.argv[4] || 'clean'; // clean | cargo（S150 运载/重载无人机）

// 两个产品的语义空间：产品类型变体 / 机器机器人型 / 任务场景设备 / 采购意图 —— 最大化长尾召回
const SEEDS_EN = [
  // 产品类型
  'window cleaning drone', 'facade cleaning drone', 'solar panel cleaning drone',
  'building cleaning drone', 'high rise cleaning drone', 'roof cleaning drone',
  'wind turbine cleaning drone', 'glass curtain wall cleaning drone',
  'skyscraper cleaning drone', 'industrial cleaning drone', 'exterior cleaning drone',
  'washing drone', 'drone pressure washing', 'drone power washing', 'cleaning drone',
  'drone window washing', 'drone gutter cleaning',
  // 机器 / 机器人型
  'solar panel cleaning machine', 'solar panel cleaning robot', 'solar cleaning robot',
  'facade cleaning robot', 'window cleaning robot', 'pv panel cleaning robot',
  'panel cleaning machine', 'pressure washing robot', 'solar module cleaning robot',
  // 任务场景 / 设备
  'skyscraper window cleaning', 'high rise window cleaning', 'building facade cleaning',
  'solar panel washing', 'solar farm cleaning', 'photovoltaic cleaning',
  'solar module cleaning', 'building washing equipment', 'facade cleaning equipment',
  'scaffolding alternative', 'rope access alternative',
  // 采购意图（B2B 高转化）
  'cleaning drone price', 'drone cleaning services', 'solar panel cleaning cost',
  'facade cleaning cost', 'drone cleaning company', 'solar panel cleaning companies',
  // ---- C15 语义空间：风电 + 玻璃幕墙 + 轻型机 ----
  'wind turbine blade cleaning', 'wind turbine cleaning', 'wind turbine maintenance drone',
  'wind turbine cleaning robot', 'turbine blade cleaning', 'nacelle cleaning',
  'wind turbine cleaning services', 'offshore wind turbine cleaning',
  'glass facade cleaning', 'curtain wall cleaning', 'glass building cleaning',
  'high rise facade cleaning', 'facade washing machine', 'building exterior cleaning drone',
  'drone facade cleaning', 'lightweight cleaning drone', 'single operator cleaning drone',
];
const SEEDS_DE = [
  'reinigungsdrohne', 'fassadenreinigung drohne', 'fensterreinigung drohne',
  'gebäudereinigung drohne', 'hochdruckreinigung drohne', 'solarreinigung drohne',
  'photovoltaik reinigung drohne', 'pv reinigung drohne', 'windrad reinigung drohne',
  'windkraftanlagen reinigung drohne', 'fassadenreinigungsroboter', 'hochhausreinigung drohne',
  'glasfassade reinigung drohne', 'drohne gebäudereinigung', 'solaranlagen reinigung drohne',
  'fassadenreinigung maschine', 'window cleaning drone', 'facade cleaning drone',
];
// ---- cargo（S150 运载/重载无人机）语义空间 ----
const SEEDS_CARGO = [
  // 产品类型
  'cargo drone', 'cargo drones', 'heavy lift drone', 'heavy lift drones',
  'heavy payload drone', 'payload drone', 'heavy lifting drone', 'heavy duty drone',
  'drone delivery', 'delivery drone', 'drone transport', 'freight drone',
  'drone logistics', 'long range delivery drone', 'heavy lift drone kit',
  'industrial delivery drone', 'drone heavy load',
  // 规格型
  'drone payload capacity', 'drone carrying capacity', 'drone 50kg payload',
  'drone 100kg payload',
  // 任务场景
  'drone cargo transport', 'drone delivery service', 'drone freight service',
  'agricultural spraying drone', 'crop spraying drone', 'parcel delivery drone',
  'medical drone delivery', 'drone shipping',
  // 采购意图（B2B 高转化）
  'cargo drone price', 'heavy lift drone price', 'cargo drone for sale',
  'heavy lift drone for sale', 'drone delivery cost', 'drone delivery company',
  'cargo drone manufacturer', 'heavy lift drone manufacturer',
  // 竞品
  'DJI FlyCart', 'Zipline drone',
];
const SEEDS = PROFILE === 'cargo' ? SEEDS_CARGO : (LANG === '1001' ? SEEDS_DE : SEEDS_EN);

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

const ideas = [];
const seen = new Set(); // 按 resource_name 去重（不同种子批可能返回同一创意）
// API 限制：keyword_seed.keywords 每批最多 20 个 → 分批抓取后合并
const chunks = [];
for (let i = 0; i < SEEDS.length; i += 20) chunks.push(SEEDS.slice(i, i + 20));
for (const [ci, seeds] of chunks.entries()) {
  let pageToken;
  for (let page = 0; page < 3; page++) {
    const res = await customer.keywordPlanIdeas.generateKeywordIdeas({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
      keyword_seed: { keywords: seeds },
      geo_target_constants: [`geoTargetConstants/${GEO}`],
      language: `languageConstants/${LANG}`,
      keyword_plan_network: 'GOOGLE_SEARCH',
      include_adult_keywords: false,
      page_size: 1000,
      ...(pageToken ? { page_token: pageToken } : {}),
    });
    const list = res?.results ?? res ?? [];
    for (const i of list) {
      const key = i.keyword_idea_metrics?.text ?? i.text ?? i.resource_name;
      if (!seen.has(key)) { seen.add(key); ideas.push(i); }
    }
    pageToken = res?.next_page_token;
    if (!pageToken) break;
  }
  console.log(`批次 ${ci + 1}/${chunks.length}（${seeds.length} 种子）累计 ${ideas.length} 条`);
}

const rows = ideas
  .map(i => ({
    text: i.text,
    vol: Number(i.keyword_idea_metrics?.avg_monthly_searches ?? 0),
    comp: i.keyword_idea_metrics?.competition ?? '',
    low: Number(i.keyword_idea_metrics?.low_top_of_page_bid_micros ?? 0),
    high: Number(i.keyword_idea_metrics?.high_top_of_page_bid_micros ?? 0),
  }))
  .filter(r => r.text);
const y = r => (r.low ? (r.low / 1e6).toFixed(2) : '-') + '~' + (r.high ? (r.high / 1e6).toFixed(2) : '-');

const byVol = [...rows].sort((a, b) => b.vol - a.vol).slice(0, 30);
const cheap = [...rows].filter(r => r.vol >= 50 && r.low > 0).sort((a, b) => a.low - b.low).slice(0, 30);
const longtail = [...rows].filter(r => r.text.split(' ').length >= 3 && r.vol >= 10).sort((a, b) => b.vol - a.vol).slice(0, 60);
const eff = [...rows].filter(r => r.vol >= 30 && r.low > 0)
  .map(r => ({ ...r, score: r.vol / (r.low / 1e6) }))
  .sort((a, b) => b.score - a.score).slice(0, 30);
// 采购意图词：price/cost/buy/rent/service/company/for sale 等
const BUYER_RE = /\b(price|prices|pricing|cost|costs|buy|for sale|rent|rental|hire|service|services|company|companies|contractor|contractors|quote|near me|supplier|manufacturer)\b/i;
const buyer = [...rows].filter(r => BUYER_RE.test(r.text)).sort((a, b) => b.vol - a.vol).slice(0, 40);
// 疑问词：how/what/can/best/why 等，用于发现真实决策问题
const Q_RE = /^(how|what|can|best|why|which|where|is|are|do|does)\b/i;
const questions = [...rows].filter(r => Q_RE.test(r.text)).sort((a, b) => b.vol - a.vol).slice(0, 30);

const geoName = { 2840: 'US', 2124: 'CA', 2036: 'AU', 2826: 'GB', 2276: 'DE', 2250: 'FR' }[GEO] || GEO;
const outName = `keyword-ideas-${geoName}${PROFILE === 'cargo' ? '-cargo' : ''}.md`;
mkdirSync('data', { recursive: true });
const md = [];
md.push(`# 关键词调研 — ${geoName} / EN / Google 搜索${PROFILE === 'cargo' ? '（cargo/S150 语义空间）' : ''}\n`);
md.push(`\n种子词 ${SEEDS.length} 个，返回 ${rows.length} 条创意。生成时间见文件时间戳。\n`);
md.push(`\n## 一、搜索量 Top 30\n\n| 词 | 月搜索 | 竞争 | 首页出价低~高($) |\n|---|---|---|---|\n`);
byVol.forEach(r => md.push(`| ${r.text} | ${r.vol} | ${r.comp} | ${y(r)} |\n`));
md.push(`\n## 二、最低 CPC Top 30（月搜索≥50）\n\n| 词 | 月搜索 | 首页低价($) | 竞争 |\n|---|---|---|---|\n`);
cheap.forEach(r => md.push(`| ${r.text} | ${r.vol} | ${(r.low / 1e6).toFixed(2)} | ${r.comp} |\n`));
md.push(`\n## 三、长尾词（≥3 词，月搜索≥10）Top 60\n\n| 词 | 月搜索 | 首页出价($) |\n|---|---|---|\n`);
longtail.forEach(r => md.push(`| ${r.text} | ${r.vol} | ${y(r)} |\n`));
md.push(`\n## 四、性价比（搜索量/低价CPC）Top 30\n\n| 词 | 月搜索 | 低价($) | 效率分 |\n|---|---|---|---|\n`);
eff.forEach(r => md.push(`| ${r.text} | ${r.vol} | ${(r.low / 1e6).toFixed(2)} | ${r.score.toFixed(0)} |\n`));
md.push(`\n## 五、采购意图词（price/cost/buy/services...）Top 40\n\n| 词 | 月搜索 | 首页出价($) | 竞争 |\n|---|---|---|---|\n`);
buyer.forEach(r => md.push(`| ${r.text} | ${r.vol} | ${y(r)} | ${r.comp} |\n`));
md.push(`\n## 六、疑问词（how/what/can/best...）Top 30\n\n| 词 | 月搜索 | 首页出价($) |\n|---|---|---|\n`);
questions.forEach(r => md.push(`| ${r.text} | ${r.vol} | ${y(r)} |\n`));
writeFileSync(`data/${outName}`, md.join(''), 'utf8');

console.log(`共 ${rows.length} 条创意 → data/${outName}`);
console.log('\n== 搜索量 Top 10 ==');
byVol.slice(0, 10).forEach(r => console.log(`${r.vol}\t${r.text}\t${y(r)}`));
console.log('\n== 最低 CPC Top 10 (vol>=50) ==');
cheap.slice(0, 10).forEach(r => console.log(`$${(r.low / 1e6).toFixed(2)}\t${r.text}\t${r.vol}`));
console.log('\n== 长尾 Top 15 ==');
longtail.slice(0, 15).forEach(r => console.log(`${r.vol}\t${r.text}\t${y(r)}`));
console.log('\n== 采购意图 Top 10 ==');
buyer.slice(0, 10).forEach(r => console.log(`${r.vol}\t${r.text}\t${y(r)}`));
console.log('\n== 性价比 Top 10 ==');
eff.slice(0, 10).forEach(r => console.log(`${r.score.toFixed(0)}\t${r.text}\tvol=${r.vol} low=$${(r.low / 1e6).toFixed(2)}`));

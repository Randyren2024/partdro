// D15R - Search - Global (24321754735) 优化执行 — 2026-10-10
// 按 D15R-DE 同一思路: ①出价切 MaxClicks+cap ②删 robot意图词 ③加 B2B 泛词 ④负词拦 DIY ⑤4组画像 RSA
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24321754735';
const CAMPAIGN_RN = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${CAMPAIGN_ID}`;
const STRATEGY_NAME = 'D15R-Global MaxClicks cap ¥10 2026-10-10';
const CEILING_CNY = 10;

// 删除: robot/equipment/bot 意图词（D15R 是无人机，这些词引来擦窗机器人/清洗机搜索者）
const TO_REMOVE_TEXTS = [
  'solar cleaning robot', 'solar panel cleaning robot', 'solar panel cleaning machine',
  'solar washer', 'robotic solar panel cleaning', 'solar panel washing equipment',
  'solar panel cleaning bot', 'solar module cleaning robot', 'pv panel cleaning robot',
];
// 新增: KALZ 型买家直接搜索词
const TO_ADD = [
  { adGroup: /Facade/i, text: 'drone cleaning service', matchType: 'PHRASE' },
  { adGroup: /Facade/i, text: 'drone cleaning company', matchType: 'PHRASE' },
];
// 负词: 拦 DIY 房主流量（搜索词报告证实 "how to clean solar panels" 等浪费）
const NEGATIVES = ['how to', 'diy', 'garden'];

// ============ 4 组画像文案（headline ≤30 / description ≤80，已验证）============
// 画像: KALZ Group 型 — 集团/清洁公司扩展业务线、物业管理者、franchise 买家
const COPY = {
  'Competitor': {
    headlines: [
      'D15R Cleaning Drone', 'Purpose-Built for Cleaning', 'Not a Modified Camera Drone',
      'The Dedicated Cleaning UAV', '20MPa Cleaning Power', 'No Scaffolding Needed',
      'Facade + Solar + Windows', 'RTK Precision Cleaning', 'For Cleaning Companies',
      'Scale Across Sites', 'Request a Quote', 'Drone Cleaning Solution',
      'Industrial-Grade UAV', 'One Drone, Many Surfaces', 'See Specs & Pricing',
    ],
    descriptions: [
      'Purpose-built cleaning drone: 20MPa, RTK, no scaffolding. For professional use.',
      'Why retrofit a camera drone? D15R is built for facade, solar & window cleaning.',
      'Compare specs, payload & pressure. Get the D15R spec sheet and pricing today.',
      'For cleaning companies adding drone services. Scale across multiple sites.',
    ],
  },
  'Solar Panel': {
    headlines: [
      'Solar Panel Cleaning Drone', 'Clean More Panels Daily', 'Drones Beat Robots at Scale',
      'For Solar Maintenance Pros', 'No Scaffolding Needed', '20MPa Solar Washing',
      'Solar Farm Ready', 'RTK Precision Path', 'New Revenue Stream',
      'For Cleaning Companies', 'Faster Than Manual Crews', 'Get Pricing Today',
      'One Drone, Two Services', 'Commercial-Grade UAV', 'Request a Demo',
    ],
    descriptions: [
      'Drone cleaning for solar: 20MPa wash, RTK precision, no scaffolding or robots.',
      'For solar maintenance & cleaning companies: add drone service, scale fast.',
      'Clean panels faster than manual crews. One drone covers facade + solar.',
      'Robots crawl. Drones fly. D15R cleans solar panels at scale. Get pricing.',
    ],
  },
  'Facade & Window': {
    headlines: [
      'Window Cleaning Drone', 'Facade Cleaning Drone', 'No Scaffolding, No Ropes',
      'For Facility Managers', 'New Revenue Stream', 'For Cleaning Companies',
      'Franchise-Ready Tech', '20MPa Cleaning Power', 'RTK Precision',
      'High-Rise Ready', 'One Drone, Many Facades', 'Scale Across Properties',
      'Get a Quote', 'Commercial-Grade UAV', 'Drone Cleaning Services',
    ],
    descriptions: [
      'Facade & window cleaning by drone: no scaffolding, no rope access. 20MPa.',
      'For facility managers & cleaning companies: add drone cleaning, scale fast.',
      'Commercial-grade cleaning UAV with RTK precision. Request pricing today.',
      'One drone cleans facades, windows & solar. New service line, proven ROI.',
    ],
  },
  'High-Rise': {
    headlines: [
      'Skyscraper Cleaning Drone', 'High-Rise Cleaning Drone', 'No Rope Access Needed',
      'No Gondolas, No Scaffolds', 'Pressure Washing Drone', '20MPa at Height',
      'RTK Precision at Height', 'For Exterior Cleaners', 'Replace Rope Access',
      'Safer Than Rope Teams', 'Commercial-Grade UAV', 'For Cleaning Companies',
      'Get Pricing Today', 'Scale Across Towers', 'Request a Demo',
    ],
    descriptions: [
      'Skyscraper & high-rise cleaning by drone: no ropes, no gondolas. 20MPa.',
      'Replace rope access with RTK-guided drone cleaning. Commercial-grade.',
      'Safer, faster exterior cleaning for high-rise buildings. Get pricing.',
      'For exterior cleaning companies: add drone service, win high-rise bids.',
    ],
  },
};

async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /aborted|ECONNRESET|ETIMEDOUT|ECONNREFUSED|UND_ERR|timeout|premature|socket|fetch failed|5\d\d/i.test(msg);
      if (!retryable || i === attempts) throw e;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 100)})，重试...`);
      await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
}
const tryMsg = e => String(e?.errors?.[0]?.message || e.message || e);

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

// ============ ① 出价: 查找或新建组合策略（幂等）============
console.log('=== ① 出价策略 ===');
const existing = await withRetry(() => customer.query(`
  SELECT bidding_strategy.id, bidding_strategy.name, bidding_strategy.type
  FROM bidding_strategy WHERE bidding_strategy.name = '${STRATEGY_NAME}'
`), '查策略');
let bsRn;
if (existing.length) {
  bsRn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/biddingStrategies/${existing[0].bidding_strategy.id}`;
  console.log(`  复用已有策略: ${existing[0].bidding_strategy.name} (id=${existing[0].bidding_strategy.id})`);
} else {
  const bs = await withRetry(() => customer.biddingStrategies.create([{
    name: STRATEGY_NAME,
    type: 'TARGET_SPEND',
    target_spend: { cpc_bid_ceiling_micros: String(CEILING_CNY * 1e6) },
  }]), '建策略');
  const chk = await withRetry(() => customer.query(`
    SELECT bidding_strategy.id, bidding_strategy.name FROM bidding_strategy
    WHERE bidding_strategy.name = '${STRATEGY_NAME}'
  `), '回查策略');
  bsRn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/biddingStrategies/${chk[0].bidding_strategy.id}`;
  console.log(`  新建策略 id=${chk[0].bidding_strategy.id}`);
}
await withRetry(() => customer.campaigns.update([{ resource_name: CAMPAIGN_RN, bidding_strategy: bsRn }]), '挂载策略');
const vbid = await withRetry(() => customer.query(`
  SELECT campaign.bidding_strategy_type, campaign.bidding_strategy FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}
`), '验证出价');
console.log(`  挂载后 bidding_strategy_type=${vbid[0].campaign.bidding_strategy_type} (9=MaxClicks) ✓`);

// ============ ② 删词 ============
console.log('\n=== ② 删除 robot 意图词 ===');
const allCrit = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.resource_name, ad_group_criterion.keyword.text
  FROM ad_group_criterion
  WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group_criterion.type = 'KEYWORD'
`), '查关键词');
const rnByLower = new Map(allCrit.map(r => [r.ad_group_criterion.keyword.text.toLowerCase().trim(), r.ad_group_criterion.resource_name]));
const removeRns = [];
for (const t of TO_REMOVE_TEXTS) {
  const rn = rnByLower.get(t);
  if (rn) { removeRns.push(rn); console.log(`  删 "${t}"`); }
  else console.log(`  ⚠ 未找到 "${t}"`);
}
if (removeRns.length) {
  await withRetry(() => customer.adGroupCriteria.remove(removeRns), '删词');
  console.log(`  ✅ 已删除 ${removeRns.length} 个词`);
}

// ============ ③ 加词 ============
console.log('\n=== ③ 新增 B2B 词 ===');
const adGroupMap = new Map(allCrit.length ? [] : []);
const groups = await withRetry(() => customer.query(`
  SELECT ad_group.resource_name, ad_group.name FROM ad_group WHERE campaign.id = ${CAMPAIGN_ID}
`), '查广告组');
for (const spec of TO_ADD) {
  const g = groups.find(x => spec.adGroup.test(x.ad_group.name));
  if (!g) { console.log(`  ⚠ 未匹配广告组 ${spec.adGroup}`); continue; }
  try {
    await withRetry(() => customer.adGroupCriteria.create([{
      status: 'ENABLED',
      ad_group: g.ad_group.resource_name,
      keyword: { text: spec.text, match_type: spec.matchType },
    }]), `加词 ${spec.text}`);
    console.log(`  ✅ + "${spec.text}" → [${g.ad_group.name}]`);
  } catch (e) {
    if (/already exists|DUPLICATE/i.test(tryMsg(e))) console.log(`  已存在 "${spec.text}"`);
    else throw e;
  }
}

// ============ ④ 负词 ============
console.log('\n=== ④ 负词（campaign 级）===');
const existingNeg = await withRetry(() => customer.query(`
  SELECT campaign_criterion.keyword.text FROM campaign_criterion
  WHERE campaign.id = ${CAMPAIGN_ID} AND campaign_criterion.negative = TRUE
    AND campaign_criterion.type = 'KEYWORD'
`), '查负词');
const negSet = new Set(existingNeg.map(r => r.campaign_criterion.keyword.text.toLowerCase()));
for (const t of NEGATIVES) {
  if (negSet.has(t)) { console.log(`  已存在 "${t}"`); continue; }
  await withRetry(() => customer.campaignCriteria.create([{
    campaign: CAMPAIGN_RN,
    negative: true,
    keyword: { text: t, match_type: 'PHRASE' },
  }]), `负词 ${t}`);
  console.log(`  ✅ - "${t}" (phrase)`);
}

// ============ ⑤ 4 组画像 RSA ============
console.log('\n=== ⑤ 新建画像 RSA ===');
const adsNow = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group.resource_name, ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}
`), '查广告');
const FINAL_URLS = adsNow[0]?.ad_group_ad?.ad?.final_urls;
console.log(`  final_urls: ${FINAL_URLS}`);
const groupRn = new Map(adsNow.map(r => [r.ad_group.name, r.ad_group.resource_name]));

for (const [gname, copy] of Object.entries(COPY)) {
  const rn = groupRn.get(gname);
  if (!rn) { console.log(`  ⚠ 未找到广告组 ${gname}`); continue; }
  for (const h of copy.headlines) if (h.length > 30) console.log(`  ⚠ H超30: "${h}" ${h.length}`);
  for (const d of copy.descriptions) if (d.length > 80) console.log(`  ⚠ D超80: "${d}" ${d.length}`);
  const created = await withRetry(() => customer.adGroupAds.create([{
    status: 'ENABLED',
    ad_group: rn,
    ad: {
      final_urls: FINAL_URLS,
      responsive_search_ad: {
        headlines: copy.headlines.map(t => ({ text: t })),
        descriptions: copy.descriptions.map(t => ({ text: t })),
      },
    },
  }]), `RSA ${gname}`);
  console.log(`  ✅ [${gname}] ${JSON.stringify(created?.results?.[0]?.resource_name || created).slice(0, 120)}`);
}

// ============ ⑥ 最终验证 ============
console.log('\n=== ⑥ 最终验证 ===');
const finalKws = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.status
  FROM ad_group_criterion
  WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group_criterion.type = 'KEYWORD'
  ORDER BY ad_group.name
`), '终验关键词');
const byG = new Map();
for (const r of finalKws) {
  if (r.ad_group_criterion.status !== 2) continue;
  const gn = r.ad_group.name;
  if (!byG.has(gn)) byG.set(gn, []);
  byG.get(gn).push(r.ad_group_criterion.keyword.text);
}
for (const [gn, ks] of byG) console.log(`  [${gn}] ${ks.length} 词: ${ks.join(' | ')}`);
const finalNeg = await withRetry(() => customer.query(`
  SELECT campaign_criterion.keyword.text FROM campaign_criterion
  WHERE campaign.id = ${CAMPAIGN_ID} AND campaign_criterion.negative = TRUE AND campaign_criterion.type = 'KEYWORD'
`), '终验负词');
console.log(`  负词: ${finalNeg.map(r => r.campaign_criterion.keyword.text).join(' | ')}`);
const finalAds = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}
`), '终验广告');
for (const r of finalAds) {
  const s = r.ad_group_ad.status === 2 ? 'ENABLED' : r.ad_group_ad.status === 3 ? 'PAUSED' : r.ad_group_ad.status;
  console.log(`  [${r.ad_group.name}] AD ${r.ad_group_ad.ad.id} ${s}`);
}
console.log('\n✅ Global 优化完成');

// C500 - Search - Global (24316207812) 完整优化 — 2026-10-10
// 阻断问题修复顺序: ①finalUrl修正 ②重新启用+MaxClicks+¥10上限 ③关键词手术 ④负词补全 ⑤5组画像RSA
// AI Max 留到 3-5 天后数据积累再开（见脚本末尾注释）
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24316207812';
const CAMPAIGN_RN = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${CAMPAIGN_ID}`;
const NEW_URL = 'https://www.droneworld.tech/products/c500-delivery-drone';
const STRATEGY_NAME = 'C500-Global MaxClicks cap ¥10 2026-10-10';
const CEILING_CNY = 10;

// ====== 关键词手术 ======
// 删除: 近30天零展示的窄意图词（盘子太薄 + 出价保守 → 永无展示）
// 注: API 返回 keyword.text 带引号（phrase match），匹配时需去掉再比对
const TO_REMOVE_TEXTS = [
  'heavy lift drones for sale', 'heavy payload drone', 'drone payload capacity', 'best payload drone',
  'cargo drone for sale', 'cargo drone price', 'drone cargo transport', 'heavy lift drone services',
  'flycart alternative', 'drone material transport', 'construction lifting drone', 'logging drone',
  'disaster relief drone', 'agricultural transport drone',
  'drone winch', 'drone winch delivery', 'winch drone',
];
// 删词匹配逻辑在 Section ②（allCrit 已查询后）
const TO_ADD = [
  // Reddit 验证词（analysis_report.md 第五节）
  { adGroup: /Industrial/i,   text: 'drone for power line construction', matchType: 'PHRASE' },
  { adGroup: /Industrial/i,   text: 'drone lifting capacity',              matchType: 'PHRASE' },
  { adGroup: /Winch/i,        text: 'payload delivery drone',             matchType: 'PHRASE' },
  { adGroup: /Winch/i,        text: 'heavy lift drone services',          matchType: 'PHRASE' },
  // keyword-ideas cargo 大盘（非消费级配送）
  { adGroup: /Heavy Lift/i,   text: 'heavy lift uav',                    matchType: 'PHRASE' },
  { adGroup: /Heavy Lift/i,   text: 'drone that can carry weight',        matchType: 'PHRASE' },
  { adGroup: /Heavy Lift/i,   text: 'drones that carry packages',          matchType: 'PHRASE' },
  { adGroup: /Industrial/i,   text: 'spray drones for sale',              matchType: 'PHRASE' },
  { adGroup: /Industrial/i,   text: 'agricultural drones for sale',       matchType: 'PHRASE' },
  // 保留 FlyCart 竞品词（有展示且意图对）→ 加 flycart 300/350 长尾
  { adGroup: /FlyCart/i,      text: 'flycart 300',                       matchType: 'PHRASE' },
];
// 负词（承接 NEGATIVES_CARGO 并补强消费级过滤）
const NEGATIVES_ADD = [
  'amazon drone delivery', 'walmart drone delivery', 'zipline drone', 'wing drone',
  'prime air', 'drone food delivery', 'drone parcel delivery', 'personal transport',
];

// ====== 5 组画像 RSA（headline ≤30 / description ≤80）======
// 画像: Reddit 挖掘的四大场景（SAR/电力基建/高海拔/绞盘投送）+ FlyCart 买家找替代品 + 满载续航打假
const COPY = {
  'Heavy Lift & Payload': {
    headlines: [
      'C500 Heavy-Lift Drone',           '240 kg Max Payload',             '720 kg Cluster Lifting',
      'Why Settle for 80kg?',            'Bigger Than FlyCart 100',        'Faster Than Helicopter',
      'Cheaper Than Cable Car',          'No Scaffold, No Crane',          'Rugged Industrial-Grade',
      'Factory Direct Pricing',          'Get a Transparent Quote',        'Winch Ready',
      '35 km Flight Range',              '6000 m Service Ceiling',         'Request a Demo',
    ],
    descriptions: [
      '240kg payload, 720kg cluster, 35km range. Winch-ready heavy-lift UAV.',
      'FlyCart 100 maxes at 82kg. C500 carries 240kg. Factory direct pricing.',
      'Skip the helicopter or cable car. Drone lifting at a fraction of the cost.',
      'No crane, no scaffold, no rope access. Lift material faster, safer, cheaper.',
    ],
  },
  'Cargo & Freight': {
    headlines: [
      'Industrial Cargo UAV',            'Heavy Freight by Drone',         'Lift Where Trucks Cannot',
      'Remote Site Material Transport',  'Mountain Logistics Drone',       'Replace Helicopter Runs',
      'Solar Farm Supply Drone',         'Steel & Timber Transport',       'Emergency Resupply',
      'Winch Drop Precision',            'Factory Direct Pricing',         'No Middlemen',
      'Commercial-Grade UAV',            'Scale Your Logistics',           'Get a Quote',
    ],
    descriptions: [
      'Industrial cargo UAV for steel, timber, solar supplies, emergency resupply.',
      'Lift material to remote construction sites, mountain towers, solar farms.',
      'Drone freight: faster than trucks on rough terrain, cheaper than helicopters.',
      'Factory-direct heavy-lift UAV. Transparent pricing, global shipping.',
    ],
  },
  'Winch & Delivery': {
    headlines: [
      'Electric Smart Winch',            'Precision Hover Drop',           'Payload Delivery Drone',
      'Winch Ready UAV',                 'Emergency Supply Drops',         'Solar Farm Maintenance',
      'No Scaffold Winch Lifting',       'Remote Site Resupply',           'Winch for Construction',
      'Cargo-Aware Flight',              'Auto CG Compensation',            'Factory Direct',
      'Commercial Winch UAV',            'Get a Quote',                    'Request a Demo',
    ],
    descriptions: [
      'Electric smart winch for precision payload delivery. Emergency drops, solar.',
      'Winch lifting without scaffold or crane. Auto CG compensation for stability.',
      'Payload delivery drone with smart winch. Industrial-grade, not modified camera drone.',
      'Factory-direct winch UAV. Transparent pricing. Request a demo today.',
    ],
  },
  'FlyCart Alternative': {
    headlines: [
      'Better Than DJI FlyCart',          'More Payload Than FlyCart 100',  'Cheaper Than FlyCart 200',
      '240 kg vs 82 kg',                  'DJI FlyCart Alternative',        'FlyCart 30 Upgrade Path',
      'Fully Industrial-Grade',          'Not a Consumer Drone',           'Winch Included',
      'Factory Direct Pricing',          'No DJI Markup',                  'Transparent Quote Fast',
      'Commercial-Grade UAV',            'Request a Demo',                 'Get a Quote Today',
    ],
    descriptions: [
      'DJI FlyCart 100 maxes at 82kg. C500 carries 240kg. Factory direct, winch included.',
      'Factory-direct pricing. No DJI markup. Industrial-grade heavy-lift UAV.',
      'FlyCart 30 too small, FlyCart 200 too slow? C500: 240kg, 35km, winch-ready.',
      'Full spec sheet, transparent quote. Compare payload, winch, service ceiling.',
    ],
  },
  'Industrial Scenarios': {
    headlines: [
      'Solar Farm Transport',             'Construction Lifting',           'Telecom Tower Supply',
      'Power Line Material Drone',        'Emergency Relief Drops',         'Search & Rescue Gear',
      'Mountain Logistics',               'Heavy Equipment Placement',      'Rooftop Delivery',
      'Factory Direct Pricing',           'Winch Ready',                    'Faster Than Helicopter',
      'Cheaper Than Crane',               'Commercial-Grade UAV',           'Get a Quote',
    ],
    descriptions: [
      'Drone material transport for solar farms, construction, telecom, power lines.',
      'Lift gear to remote construction sites and mountain telecom towers.',
      'Emergency relief drops, SAR gear delivery, solar farm maintenance supply.',
      'Factory-direct heavy-lift UAV for power line, construction, disaster relief.',
    ],
  },
};

async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /aborted|ECONNRESET|ETIMEDOUT|ECONNREFUSED|UND_ERR|timeout|premature|socket|fetch failed|5\d\d/i.test(msg);
      if (!retryable || i === attempts) throw e;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 80)})，重试...`);
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

// ====== ① 重新启用 + Maximize Clicks ¥10 上限 ======
console.log('=== ① 出价 + 启用 ===');
// 幂等策略查找
const existing = await withRetry(() => customer.query(`
  SELECT bidding_strategy.id FROM bidding_strategy WHERE bidding_strategy.name = '${STRATEGY_NAME}'
`), '查策略');
let bsRn;
if (existing.length) {
  bsRn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/biddingStrategies/${existing[0].bidding_strategy.id}`;
  console.log(`  复用策略 id=${existing[0].bidding_strategy.id}`);
} else {
  await withRetry(() => customer.biddingStrategies.create([{
    name: STRATEGY_NAME, type: 'TARGET_SPEND',
    target_spend: { cpc_bid_ceiling_micros: String(CEILING_CNY * 1e6) },
  }]), '建策略');
  const chk = await withRetry(() => customer.query(`
    SELECT bidding_strategy.id FROM bidding_strategy WHERE bidding_strategy.name = '${STRATEGY_NAME}'
  `), '回查');
  bsRn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/biddingStrategies/${chk[0].bidding_strategy.id}`;
  console.log(`  新建策略 id=${chk[0].bidding_strategy.id}`);
}
// 启用 + 挂载策略
await withRetry(() => customer.campaigns.update([{
  resource_name: CAMPAIGN_RN,
  status: 'ENABLED',
  bidding_strategy: bsRn,
}]), '启用+出价');
const vbid = await withRetry(() => customer.query(`
  SELECT campaign.status, campaign.bidding_strategy_type FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}
`), '验证');
console.log(`  状态=${vbid[0].campaign.status} (2=ENABLED) | bid=${vbid[0].campaign.bidding_strategy_type} (9=MaxClicks) ✓`);

// ====== ② 关键词手术 ======
console.log('\n=== ② 删零展示词 ===');
const allCrit = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.resource_name, ad_group_criterion.keyword.text
  FROM ad_group_criterion WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group_criterion.type = 'KEYWORD'
`), '查全部关键词');
// API 返回 text 带引号（phrase match），构造两个查找 key
const rnByLower = new Map();
for (const r of allCrit) {
  const raw = r.ad_group_criterion.keyword.text;
  const clean = raw.replace(/^"|"$/g, '').toLowerCase().trim();
  rnByLower.set(raw.toLowerCase(), r.ad_group_criterion.resource_name);
  rnByLower.set(clean, r.ad_group_criterion.resource_name);
}
const removeRns = [];
for (const t of TO_REMOVE_TEXTS) {
  const rn = rnByLower.get(t.toLowerCase());
  if (rn) { removeRns.push(rn); console.log(`  删 "${t}"`); }
  else console.log(`  ⚠ 未找到 "${t}"`);
}
if (removeRns.length) await withRetry(() => customer.adGroupCriteria.remove(removeRns), '批量删词');
console.log(`  ✅ 已删除 ${removeRns.length} 个词`);

console.log('\n=== ③ 新增 B2B 词 ===');
const groups = await withRetry(() => customer.query(`
  SELECT ad_group.resource_name, ad_group.name FROM ad_group WHERE campaign.id = ${CAMPAIGN_ID}
`), '查广告组');
for (const spec of TO_ADD) {
  const g = groups.find(x => spec.adGroup.test(x.ad_group.name));
  if (!g) { console.log(`  ⚠ 未匹配 "${spec.adGroup}"`); continue; }
  try {
    await withRetry(() => customer.adGroupCriteria.create([{
      status: 'ENABLED', ad_group: g.ad_group.resource_name,
      keyword: { text: spec.text, match_type: spec.matchType },
    }]), `加词 ${spec.text}`);
    console.log(`  ✅ + "${spec.text}" → [${g.ad_group.name}]`);
  } catch (e) {
    if (/already exists|DUPLICATE/i.test(tryMsg(e))) console.log(`  已存在 "${spec.text}"`);
    else throw e;
  }
}

// ====== ④ 负词 ======
console.log('\n=== ④ 补全负词 ===');
const existingNeg = await withRetry(() => customer.query(`
  SELECT campaign_criterion.keyword.text FROM campaign_criterion
  WHERE campaign.id = ${CAMPAIGN_ID} AND campaign_criterion.negative = TRUE AND campaign_criterion.type = 'KEYWORD'
`), '查负词');
const negSet = new Set(existingNeg.map(r => r.campaign_criterion.keyword.text.toLowerCase()));
for (const t of NEGATIVES_ADD) {
  if (negSet.has(t)) { console.log(`  已存在 "${t}"`); continue; }
  await withRetry(() => customer.campaignCriteria.create([{
    campaign: CAMPAIGN_RN, negative: true,
    keyword: { text: t, match_type: 'PHRASE' },
  }]), `负词 ${t}`);
  console.log(`  ✅ - "${t}" (phrase)`);
}

// ====== ⑤ 5 组画像 RSA（finalUrl 修正为正确 slug）======
console.log('\n=== ⑤ 新建画像 RSA（finalUrl 修正）===');
const groupRn = new Map(groups.map(r => [r.ad_group.name, r.ad_group.resource_name]));
for (const [gname, copy] of Object.entries(COPY)) {
  const rn = groupRn.get(gname);
  if (!rn) { console.log(`  ⚠ 未找到 ${gname}`); continue; }
  const created = await withRetry(() => customer.adGroupAds.create([{
    status: 'ENABLED', ad_group: rn,
    ad: {
      final_urls: [NEW_URL],
      responsive_search_ad: {
        headlines: copy.headlines.map(t => ({ text: t })),
        descriptions: copy.descriptions.map(t => ({ text: t })),
      },
    },
  }]), `RSA ${gname}`);
  const aid = created?.results?.[0]?.resource_name || JSON.stringify(created).slice(0, 120);
  console.log(`  ✅ [${gname}] ${aid}`);
}

// ====== ⑥ 最终验证 ======
console.log('\n=== ⑥ 最终验证 ===');
const finalKws = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.status
  FROM ad_group_criterion WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group_criterion.type = 'KEYWORD'
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
console.log(`  负词 (${finalNeg.length}): ${finalNeg.map(r => r.campaign_criterion.keyword.text).join(' | ')}`);
const finalAds = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}
`), '终验广告');
for (const r of finalAds) {
  const s = r.ad_group_ad.status === 2 ? 'ENABLED' : r.ad_group_ad.status === 3 ? 'PAUSED' : r.ad_group_ad.status;
  const fu = r.ad_group_ad.ad.final_urls?.[0] || '-';
  const urlOk = fu.includes('c500-delivery-drone') ? '✅' : '⚠';
  console.log(`  [${r.ad_group.name}] AD ${r.ad_group_ad.ad.id} ${s} ${urlOk} ${fu}`);
}

console.log(`\n✅ C500 优化完成`);
console.log(`\n⚠ AI Max for Search 开启：需等 3-5 天有点击/搜索词数据后再开`);
console.log(`   开启方法: customer.campaigns.update([{ resource_name: CAMPAIGN_RN, ai_max_setting: { enable_ai_max: true } }])`);
console.log(`   文档: https://developers.google.com/google-ads/api/docs/campaigns/ai-max-for-search-campaigns/getting-started`);
console.log(`   开启前确认: 保留所有现有负词（AI Max 会自动扩 broad match）`);

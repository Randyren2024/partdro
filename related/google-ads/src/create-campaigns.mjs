// 创建广告系列（默认 PAUSED 暂停状态，到界面确认后手动启用）
// 用法: node src/create-campaigns.mjs d15r | c15 | d15r-de | c15-de
// google-ads-api v25: create() 接收数组、返回数组
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const WHICH = process.argv[2];
if (!['d15r', 'c15', 'd15r-de', 'c15-de', 'c500', 's150'].includes(WHICH)) {
  console.error('用法: node src/create-campaigns.mjs d15r|c15|d15r-de|c15-de|c500|s150');
  process.exit(1);
}

const NEGATIVES = ['military', 'drone strike', 'surveillance', 'weapon', 'dog', 'pet', 'toy', 'fpv', 'racing', 'camera drone', 'agriculture'];
const NEGATIVES_DE = [...NEGATIVES, 'militär', 'waffe', 'spielzeug', 'kamera drohne', 'landwirtschaft', 'hund', 'haustier'];
// cargo 系列否定词（Reddit 挖掘结论：军事/载人/消费级新闻流量全过滤；注意不能否定 agriculture——农用运输是 C500/S150 目标场景）
const NEGATIVES_CARGO = ['military', 'drone strike', 'weapon', 'kamikaze', 'shahed', 'fpv', 'racing', 'toy', 'camera drone', 'passenger drone', 'manned drone', 'personal transport drone', 'flying car', 'evtol', 'amazon drone delivery', 'walmart drone delivery', 'zipline drone'];
const GEO_IDS = { US: 2840, CA: 2124, AU: 2036, GB: 2826, DE: 2276, FR: 2250 }; // Presence targeting
const GEO_SETS = { GLOBAL: ['US', 'CA', 'AU', 'GB', 'DE', 'FR'], DE: ['DE'] };
const BUDGET_DAILY = 20_000_000; // micros = ¥20

const CAMPAIGNS = {
  d15r: {
    name: 'D15R - Search - Global',
    geoSet: 'GLOBAL', langId: 1000, langLabel: 'EN', negatives: NEGATIVES,
    finalUrl: 'https://www.droneworld.tech/products/d15r',
    paths: ['partdro', 'd15r'],
    adGroups: [
      { name: 'Facade & Window', keywords: ['"facade cleaning drone"', '"window cleaning drone"', '"building washing drone"', '"drone window cleaning"'] },
      { name: 'Solar Panel', keywords: ['"solar panel cleaning drone"', '"solar cleaning drone"', '"drone solar panel cleaning"'] },
      { name: 'High-Rise', keywords: ['"high rise cleaning drone"', '"skyscraper cleaning drone"', '"drone pressure washing"'] },
      { name: 'Competitor', keywords: ['"joyance drone"', '"lucid bots sherpa"', '"dji cleaning drone"'] },
    ],
    headlines: ['D15R Cleaning Drone', '20MPa Facade Cleaning UAV', 'RTK Precision Cleaning', 'No Scaffolding Needed', 'Clean Facades & Solar', 'FAA Part 107 Ready', 'Request a Live Demo', 'Washing UAV Expert', 'Tethered Water Supply', 'Smart Route Planning'],
    descriptions: [
      '20 MPa pressure cleaning for facades, solar panels and wind turbines. RTK precision.',
      'Replace scaffolding and rope access. One operator, tethered water, 100 m reach.',
      'Real before/after results. Quote, ROI calculator and demo from our engineers.',
    ],
  },
  c15: {
    name: 'C15 - Search - Global',
    geoSet: 'GLOBAL', langId: 1000, langLabel: 'EN', negatives: NEGATIVES,
    finalUrl: 'https://www.droneworld.tech/products/c15',
    paths: ['partdro', 'c15'],
    adGroups: [
      { name: 'Facade & Glass', keywords: ['"facade washing drone"', '"glass curtain wall cleaning drone"', '"drone facade washing"'] },
      { name: 'Wind Turbine', keywords: ['"wind turbine blade cleaning drone"', '"wind turbine cleaning drone"'] },
      { name: 'High-Pressure', keywords: ['"high pressure cleaning drone"', '"pressure washing drone"'] },
    ],
    headlines: ['C15 Cleaning Drone', '16MPa Facade Washing UAV', '21kg One-Operator UAV', '100m Working Height', '120m Pressure Hose', 'IP67 All-Weather', 'Factory Direct Shipping', 'Wind Turbine Cleaning', 'Tethered Supply', 'Get Your Quote Today'],
    descriptions: [
      '16 MPa washing for facades, glass curtain walls and wind turbine blades.',
      '21 kg airframe, 120 m hose, up to 100 m working height, one person only.',
      'Tethered water for continuous cleaning. IP67. Get a quote from Partdro.',
    ],
  },
  // ---- 德语市场（DE 定向 + 德语语言 + ?lang=de 落地）----
  // 选词依据 data/keyword-ideas-DE.md：D15R 拿头部词(reinigungsdrohne 480/月)+Fassade+PV；
  // C15 拿差异化场景(Windkraft/Fenster/Hochdruck)，避免同词内耗
  'd15r-de': {
    name: 'D15R - Search - DE',
    geoSet: 'DE', langId: 1001, langLabel: 'DE', negatives: NEGATIVES_DE,
    finalUrl: 'https://www.droneworld.tech/products/d15r?lang=de',
    paths: ['partdro', 'd15r'],
    adGroups: [
      { name: 'Reinigungsdrohne', keywords: ['"reinigungsdrohne"', '"gebäudereinigung drohne"'] },
      { name: 'Fassade', keywords: ['"fassadenreinigung drohne"', '"fassadenreinigungsdrohne"', '"fassadenreinigung maschine"', '"fassadenreinigungsroboter"'] },
      { name: 'Solar & PV', keywords: ['"pv reinigung drohne"', '"solarreinigung drohne"', '"photovoltaik reinigung drohne"', '"solaranlagen reinigung drohne"'] },
    ],
    headlines: ['D15R Reinigungsdrohne', '20 MPa Fassadenreinigung', '1.000 m²/h Reinigung', 'Ohne Gerüst Reinigen', 'Fassaden & PV-Module', 'RTK-Präzision', '100 m Wasserschlauch', 'Intelligente Routenplanung', 'Jetzt Demo anfragen', 'Ferngesteuert & Sicher'],
    descriptions: [
      '20 MPa Hochdruckreinigung für Fassaden, PV-Module und Windkraftanlagen. RTK-Präzision.',
      'Ersetzen Sie Gerüste und Seilzug. Ein Bediener, 100 m Schlauch, 1.000 m²/h Leistung.',
      'Echte Vorher-Nachher-Ergebnisse. Angebot und Demo von unseren Ingenieuren.',
    ],
  },
  'c15-de': {
    name: 'C15 - Search - DE',
    geoSet: 'DE', langId: 1001, langLabel: 'DE', negatives: NEGATIVES_DE,
    finalUrl: 'https://www.droneworld.tech/products/c15?lang=de',
    paths: ['partdro', 'c15'],
    adGroups: [
      { name: 'Fassade & Fenster', keywords: ['"fensterreinigung drohne"', '"drohne gebäudereinigung"', '"glasfassade reinigung drohne"'] },
      { name: 'Windkraft', keywords: ['"windrad reinigung drohne"', '"windkraftanlagen reinigung drohne"', '"windkraft reinigung drohne"'] },
      { name: 'Hochdruck', keywords: ['"hochdruckreinigung drohne"', '"hochdruckreiniger drohne"'] },
    ],
    headlines: ['C15 Reinigungsdrohne', '16 MPa Fassadenreinigung', '21 kg — Ein Bediener', '100 m Arbeitshöhe', '120 m Hochdruckschlauch', 'IP67 Wetterfest', 'Windkraftanlagen Reinigung', 'Direkt Ab Werk', 'Jetzt Angebot Einholen', 'Ohne Gondel & Gerüst'],
    descriptions: [
      '16 MPa Reinigung für Fassaden, Glasvorhangfassaden und Windkraftanlagen-Rotorblätter.',
      '21 kg Zelle, 120 m Schlauch, bis zu 100 m Arbeitshöhe — nur ein Bediener nötig.',
      'Schlauchgebundene Wasserversorgung für Dauerbetrieb. IP67. Angebot von Partdro.',
    ],
  },
  // ---- 运载/重载无人机（依据 data/cargo/analysis_report.md + keyword-ideas-US-cargo.md）----
  // 三大 phrase 集群：agricultural spraying（4400/月，HIGH 竞争）+ heavy lift（1600）+ payload capacity
  // Reddit 验证：100-160kg 是市场空白带，绞盘是核心卖点，满载航程必须实标
  c500: {
    name: 'C500 - Search - Global',
    geoSet: 'GLOBAL', langId: 1000, langLabel: 'EN', negatives: NEGATIVES_CARGO,
    finalUrl: 'https://www.droneworld.tech/products/c500',
    paths: ['partdro', 'c500'],
    adGroups: [
      { name: 'Heavy Lift & Payload', keywords: ['"heavy lift drone"', '"heavy lift drones for sale"', '"heavy payload drone"', '"drone payload capacity"', '"best payload drone"'] },
      { name: 'Cargo & Freight', keywords: ['"cargo drone"', '"cargo drone for sale"', '"cargo drone price"', '"drone cargo transport"', '"heavy lift drone services"'] },
      { name: 'Winch & Delivery', keywords: ['"winch drone"', '"drone winch"', '"drone winch delivery"', '"payload delivery drone"'] },
      { name: 'FlyCart Alternative', keywords: ['"dji flycart"', '"flycart 30"', '"flycart 100"', '"flycart 200"', '"flycart alternative"'] },
      { name: 'Industrial Scenarios', keywords: ['"drone material transport"', '"construction lifting drone"', '"logging drone"', '"disaster relief drone"', '"agricultural transport drone"'] },
    ],
    headlines: ['C500 Heavy-Lift Drone', '240 kg Max Payload', '720 kg Cluster Lifting', '35 km Flight Range', '6000 m Service Ceiling', 'Electric Smart Winch', 'Solar Farm Material UAV', 'Emergency Supply Drops', 'Factory Direct Pricing', 'Transparent Quote Fast', 'Heavy Cargo UAV Expert', 'Mountain Logistics Drone', 'Winch Precision Delivery', 'Precision Hover Drop'],
    descriptions: [
      '240 kg single payload, 720 kg cluster lifting, 35 km range, 6000 m ceiling. Winch ready.',
      'Factory-direct heavy-lift cargo UAV for solar farms, timber, steel and emergency supply.',
      'Transparent quotes from Partdro engineers. No pricing walls. Global shipping.',
    ],
  },
  s150: {
    name: 'S150 - Search - Global',
    geoSet: 'GLOBAL', langId: 1000, langLabel: 'EN', negatives: NEGATIVES_CARGO,
    finalUrl: 'https://www.droneworld.tech/products/s150',
    paths: ['partdro', 's150'],
    adGroups: [
      { name: 'Heavy Lift 150 kg', keywords: ['"150kg drone"', '"heavy lift drone price"', '"heavy lift drone cost"', '"long range heavy lift drone"'] },
      { name: 'Industrial Freight', keywords: ['"heavy cargo drone"', '"industrial delivery drone"', '"freight drone"', '"drone logistics"'] },
      { name: 'Agriculture Transport', keywords: ['"agricultural transport drone"', '"agri cargo drone"', '"farm cargo drone"'] },
    ],
    headlines: ['S150 Cargo Drone', '150 kg Max Payload', 'Industrial Cargo UAV', 'Heavy Lift Drone', 'Electric Winch Option', 'Construction Site Lifts', 'Agricultural Logistics', 'Emergency Response UAV', 'Factory Direct Pricing', 'Get a Quote Today', 'Long Range Cargo Flights', 'Partdro Heavy-Lift UAV'],
    descriptions: [
      '150 kg heavy-lift cargo drone for industrial transport. Electric winch option available.',
      'Built for solar farms, logging, construction and disaster response. Request a quote.',
      'Partdro factory-direct UAVs: global shipping, engineer support, transparent pricing.',
    ],
  },
};

const spec = CAMPAIGNS[WHICH];

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
});

const err = e => (e?.errors || [{ message: e.message }]).map(x => `${x.message}${x.location?.field_path_elements ? ' @' + x.location.field_path_elements.map(f => f.field_name ?? f.index ?? '').join('.') : ''}${x.trigger?.int64_value || x.trigger?.string_value ? ` (trigger=${x.trigger.int64_value || x.trigger.string_value})` : ''}`).join('\n  ');
// v25: create 返回 { results: [...], partial_failure_error }；统一取 resource_name
async function create1(service, payload) {
  const res = await service.create([payload]);
  const first = Array.isArray(res) ? res[0] : res?.results ? res.results[0] : res;
  return typeof first === 'string' ? first : first?.resource_name;
}

// 0) 幂等：同名系列已存在则退出
const existing = await customer.report({
  entity: 'campaign',
  attributes: ['campaign.id', 'campaign.name'],
  constraints: { 'campaign.name': spec.name },
  limit: 1,
}).catch(e => { console.error('查询现有系列失败:', err(e)); process.exit(1); });
if (existing.length) {
  console.log(`⚠️ 系列 "${spec.name}" 已存在 (id=${existing[0].campaign.id})，跳过。如需重建请先在界面删除。`);
  process.exit(0);
}

// 1) 预算
const budgetRn = await create1(customer.campaignBudgets, {
  amount_micros: String(BUDGET_DAILY),
  delivery_method: 'STANDARD',
  explicitly_shared: false,
}).catch(e => { console.error('创建预算失败:', err(e)); process.exit(1); });
console.log('✅ 预算:', budgetRn);

// 1.5) 组合竞价策略（v25 标准策略空消息会被剥/上限仅组合策略可用 → 用组合 Maximize Conversions）
const bsRn = await create1(customer.biddingStrategies, {
  name: `MC-${WHICH.toUpperCase()}-portfolio`,
  type: 'MAXIMIZE_CONVERSIONS',
  maximize_conversions: { cpc_bid_ceiling_micros: '100000000' }, // ¥100 上限
}).catch(e => { console.error('创建竞价策略失败:', err(e)); process.exit(1); });
console.log('✅ 竞价策略:', bsRn);

// 2) 系列（PAUSED，仅 Google 搜索网络，组合 Maximize Conversions）
const campRes = await create1(customer.campaigns, {
  name: spec.name,
  advertising_channel_type: 'SEARCH',
  status: 'PAUSED',
  campaign_budget: budgetRn, // v25 字段名（旧名 budget 已弃用）
  bidding_strategy: bsRn,
  contains_eu_political_advertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING', // v25 新增必填
  network_setting: { target_google_search: true, target_search_network: false, target_content_network: false },
}).catch(e => { console.error('创建系列失败:', err(e)); process.exit(1); });
console.log('✅ 系列:', campRes);

// 3) 地理位置 + 语言（v25: 必须用嵌套 location/location.language 形状）
const geoKeys = GEO_SETS[spec.geoSet];
const crits = [
  ...geoKeys.map(k => ({ campaign: campRes, status: 'ENABLED', location: { geo_target_constant: `geoTargetConstants/${GEO_IDS[k]}` } })),
  { campaign: campRes, status: 'ENABLED', language: { language_constant: `languageConstants/${spec.langId}` } },
];
await customer.campaignCriteria.create(crits)
  .catch(e => console.error('⚠️ 地区/语言部分失败:', err(e)));
console.log(`✅ 地区(${geoKeys.join(',')}) + 语言(${spec.langLabel})`);

// 4) 系列级否定关键词（广泛匹配）
await customer.campaignCriteria.create(
  spec.negatives.map(kw => ({ campaign: campRes, status: 'ENABLED', negative: true, keyword: { text: kw, match_type: 'BROAD' } }))
).then(() => console.log(`✅ 否定关键词 x${spec.negatives.length}`))
 .catch(e => console.error('⚠️ 否定词失败:', err(e)));

// 5) 广告组 + 关键词
const agNames = [];
for (const g of spec.adGroups) {
  const agRn = await create1(customer.adGroups, {
    name: g.name,
    campaign: campRes,
    status: 'PAUSED',
    type: 'SEARCH_STANDARD',
  }).catch(e => { console.error(`创建广告组 ${g.name} 失败:`, err(e)); return null; });
  if (!agRn) continue;
  agNames.push(agRn);
  await customer.adGroupCriteria.create(
    g.keywords.map(text => ({ ad_group: agRn, status: 'ENABLED', keyword: { text, match_type: 'PHRASE' } }))
  ).catch(e => console.error(`⚠️ 关键词失败(${g.name}):`, err(e)));
  console.log(`✅ 广告组: ${g.name}（关键词 x${g.keywords.length}）`);
}

// 6) RSA 挂到第一个广告组（v25: RSA 内容在 responsive_search_ad 嵌套内；display paths 已废弃移除）
if (agNames.length) {
  await create1(customer.adGroupAds, {
    ad_group: agNames[0],
    status: 'PAUSED',
    ad: {
      type: 'RESPONSIVE_SEARCH_AD',
      final_urls: [spec.finalUrl],
      responsive_search_ad: {
        headlines: spec.headlines.map(text => ({ text })),
        descriptions: spec.descriptions.map(text => ({ text })),
      },
    },
  }).then(() => console.log(`✅ RSA 挂载到 "${spec.adGroups[0].name}"（其余广告组可在界面复制该 RSA，或告诉我补挂）`))
    .catch(e => console.error('⚠️ RSA 失败:', err(e)));
}

console.log(`\n完成：${spec.name} 已创建（暂停状态）。请到 ads.google.com 检查后手动启用。`);

// D15R-DE RSA v3：基于 KALZ Group 买家画像（集团扩展型 B2B）为三个广告组各新建 1 条差异化 RSA
// 不暂停 v2 → v2 + v3 同时跑，Google ad rotation 均分展示，3-5 天后对比 CTR
// 字符限制: headline ≤ 30, description ≤ 90 (实际安全线 80)
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';

// ============ 三组差异化文案（全部经 check-len.mjs 验证通过）============

const HEADLINES_REINIGUNGSDROHNE = [
  'Reinigungsdrohne D15R',          // 21
  'Geschäft erweitern?',             // 19 (画像钩子)
  'Neuer Service: Drohne',           // 21 (画像钩子)
  'Drohne für Unternehmen',          // 22 (集团)
  'Warum Regen nicht reicht',        // 24 (Regen-Mythos)
  'PV-Reinigung ohne Gerüst',        // 24
  'Skalierbare Reinigung',           // 21 (画像: 规模化)
  'ROI durch Drohne',                // 16 (画像: 投资回报)
  'Fassade & PV reinigen',           // 21
  'Drohne statt Gerüst',             // 19
  'Für Reinigungsfirmen',            // 20 (B2B 筛选)
  'B2B Reinigungsdrohne',            // 20
  'Ohne Seilzug',                    // 12
  'D15R Drohne kaufen',              // 18
  'Angebot anfordern',               // 17 (CTA)
];
const DESCRIPTIONS_REINIGUNGSDROHNE = [
  'Erweitern Sie Ihr Angebot: Drohnenreinigung für Fassade & PV. Ohne Gerüst.',         // 73 ✅
  'Warum Regen nicht reicht: Flechten, Pollenfilm kosten Ertrag.',                       // 61 ✅
  'PV-Reinigung ohne Gerüst: Drohne statt Seilzug. Für Reinigungsfirmen.',              // 69 ✅
  'D15R: Fassade, Solar, Fenster. Skalierbar für mehrere Standorte.',                   // 64 ✅
];

const HEADLINES_FASSADE = [
  'Fassadenreinigung Drohne',        // 24
  'Immobilienpflege 2.0',            // 20 (画像: 物业)
  'Geschäft erweitern?',             // 19 (画像钩子)
  'Fassade ohne Gerüst',             // 19
  'Drohne für Immobilien',           // 21 (画像: 物业)
  'Keine Gerüstkosten',              // 18 (画像: 成本)
  'Gebäudeeffizienz steigern',       // 25 (画像)
  'Skalierbare Fassadereinigung',    // 28 (画像: 规模化)
  'B2B Fassadenreinigung',           // 21
  'Drohne statt Gerüst',             // 19
  'Für Reinigungsfirmen',            // 20
  'Gebäudepflege mit Drohne',        // 24
  'Mehrere Standorte?',              // 18 (画像: 集团多站点)
  'D15R Fassade Drohne',             // 19
  'Jetzt Angebot holen',             // 19 (CTA)
];
const DESCRIPTIONS_FASSADE = [
  'Immobilienpflege mit Drohne: Fassade ohne Gerüst. Für Immobilien.',                   // 65 ✅
  'Keine Gerüstkosten. Drohne reinigt Fassade & PV. Skalierbar.',                        // 60 ✅
  'Fassadenreinigung 2.0: Drohne statt Gerüst. ROI ab Tag 1.',                           // 57 ✅
  'D15R: Fassade & Solar. Eine Drohne, zwei Services.',                                  // 50 ✅
];

const HEADLINES_SOLAR = [
  'Solarpanel reinigen',             // 19
  'Warum Regen nicht reicht',        // 24 (Regen-Mythos)
  'PV-Reinigung ohne Gerüst',        // 24
  'Drohne für Unternehmen',          // 22 (画像: 集团)
  'Ertrag steigern',                 // 15 (B2B)
  'Flechten entfernen',              // 18 (Reddit)
  'Pollenfilm weg',                  // 14 (Reddit)
  'Geschäft erweitern?',             // 19 (画像钩子)
  'B2B PV-Reinigung',                // 16
  'Für Reinigungsfirmen',            // 20
  'Drohne statt Seilzug',            // 20
  'Solarreinigung Drohne',           // 21
  'Mehr Ertrag durch Drohne',        // 24
  'D15R Solar Drohne',               // 17
  'Angebot anfordern',               // 17 (CTA)
];
const DESCRIPTIONS_SOLAR = [
  'Warum Regen nicht reicht: Flechten, Pollenfilm kosten Ertrag.',                       // 61 ✅
  'Erweitern Sie Ihr Angebot: PV-Reinigung mit Drohne. Skalierbar. B2B.',                // 68 ✅
  'Solarpanel reinigen ohne Gerüst. Entmineralisiertes Wasser.',                         // 59 ✅
  'D15R: Solar & Fassade. Skalierbar für mehrere Standorte.',                            // 56 ✅
];

// 广告组名 → 文案组映射
const ADGROUP_COPY_MAP = [
  { match: /Reinigungsdrohne/i, headlines: HEADLINES_REINIGUNGSDROHNE, descriptions: DESCRIPTIONS_REINIGUNGSDROHNE },
  { match: /Fassade/i,          headlines: HEADLINES_FASSADE,          descriptions: DESCRIPTIONS_FASSADE },
  { match: /Solar|PV/i,         headlines: HEADLINES_SOLAR,            descriptions: DESCRIPTIONS_SOLAR },
];

// ============ 辅助 ============
async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /aborted|ECONNRESET|ETIMEDOUT|ECONNREFUSED|UND_ERR|timeout|premature|socket|fetch failed|5\d\d/i.test(msg);
      if (!retryable || i === attempts) throw e;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 80)})，${wait / 1000}s 后重试...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// ============ 主流程 ============
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

// Step 1: 查询广告组 + final_urls
console.log('=== Step 1: 查询广告组 ===\n');
const adGroups = await withRetry(() => customer.query(`
  SELECT ad_group.resource_name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}
`), '查询广告组');

const byAdGroup = new Map();
let FINAL_URLS = null;
for (const r of adGroups) {
  const key = r.ad_group.resource_name;
  if (!byAdGroup.has(key)) byAdGroup.set(key, { resourceName: key, name: r.ad_group.name, ads: [] });
  const g = byAdGroup.get(key);
  g.ads.push({ id: r.ad_group_ad.ad.id, status: r.ad_group_ad.status });
  if (!FINAL_URLS) FINAL_URLS = r.ad_group_ad.ad.final_urls;
}

console.log(`共 ${byAdGroup.size} 个广告组, final_urls: ${FINAL_URLS}`);
for (const [, g] of byAdGroup) {
  const e = g.ads.filter(a => a.status === 2).length;
  const p = g.ads.filter(a => a.status === 3).length;
  console.log(`  [${g.name}] ENABLED: ${e} / PAUSED: ${p}`);
}

// Step 2: 为每个广告组创建 v3 RSA
console.log('\n=== Step 2: 创建 v3 RSA ===\n');
for (const [adGroupRn, g] of byAdGroup) {
  const matcher = ADGROUP_COPY_MAP.find(m => m.match.test(g.name));
  if (!matcher) { console.log(`  ⚠ 跳过 [${g.name}]`); continue; }

  console.log(`  [${g.name}] 创建 v3 RSA (${matcher.headlines.length}H / ${matcher.descriptions.length}D)...`);

  const newAd = await withRetry(() => customer.adGroupAds.create([{
    status: 'ENABLED',
    ad_group: adGroupRn,
    ad: {
      final_urls: FINAL_URLS,
      responsive_search_ad: {
        headlines: matcher.headlines.map(t => ({ text: t })),
        descriptions: matcher.descriptions.map(t => ({ text: t })),
      },
    },
  }]), `创建v3 RSA [${g.name}]`);

  const newId = newAd?.results?.[0]?.resource_name || JSON.stringify(newAd).slice(0, 200);
  console.log(`    ✅ ${newId}`);
}

// Step 3: 回读验证
console.log('\n=== Step 3: 回读验证 ===\n');
const check = await withRetry(() => customer.query(`
  SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status,
         ad_group_ad.ad.responsive_search_ad.headlines
  FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID}
  ORDER BY ad_group.name, ad_group_ad.ad.id DESC
`), '回读验证');

const checkByGroup = new Map();
for (const r of check) {
  const gn = r.ad_group.name;
  if (!checkByGroup.has(gn)) checkByGroup.set(gn, []);
  const h = r.ad_group_ad.ad.responsive_search_ad?.headlines || [];
  const s = r.ad_group_ad.status;
  checkByGroup.get(gn).push({
    id: r.ad_group_ad.ad.id,
    status: s === 2 ? 'ENABLED' : s === 3 ? 'PAUSED' : String(s),
    hCount: h.length,
    firstHeadline: h[0]?.text || '-',
  });
}

for (const [gn, ads] of checkByGroup) {
  console.log(`\n  [${gn}]`);
  for (const a of ads) console.log(`    ${a.status.padEnd(8)} | AD ${a.id} | ${a.hCount}H | "${a.firstHeadline}"`);
}

const totalEn = check.filter(r => r.ad_group_ad.status === 2).length;
const totalPa = check.filter(r => r.ad_group_ad.status === 3).length;
console.log(`\n✅ ENABLED: ${totalEn} RSA / PAUSED: ${totalPa} RSA`);
console.log(`\n📊 3-5 天后对比同广告组内 v2 vs v3 的 impressions/CTR/clicks`);

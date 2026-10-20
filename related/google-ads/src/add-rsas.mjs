// 给每个广告组补挂 RSA（跳过已有广告的组）
// 用法: node src/add-rsas.mjs
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

const err = e => (e?.errors || [{ message: e.message }]).map(x => `${x.message}${x.location?.field_path_elements ? ' @' + x.location.field_path_elements.map(f => f.field_name ?? f.index ?? '').join('.') : ''}`).join(' | ');

// 网络抖动/限流重试（ECONNRESET 等）：指数退避
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function retry(fn, label, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const transient = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'aborted', 'socket hang up'].some(s => `${e?.code} ${e?.message}`.includes(s));
      if (!transient || i === tries - 1) throw e;
      console.log(`↻ ${label} 网络错误(${e?.code || e?.message})，${(i + 1) * 5}s 后重试`);
      await sleep((i + 1) * 5000);
    }
  }
}

const SPECS = {
  'C500 - Search - Global': {
    finalUrl: 'https://www.droneworld.tech/products/c500',
    headlines: ['C500 Heavy-Lift Drone', '240 kg Max Payload', '720 kg Cluster Lifting', '35 km Flight Range', '6000 m Service Ceiling', 'Electric Smart Winch', 'Solar Farm Material UAV', 'Emergency Supply Drops', 'Factory Direct Pricing', 'Transparent Quote Fast', 'Heavy Cargo UAV Expert', 'Mountain Logistics Drone', 'Winch Precision Delivery', 'Precision Hover Drop'],
    descriptions: [
      '240 kg single payload, 720 kg cluster lifting, 35 km range, 6000 m ceiling. Winch ready.',
      'Factory-direct heavy-lift cargo UAV for solar farms, timber, steel and emergency supply.',
      'Transparent quotes from Partdro engineers. No pricing walls. Global shipping.',
    ],
  },
  'S150 - Search - Global': {
    finalUrl: 'https://www.droneworld.tech/products/s150',
    headlines: ['S150 Cargo Drone', '150 kg Max Payload', 'Industrial Cargo UAV', 'Heavy Lift Drone', 'Electric Winch Option', 'Construction Site Lifts', 'Agricultural Logistics', 'Emergency Response UAV', 'Factory Direct Pricing', 'Get a Quote Today', 'Long Range Cargo Flights', 'Partdro Heavy-Lift UAV'],
    descriptions: [
      '150 kg heavy-lift cargo drone for industrial transport. Electric winch option available.',
      'Built for solar farms, logging, construction and disaster response. Request a quote.',
      'Partdro factory-direct UAVs: global shipping, engineer support, transparent pricing.',
    ],
  },
  'D15R - Search - Global': {
    finalUrl: 'https://www.droneworld.tech/products/d15r',
    headlines: ['D15R Cleaning Drone', '20MPa Facade Cleaning UAV', 'RTK Precision Cleaning', 'No Scaffolding Needed', 'Clean Facades & Solar', 'FAA Part 107 Ready', 'Request a Live Demo', 'Washing UAV Expert', 'Tethered Water Supply', 'Smart Route Planning'],
    descriptions: [
      '20 MPa pressure cleaning for facades, solar panels and wind turbines. RTK precision.',
      'Replace scaffolding and rope access. One operator, tethered water, 100 m reach.',
      'Real before/after results. Quote, ROI calculator and demo from our engineers.',
    ],
  },
  'C15 - Search - Global': {
    finalUrl: 'https://www.droneworld.tech/products/c15',
    headlines: ['C15 Cleaning Drone', '16MPa Facade Washing UAV', '21kg One-Operator UAV', '100m Working Height', '120m Pressure Hose', 'IP67 All-Weather', 'Factory Direct Shipping', 'Wind Turbine Cleaning', 'Tethered Supply', 'Get Your Quote Today'],
    descriptions: [
      '16 MPa washing for facades, glass curtain walls and wind turbine blades.',
      '21 kg airframe, 120 m hose, up to 100 m working height, one person only.',
      'Tethered water for continuous cleaning. IP67. Get a quote from Partdro.',
    ],
  },
  'D15R - Search - DE': {
    finalUrl: 'https://www.droneworld.tech/products/d15r?lang=de',
    headlines: ['D15R Reinigungsdrohne', '20 MPa Fassadenreinigung', '1.000 m²/h Reinigung', 'Ohne Gerüst Reinigen', 'Fassaden & PV-Module', 'RTK-Präzision', '100 m Wasserschlauch', 'Intelligente Routenplanung', 'Jetzt Demo anfragen', 'Ferngesteuert & Sicher'],
    descriptions: [
      '20 MPa Hochdruckreinigung für Fassaden, PV-Module und Windkraftanlagen. RTK-Präzision.',
      'Ersetzen Sie Gerüste und Seilzug. Ein Bediener, 100 m Schlauch, 1.000 m²/h Leistung.',
      'Echte Vorher-Nachher-Ergebnisse. Angebot und Demo von unseren Ingenieuren.',
    ],
  },
  'C15 - Search - DE': {
    finalUrl: 'https://www.droneworld.tech/products/c15?lang=de',
    headlines: ['C15 Reinigungsdrohne', '16 MPa Fassadenreinigung', '21 kg — Ein Bediener', '100 m Arbeitshöhe', '120 m Hochdruckschlauch', 'IP67 Wetterfest', 'Windkraftanlagen Reinigung', 'Direkt Ab Werk', 'Jetzt Angebot Einholen', 'Ohne Gondel & Gerüst'],
    descriptions: [
      '16 MPa Reinigung für Fassaden, Glasvorhangfassaden und Windkraftanlagen-Rotorblätter.',
      '21 kg Zelle, 120 m Schlauch, bis zu 100 m Arbeitshöhe — nur ein Bediener nötig.',
      'Schlauchgebundene Wasserversorgung für Dauerbetrieb. IP67. Angebot von Partdro.',
    ],
  },
};

for (const [campName, spec] of Object.entries(SPECS)) {
  const ags = await retry(() => customer.report({
    entity: 'ad_group',
    attributes: ['ad_group.id', 'ad_group.name'],
    constraints: { 'campaign.name': campName },
  }), `查询广告组(${campName})`);
  for (const g of ags) {
    const existing = await retry(() => customer.report({
      entity: 'ad_group_ad',
      attributes: ['ad_group_ad.status'],
      constraints: { 'ad_group.id': String(g.ad_group.id) },
    }), `查询广告(${g.ad_group.name})`);
    if (existing.length) {
      console.log(`↷ ${campName} / ${g.ad_group.name} 已有广告，跳过`);
      continue;
    }
    const agRn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${g.ad_group.id}`;
    await retry(() => customer.adGroupAds.create([{
      ad_group: agRn,
      status: 'PAUSED',
      ad: {
        type: 'RESPONSIVE_SEARCH_AD',
        final_urls: [spec.finalUrl],
        responsive_search_ad: {
          headlines: spec.headlines.map(text => ({ text })),
          descriptions: spec.descriptions.map(text => ({ text })),
        },
      },
    }]), `创建RSA(${g.ad_group.name})`)
      .then(() => console.log(`✅ RSA → ${campName} / ${g.ad_group.name} (${spec.finalUrl})`))
      .catch(e => console.error(`⚠️ ${g.ad_group.name}:`, err(e)));
  }
}
console.log('完成。');

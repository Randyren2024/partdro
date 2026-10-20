// 诊断 D15R-DE 系列：定向条件（语言/地理）+ 系列基础字段
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

async function tryQuery(label, gaql) {
  try {
    const rows = await customer.query(gaql);
    console.log(`\n== ${label} ==`);
    console.log(JSON.stringify(rows, null, 1).slice(0, 3000));
  } catch (e) {
    console.error(`\n== ${label} 失败 ==`);
    console.error(String(e?.message || e).slice(0, 400));
    if (e?.errors?.[0]?.message) console.error('API:', e.errors[0].message.slice(0, 300));
  }
}

await tryQuery(
  'DE 系列 campaign_criterion（语言/地理）',
  `SELECT campaign.id, campaign_criterion.type, campaign_criterion.status, campaign_criterion.language.language_constant, campaign_criterion.location.geo_target_constant, campaign_criterion.negative FROM campaign_criterion WHERE campaign.id = 24314545845 AND campaign_criterion.status != 'REMOVED'`,
);

await tryQuery(
  'DE 系列基础字段',
  `SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status, campaign.bidding_strategy_type FROM campaign WHERE campaign.id = 24314545845`,
);

await tryQuery(
  'DE 与 Global 系列预算',
  `SELECT campaign.id, campaign.name, campaign_budget.amount_micros, campaign_budget.status FROM campaign WHERE campaign.id IN (24314545845, 24321754735) AND campaign_budget.status != 'UNKNOWN'`,
);
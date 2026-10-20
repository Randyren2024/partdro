// D15R - Search - DE (24314545845) 日预算 ¥20 → ¥10 — 2026-10-13
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

const rows = await customer.query(`
  SELECT campaign_budget.id, campaign_budget.amount_micros,
         campaign_budget.explicitly_shared
  FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}
`);
const budget = rows[0].campaign_budget;
const before = +budget.amountMicros || +budget.amount_micros;
console.log(`当前预算: ¥${before / 1e6}/天 (budget id=${budget.id}, 共享=${budget.explicitly_shared})`);

const rn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaignBudgets/${budget.id}`;
await customer.campaignBudgets.update([{ resource_name: rn, amount_micros: String(10 * 1e6) }]);

const chk = await customer.query(`
  SELECT campaign_budget.amount_micros FROM campaign_budget
  WHERE campaign_budget.id = ${budget.id}
`);
console.log(`新预算: ¥${(+chk[0].campaign_budget.amount_micros) / 1e6}/天`);

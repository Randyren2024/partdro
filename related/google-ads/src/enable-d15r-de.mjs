// 重新启用 D15R - Search - DE (24314545845) — 2026-10-11
// 背景: Netlify 迁移阿里云 FC 部署完成后恢复投放
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';
const CAMPAIGN_RN = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${CAMPAIGN_ID}`;

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

// 启用前快照
const before = await customer.query(`
  SELECT campaign.name, campaign.status, campaign.bidding_strategy_type,
         campaign_budget.amount_micros
  FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}
`);
const b = before[0].campaign;
const budget = before[0].campaign_budget.amount_micros / 1e6;
console.log(`启用前: ${b.name} | status=${b.status} | bidding=${b.biddingStrategyType || b.bidding_strategy_type} | 日预算=${budget}`);

await customer.campaigns.update([{ resource_name: CAMPAIGN_RN, status: 'ENABLED' }]);

const after = await customer.query(`
  SELECT campaign.name, campaign.status FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}
`);
console.log(`启用后: ${after[0].campaign.name} | status=${after[0].campaign.status}`);

// 列出账户所有组合出价策略
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

const rows = await customer.query(`
  SELECT bidding_strategy.id, bidding_strategy.name, bidding_strategy.type, bidding_strategy.target_spend.cpc_bid_ceiling_micros, bidding_strategy.maximize_conversions.target_cpa_micros
  FROM bidding_strategy
`);
console.log(`共 ${rows.length} 个组合策略:`);
for (const r of rows) {
  const bs = r.bidding_strategy;
  console.log(`  [${bs.id}] ${bs.name} | type=${bs.type} | target_spend_ceiling=${bs.target_spend?.cpc_bid_ceiling_micros ?? '-'} | maxConv_tCPA=${bs.maximize_conversions?.target_cpa_micros ?? '-'}`);
}
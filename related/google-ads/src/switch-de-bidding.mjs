// D15R-DE 切换出价策略到 Maximize Clicks（TARGET_SPEND）组合策略 + ¥10 CPC 上限
// 之前 campaign.maximize_clicks 更新被 portfolio 策略覆盖，需要替换 bidding_strategy 指向
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = '24314545845';
const CEILING_CNY = 10;

async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /aborted|ECONNRESET|ETIMEDOUT|ECONNREFUSED|UND_ERR|timeout|premature|socket|fetch failed|5\d\d/i.test(msg);
      if (!retryable || i === attempts) throw e;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 60)})，${wait / 1000}s 后重试...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

// 查看当前挂的组合策略
const cur = await withRetry(() => customer.query(
  `SELECT campaign.id, campaign.name, campaign.bidding_strategy, campaign.bidding_strategy_type FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}`
));
console.log('当前:', JSON.stringify(cur[0].campaign));

// ① 查找或新建 Maximize Clicks 组合策略（TARGET_SPEND + CPC 上限）
const STRATEGY_NAME = `D15R-DE MaxClicks cap ¥${CEILING_CNY} 2026-10-08`;
console.log(`\n① 查找组合策略 "${STRATEGY_NAME}"...`);
const existing = await withRetry(() => customer.query(
  `SELECT bidding_strategy.resource_name, bidding_strategy.name FROM bidding_strategy WHERE bidding_strategy.name = '${STRATEGY_NAME}'`
));
let bsRn;
if (existing.length) {
  bsRn = existing[0].bidding_strategy.resource_name;
  console.log('  ℹ 已存在，复用:', bsRn);
} else {
  const bs = await withRetry(() => customer.biddingStrategies.create([{
    name: STRATEGY_NAME,
    type: 'TARGET_SPEND',
    target_spend: { cpc_bid_ceiling_micros: String(CEILING_CNY * 1e6) },
  }]));
  const rn = bs?.resource_name || bs?.results?.[0]?.resource_name;
  if (!rn) throw new Error('create 返回无 resource_name: ' + JSON.stringify(bs).slice(0, 300));
  bsRn = rn;
  console.log('  ✅ 策略:', bsRn);
}

// ② 挂到 DE 系列
console.log('② 挂到 D15R-DE 系列...');
await withRetry(() => customer.campaigns.update([{
  resource_name: `customers/3337342376/campaigns/${CAMPAIGN_ID}`,
  bidding_strategy: bsRn,
}]));
console.log('  ✅ 已挂载');

// ③ 回读
const after = await withRetry(() => customer.query(
  `SELECT campaign.id, campaign.bidding_strategy, campaign.bidding_strategy_type FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}`
));
console.log('\n③ 回读:', JSON.stringify(after[0].campaign));
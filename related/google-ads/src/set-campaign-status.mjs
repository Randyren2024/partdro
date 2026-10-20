// 修改广告系列的投放状态（启用 / 暂停）
// 启用时会级联启用其下所有 PAUSED 的广告组与广告（创建时默认 PAUSED，只开系列不会投放）
// 用法: node src/set-campaign-status.mjs <campaignId> <ENABLED|PAUSED>
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const CAMPAIGN_ID = process.argv[2];
const STATUS = (process.argv[3] || 'ENABLED').toUpperCase();
if (!CAMPAIGN_ID || !['ENABLED', 'PAUSED'].includes(STATUS)) {
  console.error('用法: node src/set-campaign-status.mjs <campaignId> <ENABLED|PAUSED>');
  process.exit(1);
}

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customerId = String(process.env.GOOGLE_ADS_CUSTOMER_ID).replace(/\D/g, '');
const customer = client.Customer({
  customer_id: customerId,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
});

// 代理链路会间歇性掉线（ECONNRESET/Premature close），统一加重试
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

const resource_name = `customers/${customerId}/campaigns/${CAMPAIGN_ID}`;
await withRetry(() => customer.campaigns.update([{ resource_name, status: STATUS }]), '更新系列');
console.log(`✅ 广告系列 ${CAMPAIGN_ID} → ${STATUS}`);

// 启用时级联：广告组 + 广告
if (STATUS === 'ENABLED') {
  const ags = await withRetry(() => customer.query(
    `SELECT ad_group.resource_name FROM ad_group WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group.status = PAUSED`
  ), '查询广告组');
  if (ags.length) {
    await withRetry(() => customer.adGroups.update(ags.map(r => ({ resource_name: r.ad_group.resource_name, status: 'ENABLED' }))), '启用广告组');
    console.log(`✅ 已启用广告组 x${ags.length}`);
  } else {
    console.log('  （广告组已是启用状态，跳过）');
  }

  const ads = await withRetry(() => customer.query(
    `SELECT ad_group_ad.resource_name FROM ad_group_ad WHERE campaign.id = ${CAMPAIGN_ID} AND ad_group_ad.status = PAUSED`
  ), '查询广告');
  if (ads.length) {
    await withRetry(() => customer.adGroupAds.update(ads.map(r => ({ resource_name: r.ad_group_ad.resource_name, status: 'ENABLED' }))), '启用广告');
    console.log(`✅ 已启用广告 x${ads.length}`);
  } else {
    console.log('  （广告已是启用状态，跳过）');
  }
}

// 回读确认
const rows = await customer.query(
  `SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}`
);
console.log(JSON.stringify(rows[0]));
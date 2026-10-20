// 列出账户全部转化操作：类型 / 状态 / 是否主转化 —— 用于判断 GA 导入 vs 原生 Ads 标签
// 用法: node src/list-conversion-actions.mjs
import 'dotenv/config';
import { GoogleAdsApi, enums } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

// report 返回的是数字枚举，必须用 enums 映射回名称（否则 REMOVED 过滤会失效）
const STATUS = enums.ConversionActionStatus;
const TYPE = enums.ConversionActionType;

const rows = await customer.report({
  entity: 'conversion_action',
  attributes: [
    'conversion_action.id',
    'conversion_action.name',
    'conversion_action.type',      // WEBPAGE=原生Ads标签, GOOGLE_ANALYTICS_4_*=GA4导入
    'conversion_action.origin',
    'conversion_action.category',
    'conversion_action.status',
    'conversion_action.primary_for_goal',
  ],
  order_by: 'conversion_action.type',
});

console.log('type\tstatus\tprimary\tid\tname');
let nEnabled = 0, nEnabledPrimary = 0, nRemoved = 0;
for (const r of rows) {
  const c = r.conversion_action;
  const status = STATUS[c.status] ?? c.status;
  const type = TYPE[c.type] ?? c.type;
  const primary = c.primaryForGoal ?? c.primary_for_goal;
  if (status === 'REMOVED') { nRemoved++; continue; }
  if (status === 'ENABLED') { nEnabled++; if (primary) nEnabledPrimary++; }
  console.log(`${type}\t${status}\t${primary}\t${c.id}\t${c.name}`);
}
console.log(`\n汇总: ENABLED=${nEnabled}（其中主转化 primary=${nEnabledPrimary}）, REMOVED(已忽略)=${nRemoved}`);

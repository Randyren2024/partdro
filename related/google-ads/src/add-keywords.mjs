// 向指定广告组追加短语匹配关键词
// 用法: node src/add-keywords.mjs "D15R - Search - Global" "Solar Panel" "solar panel cleaning machine" "solar panel cleaning robot" ...
import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const [campName, agName, ...keywords] = process.argv.slice(2);
if (!campName || !agName || !keywords.length) {
  console.error('用法: node src/add-keywords.mjs "<系列名>" "<广告组名>" "词1" "词2" ...');
  process.exit(1);
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
const err = e => (e?.errors || [{ message: e.message }]).map(x => x.message).join(' | ');

const ags = await customer.report({
  entity: 'ad_group',
  attributes: ['ad_group.id'],
  constraints: { 'campaign.name': campName, 'ad_group.name': agName },
});
if (!ags.length) { console.error(`找不到广告组: ${campName} / ${agName}`); process.exit(1); }
const agRn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${ags[0].ad_group.id}`;

// 幂等：查现有词
const existing = new Set(
  (await customer.report({
    entity: 'keyword_view',
    attributes: ['ad_group_criterion.keyword.text'],
    constraints: { 'ad_group.id': String(ags[0].ad_group.id) },
  })).map(r => r.ad_group_criterion.keyword.text.toLowerCase())
);

const toAdd = keywords.filter(k => !existing.has(k.toLowerCase()));
const skipped = keywords.length - toAdd.length;
if (skipped) console.log(`↷ 已存在跳过 ${skipped} 个`);
if (!toAdd.length) { console.log('无新增'); process.exit(0); }

await customer.adGroupCriteria.create(
  toAdd.map(text => ({ ad_group: agRn, status: 'ENABLED', keyword: { text, match_type: 'PHRASE' } }))
).then(r => {
  const n = Array.isArray(r?.results) ? r.results.length : toAdd.length;
  console.log(`✅ ${campName} / ${agName} 新增短语词 x${n}`);
}).catch(e => console.error('⚠️ 失败:', err(e)));

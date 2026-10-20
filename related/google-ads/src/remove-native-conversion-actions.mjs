// 移除我创建的两个原生转化操作（改用 GA 导入路径，避免同一事件双重计数）
// 用法: node src/remove-native-conversion-actions.mjs
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

const IDS = [7822419540, 7822419813]; // WhatsApp Chat / Inquiry Form - droneworld.tech
for (const id of IDS) {
  const rn = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${id}`;
  await customer.conversionActions.remove([rn])
    .then(() => console.log(`🗑️ 已移除 ${id}`))
    .catch(e => console.error(`⚠️ ${id}:`, e?.errors?.[0]?.message ?? e.message));
}

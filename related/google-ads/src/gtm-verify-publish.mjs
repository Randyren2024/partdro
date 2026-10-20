// 验证最新线上 GTM 版本的标签/触发器命名
import 'dotenv/config';
import { google } from 'googleapis';

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_ADS_CLIENT_ID,
  process.env.GOOGLE_ADS_CLIENT_SECRET,
  'http://localhost',
);
auth.setCredentials({ refresh_token: process.env.GTM_REFRESH_TOKEN });
const tm = google.tagmanager({ version: 'v2', auth });
const ACC = `accounts/${process.env.GTM_ACCOUNT_ID}`;
const CTR = `${ACC}/containers/${process.env.GTM_CONTAINER_ID}`;

const { data } = await tm.accounts.containers.version_headers.list({ parent: CTR, pageSize: 5 });
const versions = (data.containerVersionHeader || [])
  .sort((a, b) => Number(b.containerVersionId) - Number(a.containerVersionId));
console.log('\n最新线上版本头:');
for (const v of versions.slice(0, 3)) {
  console.log(`  ${v.containerVersionId} "${v.name}" published=${v.published}`);
}

const latest = versions[0];
console.log(`\n拉取版本 ${latest.containerVersionId} 详情...`);
const { data: ver } = await tm.accounts.containers.versions.get({
  path: `${CTR}/versions/${latest.containerVersionId}`,
});
console.log(`标签 ${(ver.tag || []).length} 个 / 触发器 ${(ver.trigger || []).length} 个`);
console.log('\n=== 标签 ===');
for (const t of ver.tag || []) {
  const label = t.parameter?.find((p) => p.key === 'conversionLabel')?.value || '';
  console.log(`  [${t.tagId}] ${t.name}  (${t.type})${label ? '  label=' + label : ''}`);
}
console.log('\n=== 触发器 ===');
for (const t of ver.trigger || []) {
  const evt = (t.customEventFilter || [])
    .map((f) => (f.parameter || []).map((p) => p.value).join('/'))
    .join(' | ');
  console.log(`  [${t.triggerId}] ${t.name}  evt{${evt}}`);
}
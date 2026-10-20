// 统一 GTM 标签/触发器命名，并建版本 + 发布
//   node src/gtm-rename.mjs            只读：显示改名计划 + 与最新线上版本的差异
//   node src/gtm-rename.mjs --apply    执行改名 → 建版本 → 发布
import 'dotenv/config';
import { google } from 'googleapis';

const {
  GOOGLE_ADS_CLIENT_ID: CLIENT_ID,
  GOOGLE_ADS_CLIENT_SECRET: CLIENT_SECRET,
  GTM_REFRESH_TOKEN,
  GTM_ACCOUNT_ID,
  GTM_CONTAINER_ID,
  GTM_WORKSPACE_ID,
} = process.env;

const APPLY = process.argv.includes('--apply');

// 标签重命名：类型前缀 + GA4 事件名
const TAG_RENAMES = {
  '47': 'AW - whatsapp_chat_initiated',      // awct
  '48': 'AW - contact_form_submission',      // awct
  '10': 'GA4 - whatsapp_chat_initiated',     // gaawe
  '44': 'GA4 - contact_form_submission',     // gaawe
  '21': 'GA4 - email_click',                 // gaawe
};
// 触发器重命名：对齐实际监听的自定义事件名
const TRG_RENAMES = {
  '5': 'Custom Event - whatsapp_chat_initiated',
  '20': 'Custom Event - generate_lead',
};

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: GTM_REFRESH_TOKEN });
const tm = google.tagmanager({ version: 'v2', auth });

const ACC = `accounts/${GTM_ACCOUNT_ID}`;
const CTR = `${ACC}/containers/${GTM_CONTAINER_ID}`;
const WS = `${CTR}/workspaces/${GTM_WORKSPACE_ID}`;

async function withRetry(fn, label, attempts = 5) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const status = e?.response?.status ?? e?.status;
      const retryable = (typeof status === 'number' && (status === 429 || status >= 500))
        || /hang up|ECONNRESET|ETIMEDOUT|UND_ERR|timeout|premature|fetch failed|socket/i.test(msg);
      if (!retryable || i === attempts) break;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 70)})，${wait / 1000}s 后重试...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw last;
}

const evtName = (t) => (t.customEventFilter || [])
  .map(f => (f.parameter || []).map(p => `${p.value}`).join('/')).join(' | ');

console.log(`工作区: ${WS}`);

const { data: tagList } = await withRetry(() => tm.accounts.containers.workspaces.tags.list({ parent: WS }), 'tags.list');
const { data: trgList } = await withRetry(() => tm.accounts.containers.workspaces.triggers.list({ parent: WS }), 'triggers.list');

console.log('\n=== 标签改名计划 ===');
for (const t of tagList.tag || []) {
  const nn = TAG_RENAMES[t.tagId];
  console.log(`  [${t.tagId}] ${t.name}${nn ? `  →  ${nn}` : '  (不改)'}`);
}
console.log('\n=== 触发器改名计划 ===');
for (const t of trgList.trigger || []) {
  const nn = TRG_RENAMES[t.triggerId];
  console.log(`  [${t.triggerId}] ${t.name}  evt{${evtName(t)}}${nn ? `  →  ${nn}` : '  (不改)'}`);
}

// ---- 与最新线上版本对比，确认工作区没有额外未发布改动 ----
const { data: vList } = await withRetry(() => tm.accounts.containers.version_headers.list({ parent: CTR, pageSize: 200 }), 'version_headers.list');
const versions = (vList.containerVersionHeader || []).slice().sort((a, b) => Number(b.containerVersionId) - Number(a.containerVersionId));
const latest = versions[0];
console.log(`\n版本总数 ${versions.length}，最新线上版本: ${latest.containerVersionId} "${latest.name}"`);
const { data: vFull } = await withRetry(() => tm.accounts.containers.versions.get({ path: `${CTR}/versions/${latest.containerVersionId}` }), 'versions.get');

// 注意：containerVersion 的资源字段是单数 tag / trigger（不是 tags / triggers）
const vTagNames = new Map((vFull.tag || []).map(t => [t.tagId, t.name]));
const vTrgNames = new Map((vFull.trigger || []).map(t => [t.triggerId, t.name]));
const wTagIds = new Set((tagList.tag || []).map(t => t.tagId));
const wTrgIds = new Set((trgList.trigger || []).map(t => t.triggerId));

const extraTags = [...vTagNames.keys()].filter(id => !wTagIds.has(id));
const extraTrgs = [...vTrgNames.keys()].filter(id => !wTrgIds.has(id));
console.log(`  工作区标签 ${wTagIds.size} 个 / 线上 ${vTagNames.size} 个；工作区缺失的线上标签: ${extraTags.length ? extraTags.join(',') : '无'}`);
console.log(`  工作区触发器 ${wTrgIds.size} 个 / 线上 ${vTrgNames.size} 个；工作区缺失的线上触发器: ${extraTrgs.length ? extraTrgs.join(',') : '无'}`);

if (!APPLY) {
  console.log('\n(只读模式，未做任何修改。确认无误后加 --apply 执行)');
  process.exit(0);
}

// ---- 执行改名 ----
console.log('\n=== 执行改名 ===');
for (const t of tagList.tag || []) {
  const nn = TAG_RENAMES[t.tagId];
  if (!nn || nn === t.name) continue;
  const { data: fresh } = await withRetry(() => tm.accounts.containers.workspaces.tags.get({ path: `${WS}/tags/${t.tagId}` }), `tags.get ${t.tagId}`);
  fresh.name = nn;
  await withRetry(() => tm.accounts.containers.workspaces.tags.update({ path: `${WS}/tags/${t.tagId}`, requestBody: fresh }), `tags.update ${t.tagId}`);
  console.log(`  ✓ 标签 [${t.tagId}] → ${nn}`);
}
for (const t of trgList.trigger || []) {
  const nn = TRG_RENAMES[t.triggerId];
  if (!nn || nn === t.name) continue;
  const { data: fresh } = await withRetry(() => tm.accounts.containers.workspaces.triggers.get({ path: `${WS}/triggers/${t.triggerId}` }), `triggers.get ${t.triggerId}`);
  fresh.name = nn;
  await withRetry(() => tm.accounts.containers.workspaces.triggers.update({ path: `${WS}/triggers/${t.triggerId}`, requestBody: fresh }), `triggers.update ${t.triggerId}`);
  console.log(`  ✓ 触发器 [${t.triggerId}] → ${nn}`);
}

// ---- 建版本 + 发布 ----
const { data: verData } = await withRetry(() => tm.accounts.containers.workspaces.create_version({
  path: WS,
  requestBody: { name: 'Unify GTM naming (AW-/GA4-)', notes: 'renamed Ads conversion + GA4 event tags/triggers via GTM API' },
}), 'create_version');
const cv = verData.containerVersion;
console.log(`\n=== 已建版本 ===\n  containerVersionId=${cv.containerVersionId}`);

const { data: pubData } = await withRetry(() => tm.accounts.containers.versions.publish({
  path: `${CTR}/versions/${cv.containerVersionId}`,
  requestBody: { fingerprint: cv.fingerprint },
}), 'publish');
console.log(`=== 已发布 ===\n  containerVersionId=${pubData.containerVersion?.containerVersionId}`);
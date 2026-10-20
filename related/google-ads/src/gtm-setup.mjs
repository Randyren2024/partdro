// 通过 GTM API v2 创建两个 Google Ads 转化标签，并创建/发布版本
// 运行: node src/gtm-setup.mjs            （只建标签 + 建版本，不发布）
//       node src/gtm-setup.mjs --publish  （核对无误后再发布）
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

for (const [k, v] of Object.entries({ CLIENT_ID, CLIENT_SECRET, GTM_REFRESH_TOKEN, GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GTM_WORKSPACE_ID })) {
  if (!v) { console.error(`缺少环境变量: ${k}`); process.exit(1); }
}

const PUBLISH = process.argv.includes('--publish');
const CONV_ID = '11160320746';

const TAGS = [
  { name: 'AW - WhatsApp Chat Initiated', label: 'SlZrCNTMgpIdEOr108kp', triggerName: 'Click Whatsapp Button Trigger' },
  { name: 'AW - Inquiry Form Submission', label: 'I6LCCOXOgpIdEOr108kp', triggerName: 'Custom Event - contact_form_submission' },
];

// 代理链路偶发 socket hang up：所有 API 调用统一走重试
async function withRetry(fn, label, attempts = 5) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      const retryable = /hang up|ECONNRESET|ETIMEDOUT|UND_ERR|timeout|premature|invalid response body|fetch failed|socket|5\d\d/i.test(msg);
      if (!retryable || i === attempts) break;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 80)})，${wait / 1000}s 后重试...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: GTM_REFRESH_TOKEN });
const tm = google.tagmanager({ version: 'v2', auth });

const WS = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/workspaces/${GTM_WORKSPACE_ID}`;

async function runFlow(wsPath, isFresh) {
  // 1) 读取现有触发器
  const { data: trigData } = await withRetry(() => tm.accounts.containers.workspaces.triggers.list({ parent: wsPath }), 'triggers.list');
  const triggers = trigData.trigger || [];
  console.log(`\n=== 工作区 ${wsPath} 的触发器 ===`);
  triggers.forEach(t => console.log(`  [${t.triggerId}] ${t.name}  (type=${t.type})`));

  // 2) 读取现有标签：按 conversionLabel 去重，并找 Google 标签
  const { data: tagData } = await withRetry(() => tm.accounts.containers.workspaces.tags.list({ parent: wsPath }), 'tags.list');
  const existing = tagData.tag || [];
  console.log('=== 现有标签 ===');
  existing.forEach(t => console.log(`  [${t.tagId}] ${t.name}  (type=${t.type})`));

  const googleTag = existing.find(t => t.type === 'googtag');
  console.log(googleTag ? `\n将复用 Google 标签: [${googleTag.tagId}] ${googleTag.name}` : '\n未找到 Google 标签');

  const existingAwctLabels = new Set(
    existing.filter(t => t.type === 'awct').map(t => t.parameter?.find(p => p.key === 'conversionLabel')?.value)
  );

  // 3) 创建缺失的转化标签
  console.log('\n=== 创建转化标签 ===');
  if (!googleTag) { console.error('✗ 容器内没有 Google 标签(googtag)，gaawc 必须引用它 —— 请先在 GTM 界面创建 Google 标签'); process.exit(1); }
  for (const spec of TAGS) {
    if (existingAwctLabels.has(spec.label)) { console.log(`  已存在相同 conversionLabel 的 awct 标签，跳过: ${spec.label} (${spec.name})`); continue; }
    const trig = triggers.find(t => t.name === spec.triggerName);
    if (!trig) { console.error(`  ✗ 找不到触发器: ${spec.triggerName} —— 跳过 ${spec.name}`); continue; }

    // gaawc 必须引用容器内的 Google 标签（vendorTemplate.parameter.tagId 必填）
    const parameter = [
      { type: 'tagReference', key: 'tagId', value: googleTag.tagId },
      { type: 'template', key: 'conversionId', value: CONV_ID },
      { type: 'template', key: 'conversionLabel', value: spec.label },
      { type: 'boolean', key: 'enableConversionLinker', value: 'true' },
      { type: 'boolean', key: 'enableNewCustomerReporting', value: 'false' },
      { type: 'boolean', key: 'enableProductReporting', value: 'false' },
      { type: 'boolean', key: 'enableShippingData', value: 'false' },
      { type: 'boolean', key: 'rdp', value: 'false' },
    ];

    const { data: created } = await withRetry(() => tm.accounts.containers.workspaces.tags.create({
      parent: wsPath,
      requestBody: {
        name: spec.name,
        type: 'gaawc',
        parameter,
        firingTriggerId: [trig.triggerId],
        tagFiringOption: 'oncePerEvent',
      },
    }), `tags.create(${spec.name})`);
    console.log(`  ✓ 已创建: ${created.name}  (tagId=${created.tagId})  ← 触发器 ${spec.triggerName}`);
  }

  // 4) 创建版本
  const { data: verData } = await withRetry(() => tm.accounts.containers.workspaces.create_version({
    path: wsPath,
    requestBody: { name: 'Add native Google Ads conversion tags', notes: 'created via GTM API' },
  }), 'create_version');
  const cv = verData.containerVersion;
  console.log(`\n=== 已创建版本 ===\n  containerVersionId=${cv.containerVersionId}`);

  if (!PUBLISH) {
    console.log('\n未发布。可在 GTM 界面核对，然后运行:  node src/gtm-setup.mjs --publish');
    return;
  }

  // 5) 发布（需带上 create_version 返回的 fingerprint）
  const { data: pubData } = await withRetry(() => tm.accounts.containers.versions.publish({
    path: `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/versions/${cv.containerVersionId}`,
    requestBody: { fingerprint: cv.fingerprint },
  }), 'publish');
  console.log(`\n=== 已发布 ===\n  containerVersionId=${pubData.containerVersion?.containerVersionId}`);
}

async function main() {
  const containerPath = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`;
  try {
    await runFlow(WS, false);
  } catch (e) {
    const msg = String(e?.errors?.[0]?.message || e.message || e);
    if (!/already submitted/i.test(msg)) throw e;

    // 工作区已提交（有待发布草稿）→ 拒绝修改。自动新建工作区重跑。
    console.log('\n⚠ 当前工作区已处于"已提交"状态，自动新建工作区重跑...');
    const { data: newWs } = await withRetry(() => tm.accounts.containers.workspaces.create({
      parent: containerPath,
      requestBody: { name: `GTM API Setup ${new Date().toISOString().slice(0, 10)}` },
    }), 'workspaces.create');
    console.log(`✓ 新工作区: ${newWs.workspaceId} (${newWs.name})`);
    await runFlow(`accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/workspaces/${newWs.workspaceId}`, true);
  }
}

main().catch(err => {
  console.error('执行失败:', JSON.stringify(err?.errors || err?.message || err, null, 2));
  process.exit(1);
});

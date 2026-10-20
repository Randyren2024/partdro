// 只读：发现 GTM 账户/容器/工作区，并列出目标工作区的标签 / 触发器
// 用法: node src/gtm-inspect.mjs
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

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: GTM_REFRESH_TOKEN });
const tm = google.tagmanager({ version: 'v2', auth });

console.log(`.env: account=${GTM_ACCOUNT_ID} container=${GTM_CONTAINER_ID} workspace=${GTM_WORKSPACE_ID}`);

// 1) 账户
try {
  const { data } = await tm.accounts.list({});
  console.log('\n=== 可见账户 ===');
  for (const a of data.account || []) console.log(`  ${a.accountId}  ${a.name}`);
} catch (e) { console.log('accounts.list 失败:', e.message); }

// 2) 容器
try {
  const { data } = await tm.accounts.containers.list({ parent: `accounts/${GTM_ACCOUNT_ID}` });
  console.log(`\n=== 账户 ${GTM_ACCOUNT_ID} 下的容器 ===`);
  for (const c of data.container || []) console.log(`  ${c.containerId}  ${c.name}  publicId=${c.publicId}`);
} catch (e) { console.log('containers.list 失败:', e.message); }

// 3) 工作区
try {
  const { data } = await tm.accounts.containers.workspaces.list({ parent: `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}` });
  console.log(`\n=== 容器 ${GTM_CONTAINER_ID} 下的工作区 ===`);
  for (const w of data.workspace || []) console.log(`  ${w.workspaceId}  ${w.name}`);
} catch (e) { console.log('workspaces.list 失败:', e.message); }

// 4) 目标工作区的标签 / 触发器
const WS = `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/workspaces/${GTM_WORKSPACE_ID}`;
try {
  const { data: td } = await tm.accounts.containers.workspaces.tags.list({ parent: WS });
  const { data: rg } = await tm.accounts.containers.workspaces.triggers.list({ parent: WS });
  console.log(`\n=== 工作区 ${GTM_WORKSPACE_ID} 的触发器 ===`);
  for (const t of rg.trigger || []) console.log(`  [${t.triggerId}] ${t.name}  (type=${t.type})`);
  console.log(`\n=== 工作区 ${GTM_WORKSPACE_ID} 的标签 ===`);
  for (const t of td.tag || []) {
    const label = t.parameter?.find(p => p.key === 'conversionLabel')?.value || '';
    console.log(`  [${t.tagId}] ${t.name}  (type=${t.type})  trig=${(t.firingTriggerId || []).join(',')}${label ? `  label=${label}` : ''}`);
  }
} catch (e) { console.log(`工作区 ${GTM_WORKSPACE_ID} 读取失败: ${e.message}`); }
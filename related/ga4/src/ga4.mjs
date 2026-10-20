// Google Analytics 4 工具集（Admin API v1beta + Data API v1beta）
//   node src/ga4.mjs check
//   node src/ga4.mjs accounts
//   node src/ga4.mjs properties [--account <id>]
//   node src/ga4.mjs streams [--property <id>]
//   node src/ga4.mjs report [--property <id>] [--days 28] [--dim date] [--metrics activeUsers] [--limit 25]
//   node src/ga4.mjs realtime [--property <id>] [--dim minutesAgo]
//   node src/ga4.mjs conversions [--property <id>]
import 'dotenv/config';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GA4_CLIENT_ID;
const CLIENT_SECRET = process.env.GA4_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GA4_REFRESH_TOKEN;
const ENV_ACCOUNT = process.env.GA4_ACCOUNT_ID || '';
const ENV_PROPERTY = process.env.GA4_PROPERTY_ID || '';

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('缺少 GA4_CLIENT_ID / GA4_CLIENT_SECRET / GA4_REFRESH_TOKEN（先运行 npm run auth）');
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');
auth.setCredentials({ refresh_token: REFRESH_TOKEN });
const admin = google.analyticsadmin({ version: 'v1beta', auth });
const dataApi = google.analyticsdata({ version: 'v1beta', auth });

async function withRetry(fn, label, attempts = 4) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      const msg = String(e?.errors?.[0]?.message || e.message || e);
      // 用真实 HTTP 状态判断，而不是在消息文本里正则匹配数字 ——
      // 文本里的任意数字（例如支持文档编号 …2451999 中的 "519"）会被 5\d\d 误判成 5xx，
      // 结果对 403 这类永久性错误反复重试。
      const status = e?.response?.status ?? e?.status;
      const retryable = (typeof status === 'number' && (status === 429 || status >= 500))
        || /hang up|ECONNRESET|ETIMEDOUT|UND_ERR|timeout|premature|fetch failed|socket|quota/i.test(msg);
      if (!retryable || i === attempts) break;
      const wait = 3000 * i;
      console.log(`  ⚠ ${label} 第${i}次失败(${msg.slice(0, 80)})，${wait / 1000}s 后重试...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const short = (name) => String(name || '').split('/').pop();
const pad = (s, n) => String(s ?? '').padEnd(n);

// 简易对齐表格：列宽 = 表头/单元格最宽 + 2，至少 12，封顶 40
function printTable(head, rows) {
  const widths = head.map((h, c) => Math.min(40, Math.max(12, h.length + 2,
    ...rows.map((r) => String(r[c] ?? '').length + 2))));
  console.log('  ' + head.map((h, c) => pad(h, widths[c])).join(''));
  rows.forEach((r) => console.log('  ' + r.map((v, c) => pad(v, widths[c])).join('')));
}

// ---------- 账号 / 属性解析：CLI 参数 → .env 默认 → 自动探测（唯一时直接用） ----------
async function resolveAccount() {
  const cli = arg('account', '');
  if (cli) return cli;
  if (ENV_ACCOUNT) return ENV_ACCOUNT;
  const { data } = await withRetry(() => admin.accounts.list({ pageSize: 200 }), 'accounts.list');
  const accs = data.accounts || [];
  if (accs.length === 1) {
    const id = short(accs[0].name);
    console.log(`（未指定账号，自动选用：${accs[0].displayName} [${id}]）`);
    return id;
  }
  if (!accs.length) {
    console.error('该授权账号名下没有任何 GA 账号（授权错了账号？先用 check 确认）');
    process.exit(2);
  }
  console.error(`该授权账号名下有 ${accs.length} 个 GA 账号，请用 --account <id> 指定，或在 .env 设 GA4_ACCOUNT_ID：`);
  accs.forEach((a) => console.error(`  ${short(a.name)}  ${a.displayName || ''}`));
  process.exit(2);
}

async function resolveProperty() {
  const cli = arg('property', '');
  if (cli) return cli;
  if (ENV_PROPERTY) return ENV_PROPERTY;
  const accountId = await resolveAccount();
  const { data } = await withRetry(() => admin.properties.list({ filter: `parent:accounts/${accountId}`, pageSize: 200 }), 'properties.list');
  // 自动选择时排除子属性（PROPERTY_TYPE_SUBPROPERTY），避免选错对象
  const props = (data.properties || []).filter((p) => p.propertyType !== 'PROPERTY_TYPE_SUBPROPERTY');
  if (props.length === 1) {
    const id = short(props[0].name);
    console.log(`（未指定属性，自动选用：${props[0].displayName} [${id}]）`);
    return id;
  }
  if (!props.length) { console.error('该账号下没有可用的 GA4 属性（纯 UA 老账号没有 GA4 属性）'); process.exit(2); }
  console.error(`该账号下有 ${props.length} 个 GA4 属性，请用 --property <id> 指定，或在 .env 设 GA4_PROPERTY_ID：`);
  props.forEach((p) => console.error(`  ${short(p.name)}  ${p.displayName || ''}`));
  process.exit(2);
}

// ---------- 命令 ----------
async function cmdCheck() {
  let info = null;
  try {
    const { token } = await auth.getAccessToken();
    info = await withRetry(() => auth.getTokenInfo(token), 'tokeninfo');
  } catch { /* tokeninfo 失败不致命，继续看 accounts 列表 */ }
  console.log('\n=== 当前 GA4 令牌 ===');
  if (info) {
    console.log(`  授权账号 : ${info.email || '(未返回)'}`);
    console.log(`  scope    : ${(info.scopes || []).join(', ') || '(未返回)'}`);
  } else {
    console.log('  （tokeninfo 查询失败，令牌可能已失效）');
  }
  const { data } = await withRetry(() => admin.accounts.list({ pageSize: 200 }), 'accounts.list');
  const accs = data.accounts || [];
  console.log(`  可见 GA 账号: ${accs.length} 个`);
  accs.forEach((a) => console.log(`    ${short(a.name)}  ${a.displayName || ''}`));
  if (!accs.length) {
    console.log('  → 一个都看不到：授权账号名下没有 GA 账号，或令牌已过期（Testing 状态 7 天失效，重跑 npm run auth）');
  }
}

async function cmdAccounts() {
  const { data } = await withRetry(() => admin.accounts.list({ pageSize: 200 }), 'accounts.list');
  console.log('\n=== GA 账号 ===');
  const accs = data.accounts || [];
  if (!accs.length) { console.log('  该授权账号名下没有任何 GA 账号'); return; }
  accs.forEach((a) => console.log(`  ${String(short(a.name)).padEnd(12)} ${a.displayName || ''}  区域 ${a.regionCode || '-'}  创建 ${a.createTime || '-'}`));
}

async function cmdProperties() {
  const accountId = await resolveAccount();
  const { data } = await withRetry(() => admin.properties.list({ filter: `parent:accounts/${accountId}`, pageSize: 200 }), 'properties.list');
  console.log(`\n=== GA4 属性（账号 ${accountId}） ===`);
  const typeCn = { PROPERTY_TYPE_ORDINARY: '普通', PROPERTY_TYPE_SUBPROPERTY: '子属性', PROPERTY_TYPE_ROLLUP: '汇总' };
  const props = data.properties || [];
  if (!props.length) { console.log('  （没有 GA4 属性，可能是纯 UA 老账号）'); return; }
  props.forEach((p) => {
    console.log(`  ${String(short(p.name)).padEnd(12)} ${p.displayName || ''}`);
    console.log(`     类型 ${typeCn[p.propertyType] || p.propertyType || '-'}  时区 ${p.timeZone || '-'}  行业 ${p.industryCategory || '-'}  创建 ${p.createTime || '-'}`);
  });
}

async function cmdStreams() {
  const propertyId = await resolveProperty();
  const { data } = await withRetry(() => admin.properties.dataStreams.list({ parent: `properties/${propertyId}` }), 'dataStreams.list');
  console.log(`\n=== 数据流（属性 ${propertyId}） ===`);
  const streams = data.dataStreams || [];
  if (!streams.length) { console.log('  （该属性下没有数据流）'); return; }
  streams.forEach((s) => {
    if (s.type === 'WEB_DATA_STREAM') {
      console.log(`  Web  ${s.webStreamData?.measurementId || '-'}  ${s.webStreamData?.defaultUri || ''}  ${s.displayName || ''}`);
    } else {
      console.log(`  ${s.type || '?'}  ${s.displayName || ''}  firebase ${s.androidAppStreamData?.firebaseAppId || s.iosAppStreamData?.firebaseAppId || '-'}`);
    }
  });
}

function parseDims(s) {
  // 'none' → 无维度（合计单行）；'a,b' → [{name:'a'},{name:'b'}]
  if (!s || s === 'none') return [];
  return s.split(',').map((n) => ({ name: n.trim() })).filter((d) => d.name);
}

async function cmdReport() {
  const propertyId = await resolveProperty();
  const dimensions = parseDims(arg('dim', 'date'));
  const metrics = parseDims(arg('metrics', 'activeUsers,totalUsers,newUsers')).map((d) => ({ name: d.name }));
  const days = parseInt(arg('days', '28'), 10);
  const limit = parseInt(arg('limit', '25'), 10);
  // Data API 支持相对日期（如 28daysAgo / yesterday），不用自己算日期
  const { data } = await withRetry(() => dataApi.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }],
      dimensions,
      metrics,
      limit: limit > 0 ? limit : undefined,
    },
  }), 'runReport');

  console.log(`\n=== 报告 ${days}daysAgo ~ yesterday | 属性 ${propertyId} ===`);
  const head = [...dimensions.map((d) => d.name), ...metrics.map((m) => m.name)];
  const rows = (data.rows || []).map((r) => [
    ...(r.dimensionValues || []).map((v) => v.value || '-'),
    ...(r.metricValues || []).map((v) => v.value || '0'),
  ]);
  if (!rows.length) { console.log('  无数据（属性可能刚建，或该时间段没有流量）'); return; }
  printTable(head, rows);
  console.log(`  ---- 共 ${rows.length} 行 ----`);
}

async function cmdRealtime() {
  const propertyId = await resolveProperty();
  const dimensions = parseDims(arg('dim', 'none'));
  const { data } = await withRetry(() => dataApi.properties.runRealtimeReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dimensions,
      metrics: [{ name: arg('metrics', 'activeUsers') }],
      limit: parseInt(arg('limit', '25'), 10),
    },
  }), 'runRealtimeReport');

  console.log(`\n=== 实时报告 | 属性 ${propertyId} ===`);
  const head = [...dimensions.map((d) => d.name), arg('metrics', 'activeUsers')];
  const rows = (data.rows || []).map((r) => [
    ...(r.dimensionValues || []).map((v) => v.value || '-'),
    ...(r.metricValues || []).map((v) => v.value || '0'),
  ]);
  if (!rows.length) { console.log('  当前没有活跃用户'); return; }
  printTable(head, rows);
}

async function cmdConversions() {
  const propertyId = await resolveProperty();
  const { data } = await withRetry(() => admin.properties.conversionEvents.list({ parent: `properties/${propertyId}` }), 'conversionEvents.list');
  console.log(`\n=== 转化事件（属性 ${propertyId}） ===`);
  const convs = data.conversionEvents || [];
  if (!convs.length) { console.log('  （未配置任何转化事件）'); return; }
  convs.forEach((c) => console.log(`  ${c.eventName || '-'}  创建 ${c.createTime || '-'}${c.isDeletable ? '' : '  (系统预置)'}`));
}

const HELP = `
用法: node src/ga4.mjs <命令> [选项]

命令:
  check                        显示当前令牌的授权账号与可见 GA 账号（验证是否授错账号）
  accounts                     列出 GA 账号
  properties [--account <id>]  列出账号下的 GA4 属性
  streams   [--property <id>]  列出属性的数据流（Web 流含 G-XXXX 测量 ID）
  report    [--property <id>]  拉取报告
  realtime  [--property <id>]  实时活跃用户
  conversions [--property <id>]  查看已配置的转化事件

report 选项:
  --days 28         回溯天数（默认 28）
  --dim date        维度，逗号分隔（默认 date；填 none 得到合计单行）
  --metrics activeUsers,totalUsers,newUsers   指标，逗号分隔
  --limit 25        行数上限
  示例:
    node src/ga4.mjs report --dim eventName --metrics eventCount    # 各事件量
    node src/ga4.mjs report --dim none                              # 单行合计
    node src/ga4.mjs report --dim country --metrics activeUsers     # 按国家
    node src/ga4.mjs realtime --dim minutesAgo                      # 实时按分钟
  ⚠ GA4 指标分 用户级 / 会话级 / 事件级，同一请求不能混用：
    用户级: activeUsers, totalUsers, newUsers
    会话级: sessions, engagedSessions
    事件级: eventCount
    （想同时看，分两次请求）

全局:
  --account <id>   覆盖 GA 账号（也可设 .env GA4_ACCOUNT_ID）
  --property <id>  覆盖 GA4 属性（也可设 .env GA4_PROPERTY_ID）
`;

const cmds = {
  check: cmdCheck,
  accounts: cmdAccounts,
  properties: cmdProperties,
  streams: cmdStreams,
  report: cmdReport,
  realtime: cmdRealtime,
  conversions: cmdConversions,
};
const cmd = process.argv[2];
if (!cmd || cmd === 'help') { console.log(HELP); process.exit(0); }
if (!cmds[cmd]) { console.error(`未知命令: ${cmd}\n可用: ${Object.keys(cmds).join(', ')}`); process.exit(1); }
await cmds[cmd]().catch((e) => {
  const msg = String(e?.errors?.[0]?.message || e?.message || e);
  console.error(`\n执行失败: ${msg.slice(0, 300)}`);
  if (/metric/i.test(msg) && /incompatib|mix|not.*allowed/i.test(msg)) {
    console.error('\n提示: GA4 指标分 用户级 / 会话级 / 事件级，同一请求不能混用');
    console.error('  （例: totalUsers 不能和 sessions 放一起 —— 拆成两次请求即可）');
  }
  if (msg.includes('403') || /permission/i.test(msg)) {
    console.error('\n提示: 403 通常是【授权账号】没有该属性的访问权限 —— 先 npm run check 看当前是谁，必要时重跑 npm run auth');
  }
  process.exit(1);
});

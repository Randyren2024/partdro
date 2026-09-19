// WebBridge 品牌补充查询 —— t=all 全历史，绕过 PullPush 限流
// 用法: node scripts/wb-brand-queries.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const DAEMON = 'http://127.0.0.1:10086/command';
const SESSION = 'reddit-collect-v2';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const pageStart = parseInt(arg('page-start', '1'), 10);
const pageEnd = parseInt(arg('pages', '2'), 10);
const sort = arg('sort', 'top');
const fromIdx = parseInt(arg('from', '0'), 10);
const toIdx = parseInt(arg('to', '99999'), 10);

const QUERIES = [
  { q: 'Aerones', t: 'all' },
  { q: 'LucidBots', t: 'all' },
  { q: '"Lucid Bots"', t: 'all' },
  { q: 'Lucid Bot drone', t: 'all' },
  { q: 'JIUSI', t: 'all' },
  { q: 'Apellix', t: 'all' },
  { q: '"cleaning drone"', t: 'all' },     // 核心词 t=all 补页2+（search.json limit=100 每次拿100）
  { q: '"drone cleaning"', t: 'all' },
  { q: '"cleaning drones"', t: 'all' },
  { q: '"drone washing"', t: 'all' },
  { q: '"washing drone"', t: 'all' },
  { q: '"solar panel cleaning drone"', t: 'all' },
  { q: '"window cleaning drone"', t: 'all' },
  { q: '"drone pressure washing"', t: 'all' },
  { q: '"drone power washing"', t: 'all' },
  // ---- 批次2：新词 ----
  { q: 'Ozmo', t: 'all' },
  { q: '"Lavo Bot"', t: 'all' },
  { q: '"cleaning drone business"', t: 'all' },
  { q: '"drone soft wash"', t: 'all' },
  { q: '"drone cleaning service"', t: 'all' },
  { q: '"solar farm cleaning"', t: 'all' },
  { q: '"rope access" drone', t: 'all' },
  // ---- 组合词（提量）----
  { q: '"window cleaning" drone', t: 'all' },
  { q: '"pressure washing" drone', t: 'all' },
  { q: '"solar panel" drone', t: 'all' },
  { q: '"roof cleaning" drone', t: 'all' },
  { q: '"gutter cleaning" drone', t: 'all' },
  { q: '"facade cleaning" drone', t: 'all' },
];

const BRANDS = ['aerones', 'lucidbot', 'lucid bots', 'jiusi', 'apellix', 'lavo bot', 'sherpa drone'];
const CLEAN_EN = [
  'window clean', 'window wash', 'glass clean', 'glass wash', 'facade', 'building clean',
  'building wash', 'skyscraper', 'high rise', 'highrise', 'solar panel', 'solar farm', 'pv panel',
  'photovoltaic', 'pressure wash', 'power wash', 'soft wash', 'roof clean', 'gutter',
  'exterior clean', 'exterior wash', 'cleaning drone', 'drone clean', 'drone wash',
  'washing drone', 'drone washing', 'drone cleaning', 'cleaning service', 'clean drones',
  'drones cleaning', 'cleaning robots',
];
function relevant(p) {
  const t = `${p.title} ${p.selftext}`.toLowerCase();
  // 排除噪音：扫地拖地机器人 + Ozmo网球记者/动画角色 + Anybots杂谈
  if (/\bozmo\b|deebot|ecovacs|yeedi|roborock|roomba|irobot|robot vacuum|robot mop|mopping|anybots/.test(t) && !/window|facade|solar|skyscraper|high ?rise|drone|uav/.test(t)) return false;
  if (BRANDS.some(b => t.includes(b))) return true;
  if (/robot/.test(t) && /window clean|window wash|facade|building clean|solar panel|skyscraper|high rise|highrise/.test(t)) return true;
  return /drone|drones|uav|quadcopter/.test(t) && CLEAN_EN.some(c => t.includes(c));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function cmd(action, cmdArgs) {
  const res = await fetch(DAEMON, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args: cmdArgs, session: SESSION }),
  });
  if (!res.ok) throw new Error(`daemon HTTP ${res.status}`);
  return res.json();
}
function makeFetchCode(query, t, after) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=${sort}&t=${t}&limit=100&raw_json=1${after ? `&after=${after}` : ''}`;
  return `(async () => {
    try {
      const res = await fetch('${url}', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return JSON.stringify({ error: 'HTTP ' + res.status });
      const data = await res.json();
      const children = data?.data?.children ?? [];
      const posts = children.map(c => c?.data).filter(d => d).map(d => ({
        id: d.id || '', title: d.title || '', selftext: (d.selftext || '').slice(0, 1000),
        subreddit: d.subreddit || '', author: d.author || '',
        created_utc: d.created_utc || null,
        created_iso: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
        score: d.score || 0, num_comments: d.num_comments || 0,
        permalink: d.permalink ? 'https://www.reddit.com' + d.permalink : '',
        url: d.url || '', over_18: d.over_18 || false,
      }));
      return JSON.stringify({ count: posts.length, posts, after: data?.data?.after || null });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  })()`;
}

(async () => {
  // 载入全部已有数据
  const collected = new Map();
  for (const f of ['data/reddit_d15r.json', 'data/reddit_d15r_search.json']) {
    if (!existsSync(f)) continue;
    try {
      const j = JSON.parse(readFileSync(f, 'utf8'));
      for (const s of j.submissions || []) if (s.id) collected.set(s.id, { ...s, source: s.source || 'legacy' });
    } catch {}
  }
  for (const f of ['data/v2_deep/posts_pullpush.json', 'data/v2_deep/posts_webbridge.json']) {
    if (!existsSync(f)) continue;
    try {
      const j = JSON.parse(readFileSync(f, 'utf8'));
      for (const s of j.submissions || []) if (s.id) collected.set(s.id, s);
    } catch {}
  }
  console.log(`[init] 已有: ${collected.size} 帖`);

  const nav = await cmd('navigate', { url: 'https://www.reddit.com', newTab: true, group_title: 'Reddit 采集 v2' });
  if (!nav.ok && !nav.success) { console.error('navigate failed'); process.exit(1); }
  await sleep(5000);

  let added = 0;
  for (let qi = fromIdx; qi <= Math.min(toIdx, QUERIES.length - 1); qi++) {
    const Q = QUERIES[qi];
    let lastAfter = null;
    // 快进到 pageStart 对应的 after 游标
    for (let page = 1; page <= pageEnd; page++) {
      if (page < pageStart) {
        const r0 = await cmd('evaluate', { code: makeFetchCode(Q.q, Q.t, page > 1 ? lastAfter : null) });
        const raw0 = r0?.data?.value || r0?.value;
        if (raw0) {
          const d0 = typeof raw0 === 'string' ? JSON.parse(raw0) : raw0;
          lastAfter = d0.after;
        }
        await sleep(800);
        continue;
      }
      try {
        const after = page > 1 ? lastAfter : null;
        const r = await cmd('evaluate', { code: makeFetchCode(Q.q, Q.t, after) });
        const raw = r?.data?.value || r?.value;
        if (!raw) break;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (data.error) { console.warn(`[${qi + 1}/${QUERIES.length}] ${Q.q}: ${data.error}`); break; }
        lastAfter = data.after;
        let kept = 0;
        for (const d of data.posts || []) {
          if (!d.id || collected.has(d.id) || d.over_18 || !relevant(d)) continue;
          collected.set(d.id, { ...d, source: 'webbridge', query: `${Q.q} t=${Q.t}` });
          kept++;
        }
        added += kept;
        console.log(`[${qi + 1}/${QUERIES.length}] ${Q.q} p${page} → fetched ${data.count}, kept ${kept}, total ${collected.size}`);
        if (!data.after || data.count === 0) break;
      } catch (e) {
        console.warn(`[${qi + 1}] FAILED: ${e.message}`);
        break;
      }
      await sleep(2500);
    }
    await sleep(2500);
  }

  // 合并写回 webbridge dump（保留 source）
  const dumpPath = 'data/v2_deep/posts_webbridge.json';
  const dumpMap = new Map();
  if (existsSync(dumpPath)) {
    try {
      const j = JSON.parse(readFileSync(dumpPath, 'utf8'));
      for (const s of j.submissions || []) if (s.id) dumpMap.set(s.id, s);
    } catch {}
  }
  for (const [id, p] of collected) {
    if (p.source === 'webbridge') dumpMap.set(id, p);
  }
  writeFileSync(dumpPath, JSON.stringify({
    fetched_at: new Date().toISOString(),
    total: dumpMap.size,
    submissions: [...dumpMap.values()],
  }, null, 2));
  console.log(`\n[save] ${dumpPath}: 本轮新增 ${added}, dump 总量 ${dumpMap.size}`);
  try { await cmd('close_session', {}); } catch {}
  console.log('Done.');
})();

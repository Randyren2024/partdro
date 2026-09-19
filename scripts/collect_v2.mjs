// Reddit 多语种批量采集 v2 —— PullPush 走量 + Kimi WebBridge 采新鲜帖
// 用法: node scripts/collect_v2.mjs --phase all|pullpush|webbridge|merge
//   可选: --pages 2 (PullPush 每查询翻页数, 每页100)  --sleep-ms 4000  --no-merge
// 产物: data/v2_deep/posts_pullpush.json / posts_webbridge.json / posts_all.json + .csv
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';

const DAEMON = 'http://127.0.0.1:10086/command';
const SESSION = 'reddit-collect-v2';
const DIR = 'data/v2_deep';
const LEGACY_FILES = ['data/reddit_d15r.json', 'data/reddit_d15r_search.json'];

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const phase = arg('phase', 'all');
const pages = parseInt(arg('pages', '2'), 10);
const sleepMs = parseInt(arg('sleep-ms', '4000'), 10);
const doMerge = !args.includes('--no-merge');
const fromIdx = parseInt(arg('from', '0'), 10);
const toIdx = parseInt(arg('to', '99999'), 10);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- 查询矩阵（英语主导） ----------
const BRANDS = ['aerones', 'lucidbot', 'lucid bots', 'jiusi', 'apellix'];

// PullPush 查询：引号短语（query_string 语义）+ 品牌 + 子版限定 + 多语种
const PULLPUSH_QUERIES = [
  // EN 核心短语
  { q: '"window cleaning drone"', lang: 'en' }, { q: '"window washing drone"', lang: 'en' },
  { q: '"drone window cleaning"', lang: 'en' }, { q: '"drone window washing"', lang: 'en' },
  { q: '"facade cleaning drone"', lang: 'en' }, { q: '"drone facade cleaning"', lang: 'en' },
  { q: '"building cleaning drone"', lang: 'en' }, { q: '"drone building cleaning"', lang: 'en' },
  { q: '"skyscraper cleaning drone"', lang: 'en' }, { q: '"high rise cleaning drone"', lang: 'en' },
  { q: '"solar panel cleaning drone"', lang: 'en' }, { q: '"drone solar panel cleaning"', lang: 'en' },
  { q: '"solar cleaning drone"', lang: 'en' }, { q: '"solar panel cleaning robot"', lang: 'en' },
  { q: '"solar panel cleaning machine"', lang: 'en' },
  { q: '"drone pressure washing"', lang: 'en' }, { q: '"drone pressure wash"', lang: 'en' },
  { q: '"pressure washing drone"', lang: 'en' }, { q: '"drone power washing"', lang: 'en' },
  { q: '"drone power wash"', lang: 'en' }, { q: '"power washing drone"', lang: 'en' },
  { q: '"cleaning drone"', lang: 'en' }, { q: '"drone cleaning"', lang: 'en' },
  { q: '"cleaning drones"', lang: 'en' }, { q: '"drones cleaning"', lang: 'en' },
  { q: '"washing drone"', lang: 'en' }, { q: '"drone washing"', lang: 'en' },
  { q: '"drone roof cleaning"', lang: 'en' }, { q: '"roof cleaning drone"', lang: 'en' },
  { q: '"drone gutter cleaning"', lang: 'en' }, { q: '"gutter cleaning drone"', lang: 'en' },
  { q: '"glass cleaning drone"', lang: 'en' }, { q: '"drone glass cleaning"', lang: 'en' },
  { q: '"exterior cleaning drone"', lang: 'en' }, { q: '"window cleaning robot"', lang: 'en' },
  { q: '"facade cleaning robot"', lang: 'en' }, { q: '"window washing robot"', lang: 'en' },
  // 品牌
  { q: 'Aerones', lang: 'en' }, { q: 'LucidBots', lang: 'en' }, { q: '"Lucid Bots"', lang: 'en' },
  { q: 'JIUSI', lang: 'en' }, { q: 'Apellix', lang: 'en' },
  // 子版限定：行业内提到 drone/robot/cleaning 即相关
  { q: 'drone', sub: 'windowcleaning', lang: 'en' },
  { q: 'drone', sub: 'pressurewashing', lang: 'en' },
  { q: 'cleaning', sub: 'solar', lang: 'en' },
  { q: 'clean', sub: 'SolarDIY', lang: 'en' },
  { q: 'cleaning', sub: 'Skyscrapers', lang: 'en' },
  { q: 'drone', sub: 'CommercialDrones', lang: 'en' },
  { q: '"window cleaning"', sub: 'drones', lang: 'en' },
  { q: '"pressure washing"', sub: 'drones', lang: 'en' },
  { q: '"solar panel"', sub: 'drones', lang: 'en' },
  // 多语种
  { q: '"dron limpieza"', lang: 'es' }, { q: '"dron de limpieza"', lang: 'es' },
  { q: '"limpieza de fachadas"', lang: 'es' }, { q: '"dron limpieza ventanas"', lang: 'es' },
  { q: '"dron paneles solares"', lang: 'es' },
  { q: '"drone nettoyage"', lang: 'fr' }, { q: '"nettoyage façade"', lang: 'fr' },
  { q: '"drone nettoyage vitres"', lang: 'fr' }, { q: '"drone panneaux solaires"', lang: 'fr' },
  { q: '"drohne reinigung"', lang: 'de' }, { q: '"drohne fassadenreinigung"', lang: 'de' },
  { q: '"drohne fensterreinigung"', lang: 'de' }, { q: '"drohne solarreinigung"', lang: 'de' },
  { q: '"drone pulizia"', lang: 'it' }, { q: '"drone pulizia facciate"', lang: 'it' },
  { q: '"drone pulizia vetri"', lang: 'it' },
];

// WebBridge 查询（浏览器内 fetch，带 cookie）：新鲜帖优先 + 品牌 + 多语种
const WB_QUERIES = [
  { q: '"drone cleaning"', t: 'year' }, { q: '"cleaning drone"', t: 'year' },
  { q: '"window cleaning drone"', t: 'year' }, { q: '"drone window cleaning"', t: 'year' },
  { q: '"solar panel cleaning"', t: 'year' }, { q: '"solar panel cleaning drone"', t: 'year' },
  { q: '"drone pressure washing"', t: 'year' }, { q: '"drone power washing"', t: 'year' },
  { q: '"drone washing"', t: 'year' }, { q: '"facade cleaning"', t: 'year' },
  { q: '"building cleaning drone"', t: 'year' }, { q: '"drone gutter cleaning"', t: 'year' },
  { q: '"drone roof cleaning"', t: 'year' }, { q: '"window cleaning robot"', t: 'year' },
  { q: '"solar panel cleaning robot"', t: 'year' }, { q: 'Aerones', t: 'year' },
  { q: 'LucidBots', t: 'year' }, { q: '"Lucid Bots"', t: 'year' }, { q: 'JIUSI', t: 'year' },
  { q: '"drone cleaning"', t: 'all' }, { q: '"window cleaning drone"', t: 'all' },
  { q: '"solar panel cleaning drone"', t: 'all' }, { q: '"drone pressure washing"', t: 'all' },
  { q: '"cleaning drone"', t: 'all' },
  { q: '"dron limpieza"', t: 'all' }, { q: '"drone nettoyage"', t: 'all' },
  { q: '"drohne reinigung"', t: 'all' }, { q: '"drone pulizia"', t: 'all' },
  { q: '"dron limpieza fachadas"', t: 'all' }, { q: '"nettoyage façade drone"', t: 'all' },
  { q: '"drohne fassadenreinigung"', t: 'all' }, { q: '"drone pulizia facciate"', t: 'all' },
];

// ---------- 相关性过滤 ----------
const CLEAN_EN = [
  'window clean', 'window wash', 'glass clean', 'glass wash', 'facade', 'building clean',
  'building wash', 'skyscraper', 'high rise', 'highrise', 'solar panel', 'solar farm', 'pv panel',
  'photovoltaic', 'pressure wash', 'power wash', 'soft wash', 'roof clean', 'gutter',
  'exterior clean', 'exterior wash', 'cleaning drone', 'drone clean', 'drone wash',
  'washing drone', 'drone washing', 'drone cleaning', 'cleaning service', 'clean drones',
  'drones cleaning', 'cleaning robots',
];

function detectLang(t) {
  if (/\b(dron(es)?\b|limpieza|limpiar)/.test(t) && /limpieza|limpiar/.test(t)) return 'es';
  if (/nettoyage|nettoyer/.test(t)) return 'fr';
  if (/reinigung|reinigen|fassaden/.test(t)) return 'de';
  if (/pulizia|pulire/.test(t)) return 'it';
  return 'en';
}

function relevant(p) {
  const t = `${p.title} ${p.selftext}`.toLowerCase();
  if (BRANDS.some(b => t.includes(b))) return true;
  const hasSubject = /drone|drones|uav|quadcopter|drohne|dron\b/.test(t);
  if (hasSubject && CLEAN_EN.some(c => t.includes(c))) return true;
  if (/dron/.test(t) && /limpieza|limpiar/.test(t)) return true;
  if (/drone|drones/.test(t) && /nettoyage|nettoyer/.test(t)) return true;
  if (/drohne/.test(t) && /reinigung|reinigen/.test(t)) return true;
  if (/drone|drones/.test(t) && /pulizia|pulire/.test(t)) return true;
  return false;
}

// ---------- 归一化 ----------
function normalize(d, source, lang, query) {
  return {
    id: d.id || '',
    title: d.title || '',
    selftext: (d.selftext || '').slice(0, 1000),
    subreddit: d.subreddit || '',
    author: d.author || '',
    created_utc: d.created_utc || null,
    created_iso: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
    score: d.score || 0,
    num_comments: d.num_comments || 0,
    permalink: d.permalink ? 'https://www.reddit.com' + d.permalink : (d.permalink || ''),
    url: d.url || '',
    over_18: d.over_18 || false,
    source, lang, query,
  };
}

// ---------- PullPush ----------
function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { headers: { 'User-Agent': 'partdro-research/2.0' }, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
}

async function pullpush(q, sub, before) {
  const u = new URL('https://api.pullpush.io/reddit/search/submission/');
  u.searchParams.set('q', q);
  u.searchParams.set('size', '100');
  if (sub) u.searchParams.set('subreddit', sub);
  if (before) u.searchParams.set('before', String(before));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetchWithTimeout(u, 28000);
      if (res.status === 429) { await sleep(20000); continue; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      const rows = Array.isArray(j.data) ? j.data : [];
      // 限流时常表现为 200 + 空结果：首页空则冷却后重试一次
      if (rows.length === 0 && !before && attempt < 3) { await sleep(20000); continue; }
      return rows;
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(12000);
    }
  }
  return [];
}

async function runPullPush(collected) {
  console.log(`\n===== Phase A: PullPush | ${PULLPUSH_QUERIES.length} queries × ${pages} pages =====`);
  for (let qi = 0; qi < PULLPUSH_QUERIES.length; qi++) {
    if (qi < fromIdx || qi > toIdx) continue;
    const Q = PULLPUSH_QUERIES[qi];
    const label = `${Q.q}${Q.sub ? ` @r/${Q.sub}` : ''}`;
    let fetched = 0, kept = 0;
    let before;
    for (let pg = 1; pg <= pages; pg++) {
      try {
        const rows = await pullpush(Q.q, Q.sub, before);
        fetched += rows.length;
        for (const d of rows) {
          const p = normalize(d, 'pullpush', Q.lang || detectLang(`${d.title} ${d.selftext}`), label);
          if (!p.id || collected.has(p.id)) continue;
          if (p.over_18) continue;
          if (!relevant(p)) continue;
          collected.set(p.id, p); kept++;
        }
        if (rows.length < 100) break;
        const last = rows[rows.length - 1];
        before = last.created_utc;
        if (!before) break;
      } catch (e) {
        console.warn(`  [${qi + 1}/${PULLPUSH_QUERIES.length}] page${pg} FAILED: ${e.message}`);
        break;
      }
      await sleep(sleepMs);
    }
    console.log(`[${qi + 1}/${PULLPUSH_QUERIES.length}] ${label} → fetched ${fetched}, kept ${kept}, total ${collected.size}`);
    await sleep(sleepMs + Math.floor(Math.random() * 2000));
  }
}

// ---------- WebBridge ----------
async function cmd(action, cmdArgs) {
  const res = await fetch(DAEMON, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args: cmdArgs, session: SESSION }),
  });
  if (!res.ok) throw new Error(`daemon HTTP ${res.status}`);
  return res.json();
}

function makeFetchCode(query, t) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=${t}&limit=100&raw_json=1`;
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
      return JSON.stringify({ count: posts.length, posts });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  })()`;
}

async function runWebBridge(collected) {
  console.log(`\n===== Phase B: WebBridge | ${WB_QUERIES.length} queries =====`);
  try {
    const nav = await cmd('navigate', { url: 'https://www.reddit.com', newTab: true, group_title: 'Reddit 采集 v2' });
    if (!nav.ok && !nav.success) throw new Error('navigate failed');
    console.log('[health] daemon OK');
  } catch (e) {
    console.error(`[health] FAILED: ${e.message} — 请确认 kimi-webbridge daemon 已启动`);
    return;
  }
  await sleep(5000);
  for (let qi = 0; qi < WB_QUERIES.length; qi++) {
    const Q = WB_QUERIES[qi];
    try {
      const r = await cmd('evaluate', { code: makeFetchCode(Q.q, Q.t) });
      const raw = r?.data?.value || r?.value;
      if (!raw) { console.warn(`  [${qi + 1}] no data`); continue; }
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (data.error) { console.warn(`  [${qi + 1}] ${Q.q}: ${data.error}`); continue; }
      let kept = 0;
      for (const d of data.posts || []) {
        const p = normalize(d, 'webbridge', detectLang(`${d.title} ${d.selftext}`), `${Q.q} t=${Q.t}`);
        if (!p.id || collected.has(p.id)) continue;
        if (p.over_18) continue;
        if (!relevant(p)) continue;
        collected.set(p.id, p); kept++;
      }
      console.log(`[${qi + 1}/${WB_QUERIES.length}] ${Q.q} t=${Q.t} → fetched ${data.count}, kept ${kept}, total ${collected.size}`);
    } catch (e) {
      console.warn(`  [${qi + 1}] FAILED: ${e.message}`);
    }
    await sleep(2500);
  }
  try { await cmd('close_session', {}); } catch {}
}

// ---------- 合并 + 统计 ----------
function loadLegacy(collected) {
  // 旧数据（kimi 人工挖掘 + PullPush d15r 专查）
  for (const f of LEGACY_FILES) {
    if (!existsSync(f)) continue;
    try {
      const j = JSON.parse(readFileSync(f, 'utf8'));
      let n = 0;
      for (const s of j.submissions || []) {
        if (!s.id || collected.has(s.id)) continue;
        const p = { ...s, source: 'legacy', lang: detectLang(`${s.title} ${s.selftext || ''}`) };
        if (!p.created_iso && p.created_utc) p.created_iso = new Date(p.created_utc * 1000).toISOString();
        collected.set(s.id, p); n++;
      }
      console.log(`[legacy] ${f}: +${n}`);
    } catch (e) { console.warn(`[legacy] ${f}: ${e.message}`); }
  }
  // 阶段落盘产物（分阶段运行时保证 posts_all 不丢数据）
  for (const f of [`${DIR}/posts_pullpush.json`, `${DIR}/posts_webbridge.json`]) {
    if (!existsSync(f)) continue;
    try {
      const j = JSON.parse(readFileSync(f, 'utf8'));
      let n = 0;
      for (const s of j.submissions || []) {
        if (!s.id || collected.has(s.id)) continue;
        collected.set(s.id, { ...s, source: s.source || 'pullpush' }); n++;
      }
      console.log(`[dump] ${f}: +${n}`);
    } catch (e) { console.warn(`[dump] ${f}: ${e.message}`); }
  }
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function mergeAndReport(collected) {
  mkdirSync(DIR, { recursive: true });
  const all = [...collected.values()].filter(p => p.id);
  const counts = { pullpush: 0, webbridge: 0, legacy: 0 };
  for (const p of all) counts[p.source] = (counts[p.source] || 0) + 1;

  writeFileSync(`${DIR}/posts_all.json`, JSON.stringify({
    fetched_at: new Date().toISOString(),
    sources: counts,
    total: all.length,
    submissions: all,
  }, null, 2));
  const header = 'id,lang,source,created_iso,subreddit,score,num_comments,author,title,permalink,selftext';
  writeFileSync(`${DIR}/posts_all.csv`, '\uFEFF' + header + '\n' + all.map(s =>
    [s.id, s.lang, s.source, s.created_iso, s.subreddit, s.score, s.num_comments, s.author, s.title, s.permalink, s.selftext].map(csvCell).join(',')
  ).join('\n'));

  console.log(`\n===== 合并完成: ${all.length} 帖 → ${DIR}/posts_all.json / .csv =====`);
  console.log(`来源分布: ${JSON.stringify(counts)}`);

  const byLang = {}, bySub = {}, byYear = {};
  for (const p of all) {
    byLang[p.lang] = (byLang[p.lang] || 0) + 1;
    bySub[p.subreddit] = (bySub[p.subreddit] || 0) + 1;
    const y = p.created_iso?.slice(0, 4);
    if (y) byYear[y] = (byYear[y] || 0) + 1;
  }
  console.log('按语种:', JSON.stringify(byLang));
  console.log('按年份:', JSON.stringify(Object.fromEntries(Object.entries(byYear).sort())));
  console.log('Top 15 子版:');
  for (const [name, n] of Object.entries(bySub).sort((a, b) => b[1] - a[1]).slice(0, 15))
    console.log(`  r/${name}: ${n}`);
  const times = all.map(s => s.created_utc).filter(v => typeof v === 'number');
  if (times.length) {
    console.log(`时间范围: ${new Date(Math.min(...times) * 1000).toISOString()} → ${new Date(Math.max(...times) * 1000).toISOString()}`);
  }
  const fresh = all.filter(p => p.created_utc && p.created_utc > Date.now() / 1000 - 86400 * 90).length;
  console.log(`近90天新鲜帖: ${fresh}`);
}

// ---------- main ----------
(async () => {
  const collected = new Map();
  loadLegacy(collected);
  console.log(`[init] 旧数据载入: ${collected.size} 帖`);

  if (phase === 'all' || phase === 'pullpush') await runPullPush(collected);
  if (phase === 'all' || phase === 'webbridge') await runWebBridge(collected);

  if (phase === 'pullpush' || phase === 'webbridge') {
    // 阶段性落盘
    mkdirSync(DIR, { recursive: true });
    const out = `${DIR}/posts_${phase}.json`;
    writeFileSync(out, JSON.stringify({ fetched_at: new Date().toISOString(), total: collected.size, submissions: [...collected.values()] }, null, 2));
    console.log(`\n[save] ${out} (${collected.size})`);
  }

  if (phase === 'merge' || doMerge) mergeAndReport(collected);
  console.log('\nDone.');
})();

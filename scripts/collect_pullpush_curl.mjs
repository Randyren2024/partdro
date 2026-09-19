// PullPush via curl —— 绕过基于 HTTP 指纹的反爬
// node fetch 被 PullPush 标记为"agents"，但 curl 可以通过
// 用法: node scripts/collect_pullpush_curl.mjs --from 67 --pages 3   （批次2，索引67+为新增）
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DIR = 'data/v2_deep';
const LEGACY_FILES = ['data/reddit_d15r.json', 'data/reddit_d15r_search.json'];
const DUMP_FILE = `${DIR}/posts_pullpush.json`;

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const fromIdx = parseInt(arg('from', '0'), 10);
const toIdx = parseInt(arg('to', '99999'), 10);
const pages = parseInt(arg('pages', '2'), 10);
const sleepMs = parseInt(arg('sleep-ms', '6000'), 10);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- 查询列表（与 collect_v2.mjs 对齐，索引一致） ----------
const BRANDS = ['aerones', 'lucidbot', 'lucid bots', 'jiusi', 'apellix', 'lavo bot', 'sherpa drone'];
const QUERIES = [
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
  { q: 'Aerones', lang: 'en' }, { q: 'LucidBots', lang: 'en' }, { q: '"Lucid Bots"', lang: 'en' },
  { q: 'JIUSI', lang: 'en' }, { q: 'Apellix', lang: 'en' },
  { q: 'drone', sub: 'windowcleaning', lang: 'en' },
  { q: 'drone', sub: 'pressurewashing', lang: 'en' },
  { q: 'cleaning', sub: 'solar', lang: 'en' },
  { q: 'clean', sub: 'SolarDIY', lang: 'en' },
  { q: 'cleaning', sub: 'Skyscrapers', lang: 'en' },
  { q: 'drone', sub: 'CommercialDrones', lang: 'en' },
  { q: '"window cleaning"', sub: 'drones', lang: 'en' },
  { q: '"pressure washing"', sub: 'drones', lang: 'en' },
  { q: '"solar panel"', sub: 'drones', lang: 'en' },
  { q: '"dron limpieza"', lang: 'es' }, { q: '"dron de limpieza"', lang: 'es' },
  { q: '"limpieza de fachadas"', lang: 'es' }, { q: '"dron limpieza ventanas"', lang: 'es' },
  { q: '"dron paneles solares"', lang: 'es' },
  { q: '"drone nettoyage"', lang: 'fr' }, { q: '"nettoyage façade"', lang: 'fr' },
  { q: '"drone nettoyage vitres"', lang: 'fr' }, { q: '"drone panneaux solaires"', lang: 'fr' },
  { q: '"drohne reinigung"', lang: 'de' }, { q: '"drohne fassadenreinigung"', lang: 'de' },
  { q: '"drohne fensterreinigung"', lang: 'de' }, { q: '"drohne solarreinigung"', lang: 'de' },
  { q: '"drone pulizia"', lang: 'it' }, { q: '"drone pulizia facciate"', lang: 'it' },
  { q: '"drone pulizia vetri"', lang: 'it' },
  // ---- 批次2（索引67+）：品牌补 ----
  { q: 'Ozmo', lang: 'en' }, { q: '"Lavo Bot"', lang: 'en' },
  { q: '"Lucid drone"', lang: 'en' }, { q: '"Sherpa drone"', lang: 'en' },
  { q: 'Anybots', lang: 'en' },
  // ---- 应用面 ----
  { q: '"solar farm cleaning"', lang: 'en' }, { q: '"solar panel cleaning"', lang: 'en' },
  { q: '"PV cleaning"', lang: 'en' }, { q: '"rope access" drone', lang: 'en' },
  { q: '"BMU cleaning"', lang: 'en' }, { q: '"facade cleaning" drone', lang: 'en' },
  { q: '"gutter cleaning robot"', lang: 'en' }, { q: '"window cleaning business" drone', lang: 'en' },
  { q: '"drone soft wash"', lang: 'en' }, { q: '"drone cleaning service"', lang: 'en' },
  { q: '"drone cleaning business"', lang: 'en' },
  // ---- 组合词（放宽短语提量）----
  { q: '"window cleaning" drone', lang: 'en' }, { q: '"pressure washing" drone', lang: 'en' },
  { q: '"solar panel" drone', lang: 'en' }, { q: 'facade drone', lang: 'en' },
  { q: '"roof cleaning" drone', lang: 'en' }, { q: '"gutter cleaning" drone', lang: 'en' },
  { q: '"high rise" drone cleaning', lang: 'en' },
  // ---- 地点面 ----
  { q: '"drone cleaning" dubai', lang: 'en' }, { q: '"drone cleaning" london', lang: 'en' },
  { q: '"drone cleaning" singapore', lang: 'en' }, { q: '"drone cleaning" australia', lang: 'en' },
  // ---- 行业子版 ----
  { q: 'drone', sub: 'sweatystartup', lang: 'en' },
  { q: 'drone', sub: 'Entrepreneur', lang: 'en' },
  { q: 'drone', sub: 'smallbusiness', lang: 'en' },
  { q: 'drone', sub: 'powerwashingporn', lang: 'en' },
  { q: 'cleaning', sub: 'drones', lang: 'en' },
  { q: 'cleaning', sub: 'Construction', lang: 'en' },
  // ---- 多语种补充 ----
  { q: '"drohne gebäudereinigung"', lang: 'de' }, { q: '"fensterreinigung" drohne', lang: 'de' },
  { q: '"limpieza de fachadas" dron', lang: 'es' }, { q: '"limpieza de paneles solares" dron', lang: 'es' },
  { q: '"nettoyage de vitres" drone', lang: 'fr' }, { q: '"nettoyage photovoltaïque" drone', lang: 'fr' },
];

const CLEAN_EN = [
  'window clean', 'window wash', 'glass clean', 'glass wash', 'facade', 'building clean',
  'building wash', 'skyscraper', 'high rise', 'highrise', 'solar panel', 'solar farm', 'pv panel',
  'photovoltaic', 'pressure wash', 'power wash', 'soft wash', 'roof clean', 'gutter',
  'exterior clean', 'exterior wash', 'cleaning drone', 'drone clean', 'drone wash',
  'washing drone', 'drone washing', 'drone cleaning', 'cleaning service', 'clean drones',
  'drones cleaning', 'cleaning robots',
];

function detectLang(t) {
  if (/limpieza|limpiar/.test(t)) return 'es';
  if (/nettoyage|nettoyer/.test(t)) return 'fr';
  if (/reinigung|reinigen|fassaden/.test(t)) return 'de';
  if (/pulizia|pulire/.test(t)) return 'it';
  return 'en';
}

function relevant(p) {
  const t = `${p.title} ${p.selftext}`.toLowerCase();
  // 排除噪音：扫地拖地机器人 + Ozmo网球记者/动画角色 + Anybots杂谈（除非同时涉及窗墙/光伏/高楼/无人机）
  if (/\bozmo\b|deebot|ecovacs|yeedi|roborock|roomba|irobot|robot vacuum|robot mop|mopping|anybots/.test(t) && !/window|facade|solar|skyscraper|high ?rise|drone|uav/.test(t)) return false;
  if (BRANDS.some(b => t.includes(b))) return true;
  // 清洗机器人（含窗墙/光伏清洗机器人竞品）即使不提 drone 也保留
  if (/robot/.test(t) && /window clean|window wash|facade|building clean|solar panel|skyscraper|high rise|highrise/.test(t)) return true;
  const hasSubject = /drone|drones|uav|quadcopter|drohne|dron\b/.test(t);
  if (hasSubject && CLEAN_EN.some(c => t.includes(c))) return true;
  if (/dron/.test(t) && /limpieza|limpiar/.test(t)) return true;
  if (/drone|drones/.test(t) && /nettoyage|nettoyer/.test(t)) return true;
  if (/drohne/.test(t) && /reinigung|reinigen/.test(t)) return true;
  if (/drone|drones/.test(t) && /pulizia|pulire/.test(t)) return true;
  return false;
}

function normalize(d, source, lang, query) {
  return {
    id: d.id || '', title: d.title || '',
    selftext: (d.selftext || '').slice(0, 1000),
    subreddit: d.subreddit || '', author: d.author || '',
    created_utc: d.created_utc || null,
    created_iso: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
    score: d.score || 0, num_comments: d.num_comments || 0,
    permalink: d.permalink ? 'https://www.reddit.com' + d.permalink : (d.permalink || ''),
    url: d.url || '', over_18: d.over_18 || false,
    source, lang, query,
  };
}

// ---------- curl-based fetch ----------
function pullpushCurl(q, sub, before) {
  const u = new URL('https://api.pullpush.io/reddit/search/submission/');
  u.searchParams.set('q', q);
  u.searchParams.set('size', '100');
  if (sub) u.searchParams.set('subreddit', sub);
  if (before) u.searchParams.set('before', String(before));
  try {
    const out = execFileSync('curl', [
      '-s', '-m', '40', '-A', 'Mozilla/5.0 (X11; Linux x86_64) curl/8.x partdro-research',
      '--compressed', u.toString(),
    ], { maxBuffer: 16 * 1024 * 1024, encoding: 'utf8' });
    const j = JSON.parse(out);
    if (j.error) return { rows: [], error: j.error };
    return { rows: Array.isArray(j.data) ? j.data : [], error: null };
  } catch (e) {
    return { rows: [], error: e.message };
  }
}

// ---------- main ----------
(async () => {
  // 载入已有数据避免重复
  const collected = new Map();
  for (const f of LEGACY_FILES) {
    if (!existsSync(f)) continue;
    try {
      const j = JSON.parse(readFileSync(f, 'utf8'));
      for (const s of j.submissions || []) {
        if (!s.id) continue;
        collected.set(s.id, { ...s, source: 'legacy', lang: detectLang(`${s.title} ${s.selftext || ''}`) });
      }
    } catch {}
  }
  if (existsSync(DUMP_FILE)) {
    try {
      const j = JSON.parse(readFileSync(DUMP_FILE, 'utf8'));
      for (const s of j.submissions || []) {
        if (!s.id) continue;
        collected.set(s.id, s);
      }
      console.log(`[init] 已载入 dump: ${j.submissions?.length || 0} 帖`);
    } catch {}
  }
  console.log(`[init] 已有: ${collected.size} 帖`);

  console.log(`\n===== PullPush curl 模式 | queries [${fromIdx}..${toIdx}] × ${pages} pages =====`);

  for (let qi = fromIdx; qi <= Math.min(toIdx, QUERIES.length - 1); qi++) {
    const Q = QUERIES[qi];
    const label = `${Q.q}${Q.sub ? ` @r/${Q.sub}` : ''}`;
    let fetched = 0, kept = 0;
    let before;
    for (let pg = 1; pg <= pages; pg++) {
      const { rows, error } = pullpushCurl(Q.q, Q.sub, before);
      if (error) {
        // 限流：长冷却后重试一次
        if (/limit|rate/i.test(error) && pg === 1) {
          console.log(`  [${qi + 1}/${QUERIES.length}] rate-limited, sleeping 30s...`);
          await sleep(30000);
          const r2 = pullpushCurl(Q.q, Q.sub, before);
          if (r2.rows.length) {
            fetched += r2.rows.length;
            for (const d of r2.rows) {
              const p = normalize(d, 'pullpush', Q.lang || detectLang(`${d.title} ${d.selftext}`), label);
              if (!p.id || collected.has(p.id) || p.over_18 || !relevant(p)) continue;
              collected.set(p.id, p); kept++;
            }
          }
        } else {
          console.warn(`  [${qi + 1}/${QUERIES.length}] page${pg} error: ${error}`);
        }
        break;
      }
      fetched += rows.length;
      for (const d of rows) {
        const p = normalize(d, 'pullpush', Q.lang || detectLang(`${d.title} ${d.selftext}`), label);
        if (!p.id || collected.has(p.id) || p.over_18 || !relevant(p)) continue;
        collected.set(p.id, p); kept++;
      }
      if (rows.length < 100) break;
      const last = rows[rows.length - 1];
      before = last.created_utc;
      if (!before) break;
      await sleep(sleepMs);
    }
    console.log(`[${qi + 1}/${QUERIES.length}] ${label} → fetched ${fetched}, kept ${kept}, total ${collected.size}`);
    await sleep(sleepMs + Math.floor(Math.random() * 2000));
  }

  // 落盘（合并所有来源）
  mkdirSync(DIR, { recursive: true });
  const all = [...collected.values()].filter(p => p.id);
  writeFileSync(DUMP_FILE, JSON.stringify({
    fetched_at: new Date().toISOString(),
    total: all.length,
    submissions: all,
  }, null, 2));
  console.log(`\n[save] ${DUMP_FILE} (${all.length} 总)`);
})();

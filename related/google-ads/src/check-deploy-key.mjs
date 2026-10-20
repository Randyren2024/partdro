// 查 products 全部 slug + 线上 bundle 的 Supabase key
import 'dotenv/config';
const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;

const res = await fetch(`${URL}/rest/v1/products?select=id,slug,category,is_active`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
const rows = await res.json();
console.log('products 全部行:', JSON.stringify(rows, null, 1));

// 线上首页 HTML → 找 bundle 文件名 → 抓 bundle 查 key
const html = await (await fetch('https://www.droneworld.tech/')).text();
const bundles = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
console.log('\nbundles:', bundles.slice(0, 5));
for (const b of bundles.slice(0, 3)) {
  const js = await (await fetch(`https://www.droneworld.tech${b}`)).text();
  const hasNew = js.includes('sb_publishable_');
  const jwt = js.match(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/);
  const pub = js.match(/sb_publishable_[A-Za-z0-9_-]+/);
  console.log(`${b}: 新key=${hasNew} | publishable=${pub?.[0]?.slice(0,30) || '无'} | jwt前20=${jwt?.[0]?.slice(0,20) || '无'}`);
}

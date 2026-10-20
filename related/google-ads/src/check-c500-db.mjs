// 精确定位 C500 页面空白根因
import 'dotenv/config';
const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const get = async (path) => {
  const res = await fetch(`${URL}${path}`, { headers: H });
  const body = await res.text();
  let j = null; try { j = JSON.parse(body); } catch {}
  return { status: res.status, j, body };
};

// 1. products 全部行（去掉不存在的列）
let r = await get('/rest/v1/products?select=id,slug,category&order=id');
console.log('products:', r.status, JSON.stringify(r.j));

// 2. landing_content 全部 namespace
r = await get('/rest/v1/landing_content?select=namespace,lang');
console.log('landing_content namespaces:', r.status, JSON.stringify(r.j));

// 3. 完全按线上请求方式测 c500
r = await get('/rest/v1/landing_content?select=content&namespace=eq.c500&lang=eq.en');
console.log('线上同款请求 c500/en:', r.status, (r.body || '').slice(0, 100));

// 4. c500 的 products 行（模糊）
r = await get('/rest/v1/products?select=id,slug,category&slug=ilike.*500*');
console.log('slug 含 500:', r.status, JSON.stringify(r.j));

// 5. 检查 product_langs 全部
r = await get('/rest/v1/product_langs?select=product_id,lang,name&limit=20');
console.log('product_langs:', r.status, JSON.stringify(r.j));

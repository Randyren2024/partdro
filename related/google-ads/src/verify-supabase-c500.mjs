// 验证生产 Supabase anon key 是否失效 + C500 数据是否存在
import 'dotenv/config';

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
console.log('URL:', URL);
console.log('KEY 前 12 字符:', KEY?.slice(0, 12), '长度:', KEY?.length);

async function probe(name, path) {
  try {
    const res = await fetch(`${URL}${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const body = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(body); } catch {}
    if (!res.ok) {
      console.log(`❌ ${name}: HTTP ${res.status} ${body.slice(0, 120)}`);
      return null;
    }
    console.log(`✅ ${name}: HTTP ${res.ok ? 200 : res.status} 行数=${Array.isArray(parsed) ? parsed.length : '?'}`);
    return parsed;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    return null;
  }
}

// 1. 基础表连通性
await probe('products 表', '/rest/v1/products?select=id,slug&limit=5');
// 2. C500 产品行
const c500 = await probe('c500 产品行', `/rest/v1/products?select=id,slug&slug=eq.c500`);
// 3. c500 landing_content
const lc = await probe('landing_content c500/en', `/rest/v1/landing_content?select=namespace,lang&namespace=eq.c500`);
// 4. d15r landing_content 对照
await probe('landing_content d15r/en', `/rest/v1/landing_content?select=namespace,lang&namespace=eq.d15r`);

// 5. c500 产品详情字段
if (c500 && c500.length) {
  const id = c500[0].id;
  const pl = await fetch(`${URL}/rest/v1/product_langs?select=lang,name,tagline&product_id=eq.${id}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const plBody = await pl.json();
  console.log('c500 product_langs:', JSON.stringify(plBody).slice(0, 400));
}

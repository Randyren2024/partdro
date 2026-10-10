// 读取 inquiries 表所有行（service_role 绕 RLS）
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const envText = await readFile(path.join(ROOT, '.env'), 'utf8');
const env = Object.fromEntries(
  envText.split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
);
const URL = env.VITE_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const res = await fetch(`${URL}/rest/v1/inquiries?select=*`, {
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
  },
});
const rows = await res.json();
console.log(`inquiries 表共 ${rows.length} 行\n`);
for (const r of rows) {
  console.log(JSON.stringify(r, null, 2));
}

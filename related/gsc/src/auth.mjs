// 生成带 webmasters scope 的刷新令牌
// 运行: npm run auth  →  用【拥有 GSC 属性】的账号登录并授权
import 'dotenv/config';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const CLIENT_ID = process.env.GSC_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GSC_CLIENT_SECRET || process.env.GOOGLE_ADS_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('请先在 .env 填好 GSC_CLIENT_ID / GSC_CLIENT_SECRET');
  process.exit(1);
}

const SCOPE = 'https://www.googleapis.com/auth/webmasters';
let REDIRECT = '';

// 从 id_token 解出授权账号邮箱，便于确认选了哪个 Google 账号
function emailFromIdToken(idToken) {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString('utf8'));
    return payload.email || '(无 email)';
  } catch { return '(解析失败)'; }
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('code');
  if (!code) { res.writeHead(400).end('missing code'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h2>授权成功！回到终端复制刷新令牌，可关闭此页面。</h2>');
  server.close();
  exchange(code);
});

async function exchange(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) { console.error('交换失败:', JSON.stringify(data, null, 2)); process.exit(1); }
  console.log(`\n授权账号: ${data.id_token ? emailFromIdToken(data.id_token) : '(未返回 id_token)'}`);
  console.log('\n成功！把下面的刷新令牌填入 .env 的 GSC_REFRESH_TOKEN：\n');
  console.log(data.refresh_token);
  process.exit(0);
}

await new Promise((r) => server.listen(0, '127.0.0.1', r));
REDIRECT = `http://localhost:${server.address().port}`;
const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent+select_account`;

console.log('浏览器将自动打开，请用【拥有 GSC 属性的账号】登录并授权...\n');
console.log('(若未自动打开，手动访问:)\n' + authUrl + '\n');
spawn('explorer', [authUrl], { detached: true, stdio: 'ignore' }).unref();
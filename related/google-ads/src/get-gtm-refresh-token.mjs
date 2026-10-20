// 复用现有 OAuth 客户端（项目 artful-striker-458704-g1，属主 tom798645@gmail.com）
// 运行: node src/get-gtm-refresh-token.mjs
// 授权账号 = GTM 容器所有者 partdro2023@gmail.com（Cloud 项目属主与授权账号可以不同）
// 如需换账号：改下面的 GTM_AUTH_ACCOUNT 或设同名环境变量
import 'dotenv/config';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('请先在 .env 填好 GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET');
  process.exit(1);
}

const SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  // create_version 需要 edit.containerversions（缺它会报 insufficient authentication scopes）
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.delete.containers',
  'https://www.googleapis.com/auth/tagmanager.publish',
].join(' ');

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('code');
  if (!code) { res.writeHead(400).end('missing code'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h2>授权成功！回到终端复制刷新令牌，可以关闭此页面。</h2>');
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
  console.log('\n成功！把下面的刷新令牌填入 .env 的 GTM_REFRESH_TOKEN：\n');
  console.log(data.refresh_token);
  process.exit(0);
}

await new Promise(r => server.listen(0, '127.0.0.1', r));
const REDIRECT = `http://localhost:${server.address().port}`;
const GTM_AUTH_ACCOUNT = process.env.GTM_AUTH_ACCOUNT || 'partdro2023@gmail.com';
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent&login_hint=${encodeURIComponent(GTM_AUTH_ACCOUNT)}`;

console.log(`浏览器将打开，请用 ${GTM_AUTH_ACCOUNT} 登录并授权 GTM 权限...\n`);
console.log('(若浏览器未打开，手动访问:)\n' + authUrl + '\n');
spawn('explorer', [authUrl], { detached: true, stdio: 'ignore' }).unref();

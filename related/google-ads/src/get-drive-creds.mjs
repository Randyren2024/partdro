// OAuth 本地回调：用 google-ads 的 OAuth 客户端 + drive scope 授权 partdro 账户
// 复用 .env 里的 GOOGLE_ADS_CLIENT_ID / CLIENT_SECRET（属主 tom798645@gmail.com）
import 'dotenv/config';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('请先在 .env 填好 GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET');
  process.exit(1);
}

// 请求 Drive 只读 + userinfo.email（scope 列表，Google 用空格分隔，URL 里需编码）
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('code')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>授权成功！回到终端查看结果，可以关闭此页面。</h2>');
    const code = url.searchParams.get('code');
    server.close();
    exchange(code);
  } else {
    res.writeHead(400).end('missing code');
  }
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
  if (!res.ok) {
    console.error('交换失败:', JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log('\n成功！refresh_token:\n' + data.refresh_token + '\n');

  // 存成 authorized_user 格式的 JSON，给 GOOGLE_APPLICATION_CREDENTIALS 用
  const creds = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: data.refresh_token,
    type: 'authorized_user',
  };
  const outPath = 'C:\\Users\\81102\\.trae-cn\\secrets\\gdrive-credentials.json';
  fs.writeFileSync(outPath, JSON.stringify(creds, null, 2));
  console.log('已写入:', outPath);
  process.exit(0);
}

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const REDIRECT = `http://localhost:${port}`;
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&scope=${encodeURIComponent(SCOPES.join(' '))}&access_type=offline&prompt=consent`;

console.log('浏览器将自动打开，请用 partdro 账户（partdro2023@gmail.com）登录并授权...\n');
console.log('(若浏览器未打开，手动访问:)\n' + authUrl + '\n');
spawn('explorer', [authUrl], { detached: true, stdio: 'ignore' }).unref();

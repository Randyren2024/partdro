// OAuth 本地回调流程：生成刷新令牌（用 partdro2023@gmail.com 登录授权）
// 运行: npm run auth  →  浏览器打开授权页 → 登录 partdro2023 → 自动捕获 code
import 'dotenv/config';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { request as httpsRequest } from 'node:https';
import httpsProxyAgentPkg from 'https-proxy-agent';
const { HttpsProxyAgent } = httpsProxyAgentPkg;

// 令牌交换必须走系统代理（Node 原生 fetch 不认 HTTP_PROXY，直连 Google 会超时）
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
const AGENT = PROXY ? new HttpsProxyAgent(PROXY) : undefined;

async function postForm(url, params, attempts = 3) {
  const u = new URL(url);
  const body = params.toString();
  for (let i = 1; i <= attempts; i++) {
    try {
      return await new Promise((resolve, reject) => {
        const req = httpsRequest(
          {
            hostname: u.hostname,
            port: 443,
            path: u.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(body),
            },
            ...(AGENT ? { agent: AGENT } : {}),
          },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () =>
              resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => JSON.parse(data) })
            );
          }
        );
        req.on('error', reject);
        req.setTimeout(15000, () => req.destroy(new Error('connect timeout')));
        req.write(body);
        req.end();
      });
    } catch (e) {
      if (i === attempts) throw e;
      console.log(`  第${i}次网络失败(${e.message})，重试...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('请先在 .env 填好 GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET');
  process.exit(1);
}

const SCOPE = 'https://www.googleapis.com/auth/adwords';
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('code')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>授权成功！回到终端查看刷新令牌，可以关闭此页面。</h2>');
    const code = url.searchParams.get('code');
    server.close();
    exchange(code);
  } else {
    res.writeHead(400).end('missing code');
  }
});

async function exchange(code) {
  const res = await postForm('https://oauth2.googleapis.com/token', new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT,
    grant_type: 'authorization_code',
  }));
  const data = res.json();
  if (!res.ok) {
    console.error('交换失败:', JSON.stringify(data, null, 2));
    console.error(`(授权 code 未被消费仍可用，10 分钟内有效: ${code})`);
    process.exit(1);
  }
  console.log('\n成功！把下面的刷新令牌填入 .env 的 GOOGLE_ADS_REFRESH_TOKEN（覆盖旧值）：\n');
  console.log(data.refresh_token);
  process.exit(0);
}

await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const REDIRECT = `http://localhost:${port}`;
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&scope=${SCOPE}&access_type=offline&prompt=consent`;

console.log('浏览器将自动打开，请用 partdro2023@gmail.com 登录并授权...\n');
console.log('(若浏览器未打开，手动访问:)\n' + authUrl + '\n');
spawn('explorer', [authUrl], { detached: true, stdio: 'ignore' }).unref();

// 生成带 GA4 (analytics) scope 的刷新令牌
// 运行: npm run auth  →  用【拥有 GA4 属性的账号】登录并授权
import 'dotenv/config';
import { google } from 'googleapis';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const CLIENT_ID = process.env.GA4_CLIENT_ID;
const CLIENT_SECRET = process.env.GA4_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('请先在 .env 填好 GA4_CLIENT_ID / GA4_CLIENT_SECRET');
  process.exit(1);
}

// openid + email 用来回显「实际是哪个账号授的权」，避免授错账号
// analytics.readonly 读报告/配置，analytics.edit 改配置（转化、受众等）
const SCOPE = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
].join(' ');
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
  const err = url.searchParams.get('error');
  if (err) { console.error(`\nGoogle 返回错误: ${err} (${url.searchParams.get('error_description') || '-'})`); process.exit(1); }
  exchange(code);
});

// 换 token 走 googleapis 的 OAuth2 客户端，而不是原生 fetch：
// 原生 fetch(undici) 不读 HTTP_PROXY/HTTPS_PROXY，在必须走代理的网络里会直接连接超时。
async function exchange(code) {
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT);
  let tokens = null;
  let lastErr = null;

  for (let i = 1; i <= 3; i++) {
    try {
      ({ tokens } = await client.getToken(code));
      break;
    } catch (e) {
      lastErr = e;
      const detail = e?.response?.data;
      if (detail?.error) break;           // Google 明确回错，重试无意义
      if (i === 3) break;
      const wait = 3000 * i;
      console.log(`  ⚠ 换取 token 第${i}次失败(${String(e.message || e).slice(0, 70)})，${wait / 1000}s 后重试...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  if (!tokens) {
    const detail = lastErr?.response?.data;
    console.error('交换失败:', JSON.stringify(detail?.error ? detail : (lastErr?.message || String(lastErr)), null, 2));
    if (detail?.error === 'invalid_grant') {
      console.error('\n提示: code 只能使用一次且很快过期。请重新运行本脚本，并只打开最新那条链接。');
    } else {
      console.error('\n提示: 若报连接超时，说明当前网络需要代理，但 gaxios 没读到 HTTP_PROXY/HTTPS_PROXY。');
    }
    process.exit(1);
  }

  if (!tokens.refresh_token) {
    console.error('Google 没有返回 refresh_token（通常因为此前已授权且未带 prompt=consent）。请重新运行本脚本。');
    process.exit(1);
  }

  console.log(`\n授权账号: ${emailFromIdToken(tokens.id_token) || '(未返回 id_token，无法确认)'}`);
  console.log('\n成功！把下面的刷新令牌填入 .env 的 GA4_REFRESH_TOKEN：\n');
  console.log(tokens.refresh_token);
  process.exit(0);
}

await new Promise((r) => server.listen(0, '127.0.0.1', r));
REDIRECT = `http://localhost:${server.address().port}`;
const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent+select_account`;

console.log('浏览器将自动打开，请用【拥有 GA4 属性的账号】登录并授权...\n');
console.log('(若未自动打开，手动访问:)\n' + authUrl + '\n');
spawn('explorer', [authUrl], { detached: true, stdio: 'ignore' }).unref();

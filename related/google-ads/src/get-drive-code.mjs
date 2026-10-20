// OAuth 授权脚本（固定端口 56789，方便手动从地址栏复制 code）
import 'dotenv/config';
import { spawn } from 'node:child_process';

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
if (!CLIENT_ID) { console.error('需要 GOOGLE_ADS_CLIENT_ID'); process.exit(1); }

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];
const REDIRECT = 'http://localhost:56789';
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&scope=${encodeURIComponent(SCOPES.join(' '))}&access_type=offline&prompt=consent`;

console.log('\n=== 第 1 步：浏览器打开授权页 ===');
console.log('请用 partdro2023@gmail.com 登录并同意授权。\n');
console.log('若浏览器未自动打开，手动访问：\n' + authUrl + '\n');

spawn('explorer', [authUrl], { detached: true, stdio: 'ignore' }).unref();

console.log('=== 第 2 步：授权后复制 code ===');
console.log('授权成功后，浏览器会跳转到类似：');
console.log('  http://localhost:56789/?code=4/xxx.yyy');
console.log('复制 code= 后面的整串（到 & 之前），贴回终端即可。\n');

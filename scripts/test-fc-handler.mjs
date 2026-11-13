// FC handler 本地路由模拟测试（不依赖 OSS 对象内容）
// 本地模拟：OSS 内网 endpoint 仅阿里云内网可达，测试走公网 endpoint
process.env.OSS_INTERNAL = 'false'
const { handler } = await import('../dist-fc/index.js')

const ev = (rawPath, method = 'GET', headers = {}) => JSON.stringify({ rawPath, httpMethod: method, headers })

const cases = [
  ['/de/cases/', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/de/cases'],
  ['/de/cases/index.html', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/de/cases'],
  // 历史 Ads 落地链接：301 到现行产品页，且 gclid/utm 原样保留（归因不能丢）
  ['/products/c500?gclid=abc123&utm_source=google&utm_medium=cpc&utm_campaign=test', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/products/c500-delivery-drone?gclid=abc123&utm_source=google&utm_medium=cpc&utm_campaign=test'],
  ['/products/c500/', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/products/c500-delivery-drone'],
  ['/products/c500', 'GET', [['host', 'droneworld.tech']], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/products/c500-delivery-drone'],
  ['/about?utm_source=x', 'GET', [['host', 'droneworld.tech']], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/about?utm_source=x'],
  // /en/... 与无前缀英语路径重复：301 去前缀，query 保留；再叠加历史链接规则
  ['/en', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/'],
  ['/en/about?utm_source=x', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/about?utm_source=x'],
  ['/en/products/c500?gclid=abc123', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/products/c500-delivery-drone?gclid=abc123'],
  ['/', 'GET', [], (r) => r.statusCode === 301 || r.statusCode === 200 || r.statusCode === 503],
  ['/', 'OPTIONS', [], (r) => r.statusCode === 204],
  ['/de/cases', 'POST', [], (r) => r.statusCode === 405],
  ['/api/landing-content', 'OPTIONS', [], (r) => r.statusCode === 204],
  ['/api/inquiry', 'GET', [], (r) => r.statusCode === 405],
  ['/api/inquiry', 'POST', [], (r) => r.statusCode === 400],
  // inquiries webhook：GET 被 methodGuard 拦，POST 无密钥时 fail-closed
  ['/api/inquiry-webhook', 'GET', [], (r) => r.statusCode === 405],
  ['/api/inquiry-webhook', 'POST', [], (r) => r.statusCode === 401 || r.statusCode === 503],
  ['/this-does-not-exist', 'GET', [], (r) => r.statusCode === 404 || r.statusCode === 503],
  // C500 EAVision 独立落地页：英语 + 三语种目录 index 必须能被静态路由命中（本地无 bucket 时 503）
  ['/products/c500-partdro-eavision', 'GET', [], (r) => r.statusCode === 200 || r.statusCode === 503],
  ['/es/products/c500-partdro-eavision', 'GET', [], (r) => r.statusCode === 200 || r.statusCode === 503],
  ['/de/products/c500-partdro-eavision', 'GET', [], (r) => r.statusCode === 200 || r.statusCode === 503],
  ['/fr/products/c500-partdro-eavision', 'GET', [], (r) => r.statusCode === 200 || r.statusCode === 503],
  ['/products/c500-partdro-eavision/', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/products/c500-partdro-eavision'],
  ['/products/c500-partdro-eavision/index.html', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/products/c500-partdro-eavision'],
  ['/products/c500-partdro-eavision/assets/index-test.js', 'GET', [], (r) => r.statusCode === 200 || r.statusCode === 503],
  // U15 与 VF50P 四语种独立静态落地页：所有 locale 都必须由 FC 静态路由命中。
  ...['u15-multi-mission-drone', 'vf50p-long-endurance-vtol-uav'].flatMap((slug) =>
    ['', '/es', '/de', '/fr'].map((prefix) => [
      prefix + '/products/' + slug,
      'GET',
      [],
      (r) => r.statusCode === 200 || r.statusCode === 503,
    ]),
  ),
  // 主机规范化。FC 网关不透传 x-forwarded-proto，自定义域名设为 HTTPS-only，
  // http→https 由网关承担；handler 内不再读 proto，x-forwarded-proto 不触发 301。
  // 本地未配置 OSS bucket 时静态读取返回 503；有 bucket 时应为 200。二者都说明路由未被误判。
  ['/about', 'GET', [['x-forwarded-proto', 'http']], (r) => r.statusCode === 200 || r.statusCode === 503],
  ['/about', 'GET', [['host', 'droneworld.tech']], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/about'],
  ['/about', 'GET', [['host', 'abc.123.cn-hongkong.fc.devsapp.net']], (r) => r.statusCode !== 301],
]

let fail = 0
for (const [p, m, hdrs, assert] of cases) {
  const r = await handler(ev(p, m, Object.fromEntries(hdrs)))
  let ok
  try { ok = assert(r) } catch (e) { ok = false }
  console.log(`${ok ? '✓' : '✗'} ${m.padEnd(7)} ${p.padEnd(28)} → ${r.statusCode}${r.headers?.Location ? ' → ' + r.headers.Location : ''}`)
  if (!ok) { fail++; console.log('   实际返回:', JSON.stringify(r).slice(0, 160)) }
}
console.log(fail ? `\n${fail} 项失败` : '\n路由逻辑全部通过 ✓')
process.exit(fail ? 1 : 0)

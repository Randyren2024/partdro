// FC handler 本地路由模拟测试（不依赖 OSS 对象内容）
// 本地模拟：OSS 内网 endpoint 仅阿里云内网可达，测试走公网 endpoint
process.env.OSS_INTERNAL = 'false'
const { handler } = await import('../dist-fc/index.js')

const ev = (rawPath, method = 'GET', headers = {}) => JSON.stringify({ rawPath, httpMethod: method, headers })

const cases = [
  ['/de/cases/', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/de/cases'],
  ['/de/cases/index.html', 'GET', [], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/de/cases'],
  ['/', 'GET', [], (r) => r.statusCode === 301 || r.statusCode === 200 || r.statusCode === 503],
  ['/', 'OPTIONS', [], (r) => r.statusCode === 204],
  ['/de/cases', 'POST', [], (r) => r.statusCode === 405],
  ['/api/landing-content', 'OPTIONS', [], (r) => r.statusCode === 204],
  ['/this-does-not-exist', 'GET', [], (r) => r.statusCode === 404 || r.statusCode === 503],
  // 主机规范化
  ['/about', 'GET', [['x-forwarded-proto', 'http']], (r) => r.statusCode === 301 && r.headers.Location === 'https://www.droneworld.tech/about'],
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

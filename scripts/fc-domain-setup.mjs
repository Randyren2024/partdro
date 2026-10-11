// 临时脚本：把 www.droneworld.tech 绑定到 FC 函数 partdro-api（含 CAS 证书）
import { execFileSync } from 'node:child_process'

function aliyun(args) {
  return execFileSync('aliyun', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
}

// 1. 取证书 PEM
const certDetail = JSON.parse(aliyun(['cas', 'GetUserCertificateDetail', '--CertId', '27764550', '--region', 'cn-hangzhou']))
if (!certDetail.Cert || !certDetail.Key) throw new Error(`证书内容缺失: ${Object.keys(certDetail).join(',')}`)
console.log(`[cert] ${certDetail.Common} sans=${certDetail.Sans} 有效期 ${certDetail.StartDate} ~ ${certDetail.EndDate}`)

const DOMAIN = 'www.droneworld.tech'
// HTTPS-only：FC 网关不透传 scheme（event 无 x-forwarded-proto，requestContext.http.protocol
// 是线缆协议版本），函数无法做 http→https 301，改由网关直接拒绝 http，杜绝双协议重复收录
const body = {
  domainName: DOMAIN,
  protocol: 'HTTPS',
  routeConfig: { routes: [{ path: '/*', functionName: 'partdro-api', qualifier: 'LATEST' }] },
  certConfig: { certName: certDetail.Name || 'partdro-www', certificate: certDetail.Cert, privateKey: certDetail.Key },
}

// 2. 已存在则 PUT 更新，否则 POST 创建
let exists = false
try {
  aliyun(['fc', 'GET', `/2023-03-30/custom-domains/${DOMAIN}`, '--region', 'cn-hongkong'])
  exists = true
} catch {
  exists = false
}
const method = exists ? 'PUT' : 'POST'
const path = `/2023-03-30/custom-domains${exists ? '/' + DOMAIN : ''}`
const res = aliyun(['fc', method, path, '--header', 'Content-Type=application/json', '--body', JSON.stringify(body), '--region', 'cn-hongkong'])
const parsed = JSON.parse(res)
console.log(`[fc] ${exists ? '更新' : '创建'}域名成功: ${parsed.domainName} protocol=${parsed.protocol} route=${JSON.stringify(parsed.routeConfig?.routes)}`)

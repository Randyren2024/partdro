/**
 * Minimal static server with the same routing rules as the production FC handler:
 * extensionless paths resolve to <path>/index.html, paths with an extension must
 * be exact objects, and anything else is a clean 404.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

function safePath(root, requestPath) {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(requestPath, 'http://localhost').pathname)
  } catch {
    return null
  }
  if (pathname.includes('\0')) return null
  const relative = pathname.replace(/^\/+/, '')
  const candidate = resolve(root, relative)
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  return { pathname, candidate }
}

async function fileFor(root, pathname, candidate) {
  if (pathname.endsWith('/')) return join(candidate, 'index.html')
  if (!extname(pathname)) return join(candidate, 'index.html')
  return candidate
}

export function startServer({ root, port = 0, host = '127.0.0.1' } = {}) {
  if (!root) throw new Error('startServer requires a root directory')
  const rootDir = resolve(root)

  const server = createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Method Not Allowed')
      return
    }

    const safe = safePath(rootDir, req.url || '/')
    if (!safe) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Bad Request')
      return
    }

    const filePath = await fileFor(rootDir, safe.pathname, safe.candidate)
    try {
      const info = await stat(filePath)
      if (!info.isFile()) throw new Error('not a file')
      const body = await readFile(filePath)
      res.writeHead(200, {
        'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.byteLength,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      res.end(req.method === 'HEAD' ? undefined : body)
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<!DOCTYPE html><html lang="en"><head><title>Not Found</title></head><body><h1>404</h1></body></html>')
    }
  })

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      const address = server.address()
      resolvePromise({
        server,
        origin: `http://${host}:${address.port}`,
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = fileURLToPath(new URL('../../../dist-landing/vf50p/site/', import.meta.url))
  const port = Number(process.env.PORT || 4175)
  const { origin } = await startServer({ root, port })
  console.log(`[vf50p serve] ${origin}/products/vf50p-long-endurance-vtol-uav/`)
}

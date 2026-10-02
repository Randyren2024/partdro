// Fix URLs corrupted by brand rewrite: partdroag.com -> topxgunag.com, then re-download content images
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const file = path.join(ROOT, 'scripts', 'blog-data.json')
const posts = JSON.parse(await readFile(file, 'utf8'))

let n = 0
for (const p of posts) {
  if (p.content.includes('partdroag.com')) {
    p.content = p.content.split('www.partdroag.com').join('www.topxgunag.com')
    n++
  }
}
await writeFile(file, JSON.stringify(posts, null, 2))
console.log(`Restored URLs in ${n} posts. Now run: node scripts/repair-blog-images.mjs`)

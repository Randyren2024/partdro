// List first content image per post (for cover reuse planning)
import { readFile } from 'node:fs/promises'
import path from 'node:path'
const ROOT = path.resolve(import.meta.dirname, '..')
const posts = JSON.parse(await readFile(path.join(ROOT, 'scripts', 'blog-data.json'), 'utf8'))
for (const p of posts.filter(p => p.content.includes('<img'))) {
  const m = p.content.match(/src="([^"]+)"/)
  if (m) console.log(p.category, '|', m[1])
}
// distribution of Agriculture posts without imgs
const noImgAgr = posts.filter(p => p.category === 'Agriculture' && !p.content.includes('<img'))
console.log('\nAgriculture without imgs:', noImgAgr.length)

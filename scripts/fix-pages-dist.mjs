import fs from 'node:fs'
import path from 'node:path'

const source = path.resolve('.output/public/_nuxt')
const target = path.resolve('dist/_nuxt')

if (!fs.existsSync(source) || !fs.existsSync(target)) process.exit(0)

function copyMissing(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name)
    const targetPath = path.join(to, entry.name)

    if (entry.isDirectory()) {
      if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true })
      copyMissing(sourcePath, targetPath)
    } else if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

copyMissing(source, target)
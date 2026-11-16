import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const data = JSON.parse(fs.readFileSync(path.join(root, 'app/data/suppliers.json'), 'utf8'))
const csvText = fs.readFileSync(path.join(root, 'app/data/suppliers.csv'), 'utf8').replace(/^\uFEFF/, '')

function fail(message) {
  console.error('FAIL: ' + message)
  process.exitCode = 1
}

function parseCsvLine(line) {
  const fields = []
  let value = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"'
      i++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      fields.push(value)
      value = ''
    } else {
      value += char
    }
  }
  fields.push(value)
  return fields
}

const rows = data.suppliers
if (!Array.isArray(rows) || rows.length === 0) fail('suppliers.json must contain a non-empty suppliers array')

const ids = new Set()
const names = new Set()
const regionCounts = new Map()
const categoryKeys = new Set(Object.keys(data.categories || {}))

for (const row of rows) {
  for (const field of ['id', 'name', 'region', 'province', 'city', 'segment', 'category', 'category_label', 'status']) {
    if (typeof row[field] !== 'string' || !row[field].trim()) fail((row.id || '(unknown)') + ' is missing required field: ' + field)
  }
  if (ids.has(row.id)) fail('duplicate supplier id: ' + row.id)
  if (names.has(row.name)) fail('duplicate supplier name: ' + row.name)
  ids.add(row.id)
  names.add(row.name)
  regionCounts.set(row.region, (regionCounts.get(row.region) || 0) + 1)
  if (!categoryKeys.has(row.category)) fail(row.id + ' uses unknown category: ' + row.category)
  if (row.product_models && (!Array.isArray(row.product_models) || row.product_models.some(model => typeof model !== 'string' || !model.trim()))) {
    fail(row.id + ' has an invalid product_models list')
  }
  if (row.website) {
    try {
      const url = new URL(row.website)
      if (!['http:', 'https:'].includes(url.protocol)) fail(row.id + ' has a non-http website URL')
    } catch {
      fail(row.id + ' has an invalid website URL: ' + row.website)
    }
  }
  if (row.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email)) {
    fail(row.id + ' has an invalid contact email')
  }
}

const csvLines = csvText.split(/\r?\n/).filter(Boolean)
const headers = parseCsvLine(csvLines.shift())
const csvRows = new Map()
for (const line of csvLines) {
  const values = parseCsvLine(line)
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
  csvRows.set(record.id, record)
}
if (csvRows.size !== rows.length) fail('CSV has ' + csvRows.size + ' rows but JSON has ' + rows.length)
for (const row of rows) {
  const csv = csvRows.get(row.id)
  if (!csv) {
    fail('CSV is missing ' + row.id)
    continue
  }
  for (const field of ['name', 'region', 'province', 'city', 'category', 'website', 'status']) {
    if ((csv[field] || '') !== (row[field] || '')) fail('JSON/CSV mismatch for ' + row.id + '.' + field)
  }
  const csvModels = csv.product_models ? csv.product_models.split(';').filter(Boolean) : []
  const jsonModels = row.product_models || []
  if (csvModels.join('|') !== jsonModels.join('|')) fail('JSON/CSV mismatch for ' + row.id + '.product_models')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('Supplier data integrity passed: ' + rows.length + ' unique records; ' + regionCounts.size + ' regions; ' + categoryKeys.size + ' categories; JSON/CSV aligned.')
console.log('Regional counts:', Object.fromEntries(regionCounts))

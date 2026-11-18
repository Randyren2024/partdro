#!/usr/bin/env node
/**
 * 供应商产品入库管道（阶段 1：草稿入库）
 *
 * 数据来源：public.suppliers.product_models（service_role 专属，通过 Supabase CLI
 * 的 Management API 执行 SQL，不需要数据库密码）。
 *
 * 只做三件事：
 *   1. 把供应商型号展开成 products 草稿行（published=false，无规格、无图片）；
 *   2. 写入四语言 product_langs（型号 + 类目通用名，不覆盖已有产品的文案）；
 *   3. 在 private.product_sources 记录型号来源，便于后续核验留痕。
 *
 * 不编造任何规格。规格、图片、视频、正式文案由后续阶段逐条补齐后
 * 才把 published 翻成 true。
 *
 * 用法：
 *   node scripts/onboard-supplier-products.mjs            # 只生成候选与 SQL
 *   node scripts/onboard-supplier-products.mjs --apply    # 生成并写入数据库
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'uphfcvquglafkszqqxiq'
const APPLY = process.argv.includes('--apply')
const OUT_DIR = resolve('.tmp')

/** 已存在的产品：型号 → 现有 slug（只补来源关联，不新建、不覆盖文案） */
const MODEL_ALIASES = {
  Y160: 'y160-delivery-drone',
  运鹏800: 'yp800-delivery-drone',
  丰鹏800: 'fp800-agricultural-drone',
  C15: 'c15',
  'CW-15': 'cw-15-vtol-mapping-drone',
}

/** 中文型号 → slug（未列出的 ASCII 型号自动转小写 kebab） */
const SLUG_OVERRIDES = {
  '丰鹏700': 'fp700-agricultural-drone',
  '丰鹏600': 'fp600-agricultural-drone',
  '丰鹏300E': 'fp300e-agricultural-drone',
  '擎天80': 'qingtian-80-agricultural-drone',
  KT100: 'kt100-agricultural-drone',
  '星辰-15': 'xingchen-15-agricultural-drone',
  '星辰-40E': 'xingchen-40e-agricultural-drone',
  '星辰-40F': 'xingchen-40f-agricultural-drone',
  '星辰-100F': 'xingchen-100f-agricultural-drone',
  '星辰-650': 'xingchen-650-agricultural-drone',
  A80: 'a80-agricultural-drone',
}

/** 需要人工确认的型号（可能与其他型号同物异名） */
const NEEDS_REVIEW = new Set(['星辰-15'])

/** suppliers.category → products.category */
const CATEGORY_MAP = {
  agricultural: 'agricultural',
  helicopter: 'helicopter',
  fixed_wing: 'fixed_wing',
  evtol: 'EVTOL',
  industrial: 'industrial',
  components: 'components',
  defense: 'defense',
  other: 'other',
}

/** 类目通用名（四语言），只用于产品名后缀与短描述 */
const CATEGORY_LABEL = {
  agricultural: {
    en: 'Agricultural Drone', de: 'Agrardrohne', es: 'Dron agrícola', fr: 'Drone agricole',
    short: {
      en: 'Agricultural UAV platform sourced from a vetted manufacturer.',
      de: 'Agrar-UAV-Plattform von einem geprüften Hersteller.',
      es: 'Plataforma UAV agrícola de un fabricante verificado.',
      fr: 'Plateforme UAV agricole d’un fabricant vérifié.',
    },
  },
  helicopter: {
    en: 'Unmanned Helicopter', de: 'Unbemannter Hubschrauber', es: 'Helicóptero no tripulado', fr: 'Hélicoptère sans pilote',
    short: {
      en: 'Unmanned helicopter platform sourced from a vetted manufacturer.',
      de: 'Unbemannte Hubschrauberplattform von einem geprüften Hersteller.',
      es: 'Plataforma de helicóptero no tripulado de un fabricante verificado.',
      fr: 'Plateforme d’hélicoptère sans pilote d’un fabricant vérifié.',
    },
  },
  fixed_wing: {
    en: 'Fixed-Wing UAV', de: 'Starrflügel-UAV', es: 'UAV de ala fija', fr: 'UAV à aile fixe',
    short: {
      en: 'Fixed-wing UAV platform sourced from a vetted manufacturer.',
      de: 'Starrflügel-UAV-Plattform von einem geprüften Hersteller.',
      es: 'Plataforma UAV de ala fija de un fabricante verificado.',
      fr: 'Plateforme UAV à aile fixe d’un fabricant vérifié.',
    },
  },
  EVTOL: {
    en: 'eVTOL Aircraft', de: 'eVTOL-Luftfahrzeug', es: 'Aeronave eVTOL', fr: 'Aéronef eVTOL',
    short: {
      en: 'Electric VTOL aircraft sourced from a vetted manufacturer.',
      de: 'Elektrisches VTOL-Luftfahrzeug von einem geprüften Hersteller.',
      es: 'Aeronave VTOL eléctrica de un fabricante verificado.',
      fr: 'Aéronef VTOL électrique d’un fabricant vérifié.',
    },
  },
  industrial: {
    en: 'Industrial UAV', de: 'Industrie-UAV', es: 'UAV industrial', fr: 'UAV industriel',
    short: {
      en: 'Industrial UAV platform sourced from a vetted manufacturer.',
      de: 'Industrie-UAV-Plattform von einem geprüften Hersteller.',
      es: 'Plataforma UAV industrial de un fabricante verificado.',
      fr: 'Plateforme UAV industrielle d’un fabricant vérifié.',
    },
  },
  components: {
    en: 'UAV System', de: 'UAV-System', es: 'Sistema UAV', fr: 'Système UAV',
    short: {
      en: 'UAV system sourced from a vetted manufacturer.',
      de: 'UAV-System von einem geprüften Hersteller.',
      es: 'Sistema UAV de un fabricante verificado.',
      fr: 'Système UAV d’un fabricant vérifié.',
    },
  },
  defense: {
    en: 'Counter-UAV System', de: 'Drohnenabwehrsystem', es: 'Sistema antidrón', fr: 'Système anti-drone',
    short: {
      en: 'Counter-UAV system sourced from a vetted manufacturer.',
      de: 'Drohnenabwehrsystem von einem geprüften Hersteller.',
      es: 'Sistema antidrón de un fabricante verificado.',
      fr: 'Système anti-drone d’un fabricant vérifié.',
    },
  },
  other: {
    en: 'UAV Platform', de: 'UAV-Plattform', es: 'Plataforma UAV', fr: 'Plateforme UAV',
    short: {
      en: 'UAV platform sourced from a vetted manufacturer.',
      de: 'UAV-Plattform von einem geprüften Hersteller.',
      es: 'Plataforma UAV de un fabricante verificado.',
      fr: 'Plateforme UAV d’un fabricant vérifié.',
    },
  },
}

const DESCRIPTION_NOTE = {
  en: 'Manufacturer information is being verified. Specifications, configuration, availability and terms are confirmed individually before quoting.',
  de: 'Die Herstellerangaben werden derzeit geprüft. Spezifikationen, Konfiguration, Verfügbarkeit und Konditionen werden vor einem Angebot individuell bestätigt.',
  es: 'La información del fabricante está en proceso de verificación. Las especificaciones, la configuración, la disponibilidad y las condiciones se confirman individualmente antes de cotizar.',
  fr: 'Les informations du fabricant sont en cours de vérification. Les spécifications, la configuration, la disponibilité et les conditions sont confirmées individuellement avant tout devis.',
}

function runQuery(sql) {
  const out = execFileSync(
    'supabase',
    ['db', 'query', sql, '--linked', '--project-ref', PROJECT_REF, '--output', 'json'],
    {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, HTTP_PROXY: '', HTTPS_PROXY: '', ALL_PROXY: '' },
    },
  )
  const start = out.indexOf('[')
  const end = out.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('查询没有返回 JSON：' + out.slice(0, 400))
  return JSON.parse(out.slice(start, end + 1))
}

function slugify(model) {
  if (SLUG_OVERRIDES[model]) return SLUG_OVERRIDES[model]
  return model
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildLangs(model, category) {
  const label = CATEGORY_LABEL[category]
  const out = {}
  for (const lang of ['en', 'de', 'es', 'fr']) {
    out[lang] = {
      name: `${model} ${label[lang]}`,
      description: `${label[lang]}. ${DESCRIPTION_NOTE[lang]}`,
      short_desc: label.short[lang],
    }
  }
  return out
}

function main() {
  console.log(`读取供应商与现有产品…（项目 ${PROJECT_REF}）`)
  const suppliers = runQuery(
    `select id,name,segment,category,product_models from public.suppliers ` +
      `where coalesce(array_length(product_models,1),0)>0 order by id`,
  )
  const existing = new Set(
    runQuery(`select slug from public.products`).map((r) => r.slug),
  )

  const candidates = []
  const seenSlug = new Set()
  let order = 200

  for (const s of suppliers) {
    const category = CATEGORY_MAP[s.category]
    if (!category) {
      console.warn(`跳过 ${s.id}：未知类目 ${s.category}`)
      continue
    }
    for (const model of s.product_models ?? []) {
      const alias = MODEL_ALIASES[model]
      const slug = alias || slugify(model)
      const isExisting = alias ? existing.has(alias) : existing.has(slug)
      const row = {
        model,
        slug,
        category,
        supplier_id: s.id,
        supplier_name: s.name,
        segment: s.segment,
        existing_product: isExisting,
        needs_review: NEEDS_REVIEW.has(model) || s.category === 'other',
        sort_order: isExisting ? null : order++,
        langs: isExisting ? null : buildLangs(model, category),
      }
      candidates.push(row)
      if (!isExisting) seenSlug.add(slug)
    }
  }

  const newRows = candidates.filter((c) => !c.existing_product)
  const linkOnly = candidates.filter((c) => c.existing_product)

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(
    resolve(OUT_DIR, 'supplier-product-candidates.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), candidates }, null, 2),
  )

  const sqlRows = newRows.map((c) =>
    JSON.stringify({
      slug: c.slug,
      category: c.category,
      supplier_id: c.supplier_id,
      supplier_name: c.supplier_name,
      model: c.model,
      sort_order: c.sort_order,
      langs: c.langs,
    }),
  )
  const linkRows = linkOnly.map((c) =>
    JSON.stringify({
      slug: c.slug,
      category: c.category,
      supplier_id: c.supplier_id,
      supplier_name: c.supplier_name,
      model: c.model,
      sort_order: null,
      langs: null,
    }),
  )

  const payload = `[${[...sqlRows, ...linkRows].join(',')}]`
  const sql = buildSql(payload)
  const sqlPath = resolve(OUT_DIR, 'onboard-supplier-products.sql')
  writeFileSync(sqlPath, sql)

  console.log('')
  console.log(`供应商（有型号）：${suppliers.length}`)
  console.log(`型号条目：${candidates.length}`)
  console.log(`新建草稿产品：${newRows.length}（去重后 ${seenSlug.size} 个 slug）`)
  console.log(`仅补来源关联（已有产品）：${linkOnly.length}`)
  console.log(`待人工确认：${candidates.filter((c) => c.needs_review).length}`)
  console.log('')
  console.log(`候选清单：${resolve(OUT_DIR, 'supplier-product-candidates.json')}`)
  console.log(`SQL 文件：${sqlPath}`)

  if (!APPLY) {
    console.log('')
    console.log('（dry-run，未写入数据库。加 --apply 执行）')
    return
  }

  console.log('')
  console.log('写入数据库…')
  execFileSync(
    'supabase',
    ['db', 'query', '-f', sqlPath, '--linked', '--project-ref', PROJECT_REF],
    { stdio: 'inherit', env: { ...process.env, HTTP_PROXY: '', HTTPS_PROXY: '', ALL_PROXY: '' } },
  )
  const check = runQuery(
    `select count(*) filter (where published=false) as drafts, count(*) as total from public.products`,
  )
  console.log('写入完成：', JSON.stringify(check[0]))
}

function buildSql(payload) {
  return `with d as (
  select * from jsonb_to_recordset($json$${payload}$json$::jsonb) as x(
    slug text, category text, supplier_id text, supplier_name text, model text,
    sort_order int, langs jsonb
  )
), ins as (
  insert into public.products (slug, category, image_url, gallery, specs, features, sort_order, published)
  select d.slug, d.category, '/images/placeholder.svg', '{}'::text[], '{}'::jsonb, '[]'::jsonb, d.sort_order, false
  from (select distinct on (slug) * from d where langs is not null order by slug) d
  on conflict (slug) do nothing
  returning id, slug
), allp as (
  select id, slug from ins
  union
  select p.id, p.slug from public.products p join d on d.slug = p.slug
), l as (
  insert into public.product_langs (product_id, lang, name, description, short_desc)
  select a.id, e.key, e.value->>'name', e.value->>'description', e.value->>'short_desc'
  from allp a
  join (select distinct on (slug) * from d where langs is not null order by slug) d
    on d.slug = a.slug
  cross join lateral jsonb_each(d.langs) e
  on conflict (product_id, lang) do nothing
  returning 1
)
insert into private.product_sources (
  product_id, supplier_id, source_entity_name, original_model,
  source_kind, relationship_type, verification_status, evidence_note, captured_at
)
select a.id, d.supplier_id, d.supplier_name, d.model,
  'internal_file', 'manufacturer', 'pending',
  'Model name imported from the internal supplier register; specifications not yet verified.', now()
from allp a
join d on d.slug = a.slug
where not exists (
  select 1 from private.product_sources ps
  where ps.product_id = a.id and ps.original_model = d.model
    and ps.supplier_id is not distinct from d.supplier_id
);
`
}

main()

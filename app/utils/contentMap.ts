/**
 * Supabase 行 → 前端模型的纯映射函数。
 *
 * 之前这些函数只活在 useSupabase.ts 里（仅供浏览器端使用）。新闻页改为
 * 构建期 SSR 取数后，服务端也要用同一套映射，因此抽到这里作为单一事实来源，
 * 避免服务端与客户端出现两套字段回退逻辑。
 */
import type { Product, Post, Case, Document, Lang } from '~/types'

type LangRow = Record<string, any> & { lang: string }

export function pickLang<T extends LangRow>(langs: T[] | undefined, locale: Lang): T | undefined {
  if (!langs?.length) return undefined
  return langs.find((l) => l.lang === locale) ?? langs.find((l) => l.lang === 'en')
}

export function mapProduct(row: any, locale: Lang): Product {
  const lang = pickLang<any>(row.product_langs, locale)
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    image_url: row.image_url,
    gallery: row.gallery ?? [],
    specs: row.specs ?? {},
    features: row.features ?? [],
    sort_order: row.sort_order,
    published: row.published,
    created_at: row.created_at,
    name: lang?.name ?? row.slug,
    description: lang?.description ?? '',
    short_desc: lang?.short_desc ?? '',
  }
}

export function mapPost(row: any, locale: Lang): Post {
  const lang = pickLang<any>(row.post_langs, locale)
  const availableLangs = [...new Set<string>((row.post_langs ?? []).map((l: LangRow) => l.lang))]
  if (!availableLangs.includes('en')) availableLangs.unshift('en')
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    image_url: row.image_url,
    published: row.published,
    published_at: row.published_at,
    created_at: row.created_at,
    title: lang?.title ?? row.slug,
    summary: lang?.summary ?? '',
    content: lang?.content ?? '',
    availableLangs,
  }
}

export function mapCase(row: any, locale: Lang): Case {
  const lang = pickLang<any>(row.case_langs, locale)
  return {
    id: row.id,
    slug: row.slug,
    image_url: row.image_url,
    product_id: row.product_id,
    published: row.published,
    created_at: row.created_at,
    title: lang?.title ?? row.slug,
    description: lang?.description ?? '',
    location: lang?.location ?? '',
  }
}

export function mapDocument(row: any, locale: Lang): Document {
  const lang = pickLang<any>(row.document_langs, locale)
  return {
    id: row.id,
    file_url: row.file_url,
    file_size: row.file_size,
    product_id: row.product_id,
    published: row.published,
    created_at: row.created_at,
    title: lang?.title ?? '',
    description: lang?.description ?? '',
  }
}

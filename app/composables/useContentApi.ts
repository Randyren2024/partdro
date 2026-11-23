/**
 * 新闻内容读取（SSR 可用）。
 *
 * 与 useSupabase.ts 的区别：那套 composable 为了省掉预渲染期的上千次孤儿请求，
 * 显式在服务端直接 return，于是 384 个新闻页面的静态 HTML 里既没有正文也没有
 * title/canonical —— Google 只能看到一个空壳。
 *
 * 这里用 PostgREST 直连（anon key 本就公开）并返回 Promise，页面用 useAsyncData
 * 包住即可在构建期把内容写进预渲染 HTML，水合后同一份 payload 直接被复用。
 */
import { mapPost, mapProduct } from '~/utils/contentMap'
import type { Lang, Post, Product } from '~/types'

const POST_SELECT = '*,post_langs(lang,title,summary,content)'
const POST_LIST_SELECT = '*,post_langs(lang,title,summary,content)'
const POST_RELATED_SELECT = 'id,slug,category,image_url,published,published_at,created_at,post_langs(lang,title,summary)'
const PRODUCT_SELECT = '*,product_langs(lang,name,description,short_desc)'

export function useContentApi() {
  const config = useRuntimeConfig()
  const base = String(config.public.supabaseUrl || '').replace(/\/+$/, '')
  const key = String(
    config.public.supabasePublishableKey || config.public.supabaseAnonKey || '',
  )

  async function rest<T = any>(table: string, params: Record<string, string>): Promise<T> {
    if (!base || !key) throw new Error('Supabase public URL / publishable key 未配置')
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`${base}/rest/v1/${table}?${qs}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`Supabase ${table} HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`)
    return (await res.json()) as T
  }

  /** 单篇文章。文章 slug 全局唯一，语言差异放在 post_langs。 */
  async function fetchPost(slug: string, locale: Lang): Promise<Post | null> {
    const rows = await rest<any[]>('posts', {
      select: POST_SELECT,
      slug: `eq.${slug}`,
      published: 'eq.true',
      limit: '1',
    })
    return rows[0] ? mapPost(rows[0], locale) : null
  }

  /** 文章列表（按发布时间倒序）。 */
  async function fetchPosts(locale: Lang, options: { limit?: number; category?: string } = {}): Promise<Post[]> {
    const params: Record<string, string> = {
      select: POST_LIST_SELECT,
      published: 'eq.true',
      order: 'published_at.desc',
    }
    if (options.category) params.category = `eq.${options.category}`
    if (options.limit) params.limit = String(options.limit)
    const rows = await rest<any[]>('posts', params)
    return rows.map((r) => mapPost(r, locale))
  }

  /** 同分类相关文章：只取标题/摘要/封面，供文章页内链。 */
  async function fetchRelatedPosts(
    category: string,
    excludeSlug: string,
    locale: Lang,
    limit = 4,
  ): Promise<Post[]> {
    if (!category) return []
    const rows = await rest<any[]>('posts', {
      select: POST_RELATED_SELECT,
      published: 'eq.true',
      category: `eq.${category}`,
      order: 'published_at.desc',
      limit: String(limit + 1),
    })
    return rows
      .filter((r) => r.slug !== excludeSlug)
      .slice(0, limit)
      .map((r) => mapPost(r, locale))
  }

  /** 按 slug 批量取产品（用于文章页「相关产品」区块）。 */
  async function fetchProductsBySlugs(slugs: string[], locale: Lang): Promise<Product[]> {
    if (!slugs.length) return []
    const rows = await rest<any[]>('products', {
      select: PRODUCT_SELECT,
      slug: `in.(${slugs.map((s) => `"${s}"`).join(',')})`,
      published: 'eq.true',
    })
    const bySlug = new Map(rows.map((r) => [r.slug, mapProduct(r, locale)]))
    // 保持调用方给出的顺序（映射表里是人工排的优先级）
    return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p))
  }

  return { fetchPost, fetchPosts, fetchRelatedPosts, fetchProductsBySlugs }
}

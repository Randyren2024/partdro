import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../supabase/client'
import type { Product, Post, Case, Document, Lang, ProductCategory } from '../types'

/* ============================================================
 * 内部工具：根据当前语言合并 Lang 子表到主记录
 * ============================================================ */

type LangRow = Record<string, any> & { lang: string }

function pickLang<T extends LangRow>(langs: T[] | undefined, locale: Lang): T | undefined {
  if (!langs?.length) return undefined
  return langs.find((l) => l.lang === locale) ?? langs.find((l) => l.lang === 'en')
}

function mapProduct(row: any, locale: Lang): Product {
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

function mapPost(row: any, locale: Lang): Post {
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

function mapCase(row: any, locale: Lang): Case {
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

function mapDocument(row: any, locale: Lang): Document {
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

/* ============================================================
 * 组合式 API：以 ref 返回数据 + loading + error
 * 自动响应 i18n locale 切换重新拉取（防抖）
 * ============================================================ */

function useLocale(): { locale: { value: Lang }; bindLocale: (reload: () => void) => void } {
  const { locale } = useI18n()
  return {
    locale: locale as unknown as { value: Lang },
    bindLocale(reload: () => void) {
      watch(
        locale,
        () => {
          reload()
        },
        { flush: 'post' },
      )
    },
  }
}

/* ---------- Products ---------- */

export function useProducts(category?: ProductCategory) {
  const { locale, bindLocale } = useLocale()
  const data = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const reload = async () => {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('products')
        .select('*, product_langs(lang, name, description, short_desc)')
        .eq('published', true)
        .order('sort_order', { ascending: true })
      if (category) query = query.eq('category', category)
      const { data: rows, error: err } = await query
      if (err) throw err
      data.value = (rows ?? []).map((r: any) => mapProduct(r, locale.value))
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  bindLocale(reload)
  reload()

  return { data, loading, error, reload }
}

export function useProduct(slug: string | (() => string)) {
  const { locale, bindLocale } = useLocale()
  const data = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const resolveSlug = () => (typeof slug === 'function' ? slug() : slug)

  const reload = async () => {
    const s = resolveSlug()
    if (!s) return
    loading.value = true
    error.value = null
    try {
      const { data: rows, error: err } = await supabase
        .from('products')
        .select('*, product_langs(lang, name, description, short_desc)')
        .eq('slug', s)
        .limit(1)
      if (err) throw err
      data.value = rows?.[0] ? mapProduct(rows[0], locale.value) : null
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  bindLocale(reload)
  reload()

  return { data, loading, error, reload }
}

/* ---------- Posts ---------- */

export function usePosts(options?: { limit?: number }) {
  const { locale, bindLocale } = useLocale()
  const data = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const reload = async () => {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('posts')
        .select('*, post_langs(lang, title, summary, content)')
        .eq('published', true)
        .order('published_at', { ascending: false })
      if (options?.limit) query = query.limit(options.limit)
      const { data: rows, error: err } = await query
      if (err) throw err
      data.value = (rows ?? []).map((r: any) => mapPost(r, locale.value))
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  bindLocale(reload)
  reload()

  return { data, loading, error, reload }
}

export function usePost(slug: string | (() => string)) {
  const { locale, bindLocale } = useLocale()
  const data = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const resolveSlug = () => (typeof slug === 'function' ? slug() : slug)

  const reload = async () => {
    const s = resolveSlug()
    if (!s) return
    loading.value = true
    error.value = null
    try {
      const { data: rows, error: err } = await supabase
        .from('posts')
        .select('*, post_langs(lang, title, summary, content)')
        .eq('slug', s)
        .limit(1)
        .abortSignal(AbortSignal.timeout(10000))
      if (err) throw err
      data.value = rows?.[0] ? mapPost(rows[0], locale.value) : null
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  bindLocale(reload)
  reload()

  return { data, loading, error, reload }
}

/* ---------- Cases ---------- */

export function useCases() {
  const { locale, bindLocale } = useLocale()
  const data = ref<Case[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const reload = async () => {
    loading.value = true
    error.value = null
    try {
      const { data: rows, error: err } = await supabase
        .from('cases')
        .select('*, case_langs(lang, title, description, location)')
        .eq('published', true)
        .order('created_at', { ascending: false })
      if (err) throw err
      data.value = (rows ?? []).map((r: any) => mapCase(r, locale.value))
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  bindLocale(reload)
  reload()

  return { data, loading, error, reload }
}

/* ---------- Documents ---------- */

export function useDocuments() {
  const { locale, bindLocale } = useLocale()
  const data = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const reload = async () => {
    loading.value = true
    error.value = null
    try {
      const { data: rows, error: err } = await supabase
        .from('documents')
        .select('*, document_langs(lang, title, description)')
        .eq('published', true)
        .order('created_at', { ascending: true })
      if (err) throw err
      data.value = (rows ?? []).map((r: any) => mapDocument(r, locale.value))
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  bindLocale(reload)
  reload()

  return { data, loading, error, reload }
}

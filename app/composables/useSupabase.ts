import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../supabase/client'
import { mapCase, mapDocument, mapPost, mapProduct } from '~/utils/contentMap'
import type { Product, Post, Case, Document, Lang, ProductCategory } from '../types'

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
    // Supabase reads are intentionally client-side. These composables are not
    // awaited by Nuxt's static renderer, so firing them during every prerendered
    // route creates thousands of orphaned HTTP requests without adding data to
    // the generated HTML. The browser performs the same reads after hydration.
    if (import.meta.server) return
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
    // Supabase reads are intentionally client-side. These composables are not
    // awaited by Nuxt's static renderer, so firing them during every prerendered
    // route creates thousands of orphaned HTTP requests without adding data to
    // the generated HTML. The browser performs the same reads after hydration.
    if (import.meta.server) return
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
    // Supabase reads are intentionally client-side. These composables are not
    // awaited by Nuxt's static renderer, so firing them during every prerendered
    // route creates thousands of orphaned HTTP requests without adding data to
    // the generated HTML. The browser performs the same reads after hydration.
    if (import.meta.server) return
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

/**
 * 同分类的其他文章：用于文章页「相关文章」内链。
 * 只取标题/摘要/封面，不拉正文——文章页没必要为了内链把全站正文再下载一遍。
 * category/slug 依赖文章本身异步加载，用 watch 等它们就绪后再查。
 */
export function useRelatedPosts(
  category: () => string | undefined,
  excludeSlug: () => string | undefined,
  limit = 4,
) {
  const { locale, bindLocale } = useLocale()
  const data = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const reload = async () => {
    // Supabase reads are intentionally client-side. These composables are not
    // awaited by Nuxt's static renderer, so firing them during every prerendered
    // route creates thousands of orphaned HTTP requests without adding data to
    // the generated HTML. The browser performs the same reads after hydration.
    if (import.meta.server) return
    const cat = category()
    if (!cat) {
      data.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      const { data: rows, error: err } = await supabase
        .from('posts')
        .select('id,slug,category,image_url,published,published_at,created_at,post_langs(lang,title,summary)')
        .eq('published', true)
        .eq('category', cat)
        .order('published_at', { ascending: false })
        .limit(limit + 1)
      if (err) throw err
      const current = excludeSlug()
      data.value = (rows ?? [])
        .filter((r: any) => r.slug !== current)
        .slice(0, limit)
        .map((r: any) => mapPost(r, locale.value))
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  bindLocale(reload)
  watch([category, excludeSlug], reload, { immediate: true, flush: 'post' })

  return { data, loading, error, reload }
}

export function usePost(slug: string | (() => string)) {
  const { locale, bindLocale } = useLocale()
  const data = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const resolveSlug = () => (typeof slug === 'function' ? slug() : slug)

  const reload = async () => {
    // Supabase reads are intentionally client-side. These composables are not
    // awaited by Nuxt's static renderer, so firing them during every prerendered
    // route creates thousands of orphaned HTTP requests without adding data to
    // the generated HTML. The browser performs the same reads after hydration.
    if (import.meta.server) return
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
    // Supabase reads are intentionally client-side. These composables are not
    // awaited by Nuxt's static renderer, so firing them during every prerendered
    // route creates thousands of orphaned HTTP requests without adding data to
    // the generated HTML. The browser performs the same reads after hydration.
    if (import.meta.server) return
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
    // Supabase reads are intentionally client-side. These composables are not
    // awaited by Nuxt's static renderer, so firing them during every prerendered
    // route creates thousands of orphaned HTTP requests without adding data to
    // the generated HTML. The browser performs the same reads after hydration.
    if (import.meta.server) return
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

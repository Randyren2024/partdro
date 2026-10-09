import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useAuthStore } from '../stores/auth'
import i18n, { DEFAULT_LOCALE, isLocale } from '../i18n'

export const SITE_URL = 'https://www.droneworld.tech'

const siteChildren = [
  {
    path: '',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: 'products',
    name: 'products',
    component: () => import('../views/ProductsView.vue'),
  },
  {
    path: 'products/:slug',
    name: 'product-detail',
    component: () => import('../views/ProductDetailView.vue'),
  },
  {
    path: 'cases',
    name: 'cases',
    component: () => import('../views/CasesView.vue'),
  },
  {
    path: 'news',
    name: 'news',
    component: () => import('../views/NewsView.vue'),
  },
  {
    path: 'news/:slug',
    name: 'news-detail',
    component: () => import('../views/NewsDetailView.vue'),
  },
  {
    path: 'documents',
    name: 'documents',
    component: () => import('../views/DocumentsView.vue'),
  },
  {
    path: 'about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: 'contact',
    name: 'contact',
    component: () => import('../views/ContactView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/AdminLoginView.vue'),
    },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: () => import('../views/admin/AdminProductsView.vue'),
    },
    {
      path: '/admin/editor',
      redirect: '/products/d15r',
    },
    // 站内路由：可选语言前缀 /de /es /fr；英语（默认语言）不带前缀，
    // 保持根路径已收录 URL 不变，同时让每种语言拥有独立可抓取 URL。
    {
      path: '/:locale(en|es|de|fr)?',
      component: DefaultLayout,
      children: siteChildren,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// 有本地化 meta 的栏目路由（详情页 title 由各自视图按数据设置，不走这里）
const META_ROUTES = ['home', 'products', 'cases', 'news', 'documents', 'about', 'contact']

function setMetaContent(selector: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    const m = selector.match(/^meta\[([\w:-]+)="?([^"\]]+)"?\]$/)
    if (!m) return
    el = document.createElement('meta')
    el.setAttribute(m[1], m[2])
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

// 按路由 × 语言更新 title / description / canonical / OG / Twitter；
// to.path 已含语言前缀，canonical 即为该语言的规范 URL，预渲染会把这些标签写进静态 HTML。
router.afterEach((to) => {
  const name = to.name as string
  if (META_ROUTES.includes(name)) {
    const title = i18n.global.t(`meta.${name}.title`)
    const description = i18n.global.t(`meta.${name}.description`)
    document.title = title
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[name="twitter:title"]', title)
    setMetaContent('meta[name="twitter:description"]', description)
  }
  const url = `${SITE_URL}${to.path}`
  setMetaContent('meta[property="og:url"]', url)
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
})

router.beforeEach(async (to) => {
  // /en/... 与根路径英文内容重复，统一去掉前缀，避免重复内容
  if (to.params.locale === 'en') {
    const stripped = to.path.replace(/^\/en(?=\/|$)/, '') || '/'
    return { path: stripped, query: to.query, hash: to.hash, replace: true }
  }

  // URL 决定语言：路径前缀 > ?lang= > 默认 en
  const locale = isLocale(to.params.locale)
    ? to.params.locale
    : isLocale(to.query.lang)
      ? to.query.lang
      : DEFAULT_LOCALE
  if (i18n.global.locale.value !== locale) i18n.global.locale.value = locale
  localStorage.setItem('lang', locale)
  document.documentElement.lang = locale

  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (to.name === 'admin-login' && auth.isLoggedIn) {
    return { path: '/products/d15r' }
  }
  // 管理端页面（除登录页外）需要登录
  if (to.path.startsWith('/admin') && to.name !== 'admin-login' && !auth.isLoggedIn) {
    return { path: '/admin/login' }
  }
  return true
})

export default router
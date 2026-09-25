import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useAuthStore } from '../stores/auth'

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
    {
      path: '/',
      component: DefaultLayout,
      children: [
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
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// 按路由动态更新 title 与 canonical（SPA 的 SEO 基础）
const SITE_URL = 'https://www.droneworld.tech'
const routeTitles: Record<string, string> = {
  home: 'Partdro - Premium Drone Solutions | B2C & B2B',
  products: 'UAV Products | Partdro',
  cases: 'Case Studies | Partdro',
  news: 'News & Insights | Partdro',
  documents: 'Documents & Downloads | Partdro',
  about: 'About Us | Partdro',
  contact: 'Contact Us | Partdro',
}

router.afterEach((to) => {
  const title = routeTitles[to.name as string]
  if (title) document.title = title
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = `${SITE_URL}${to.path}`
})

router.beforeEach(async (to) => {
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

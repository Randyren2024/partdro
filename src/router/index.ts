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

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (to.name === 'admin-login' && auth.isLoggedIn) {
    return { path: '/products/d15r' }
  }
  return true
})

export default router

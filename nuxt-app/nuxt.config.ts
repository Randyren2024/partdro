// https://nuxt.com/docs/api/configuration/nuxt-config
// 对齐 shopify-vesper/web 的结构，但后端用 Supabase 而不是 Shopify。

// 动态 prerender：从 Supabase 拉产品/新闻 slug，生成所有语言版本路由
const PRESET_PRODUCTS = [
  'd15r', 'c500-delivery-drone', 'y160-delivery-drone',
  's200-agricultural-drone', 's300-agricultural-drone', 'x160-delivery-drone',
  'x160-lite-delivery-drone', 'd15r-pro', 'd15r-max',
]
const PRESET_NEWS = ['drone-cleaning-industry-trends-2026', 'c500-first-flight-tests']
const ALL_LOCALES = ['', '/de', '/es', '/fr']

async function fetchSlugs(url: string, key: string, table: string): Promise<string[]> {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=slug&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return []
    const rows: { slug: string | null }[] = await res.json()
    return rows.map((r) => r.slug || '').filter(Boolean)
  } catch {
    return []
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  modules: ['@nuxtjs/i18n', '@nuxtjs/color-mode', '@pinia/nuxt'],

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },

  css: [
    'ant-design-vue/dist/reset.css',
    '@fontsource-variable/inter',
    './assets/styles/variables.css',
    './assets/styles/global.css',
  ],

  /**
   * Supabase service_role key 只出现在服务端。所有 API 调用走 Nitro
   * server/api/ 路由（见 server/utils/supabase.ts），绝不把密钥序列化到客户端。
   */
  runtimeConfig: {
    // 服务端 only（不会进客户端 bundle）
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    // DirectMail（阿里云）
    directmailAccessKeyId: '',
    directmailAccessKeySecret: '',
    directmailAccount: '',
    directmailRegion: 'cn-hangzhou',
    inquiryNotifyTo: 'info@droneworld.tech',
    inquiryWebhookSecret: '',
    // 飞书
    feishuAppId: '',
    feishuAppSecret: '',
    feishuOpenId: '',
    // Lead analysis（保留原 FC 链路，迁完后可选改 Nuxt server route）
    inquiryAnalysisUrl: '',
    inquiryReplyUrl: '',
    // 百炼（AI 起草回复）
    dashscopeApiKey: '',

    public: {
      // 客户端可见
      siteUrl: 'https://www.droneworld.tech',
      supabaseAnonKey: '',
      gtmId: 'GTM-KJ7GJ3V5',
      // Ads 转化（客户端用）
      adsConversionId: '',
      adsConversionLabel: '',
      // 联系信息
      whatsapp: '',
      email: 'info@droneworld.tech',
      phone: '',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s | Partdro - Drone Cleaning & Delivery Solutions',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/droneworld_logo.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
      ],
    },
  },

  nitro: {
    compressPublicAssets: true,
    // Cloudflare Pages 部署时设 NITRO_PRESET=cloudflare_pages
    routeRules: {
      // 旧路径 redirect（保留历史 Google Ads finalUrl 和内部收藏链接）
      '/products/c500': { redirect: '/products/c500-delivery-drone', statusCode: 308 },
      '/admin/editor': { redirect: '/products/d15r', statusCode: 302 },
    },
    prerender: {
      // 注意：不要把 '/' 显式列进来——Nitro prerenderer 用 unstorage 存缓存，
      // 它不接受 '/' 作为 key（已知 bug）。用 '/index.html' 替代。
      // 动态路由（products/:slug, news/:slug, solutions/:solution）会在 pages/[slug].vue 里用
      // definePrerenderRoutes() 或 hooks 自动补，或靠 crawl 发现。
      routes: [
        '/index.html',
        // 默认语言 en（无前缀）
        '/products', '/cases', '/news', '/documents', '/about', '/contact',
        // de
        '/de', '/de/products', '/de/cases', '/de/news', '/de/documents', '/de/about', '/de/contact',
        // es
        '/es', '/es/products', '/es/cases', '/es/news', '/es/documents', '/es/about', '/es/contact',
        // fr
        '/fr', '/fr/products', '/fr/cases', '/fr/news', '/fr/documents', '/fr/about', '/fr/contact',
        // 3 个 solutions 预设路径（每种语言 × 3）
        '/solutions/facade-cleaning', '/solutions/solar-panel-cleaning', '/solutions/heavy-lift-logistics',
        '/de/solutions/facade-cleaning', '/de/solutions/solar-panel-cleaning', '/de/solutions/heavy-lift-logistics',
        '/es/solutions/facade-cleaning', '/es/solutions/solar-panel-cleaning', '/es/solutions/heavy-lift-logistics',
        '/fr/solutions/facade-cleaning', '/fr/solutions/solar-panel-cleaning', '/fr/solutions/heavy-lift-logistics',
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'de', iso: 'de-DE', file: 'de.json', name: 'Deutsch' },
      { code: 'es', iso: 'es-ES', file: 'es.json', name: 'Español' },
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', name: 'Français' },
    ],
    // @nuxtjs/i18n v9 has a path bug where it prepends an extra 'i18n/' layer
    // internally, e.g. with langDir: './' it resolves to ./i18n/en.json.
    // With langDir: './i18n/' it becomes ./i18n/i18n/en.json — which is where
    // the translation files actually live (nested i18n dir from the original migration).
    langDir: './i18n/',
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    lazy: false,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  // 动态 prerender：在 build:before hook 里 push 动态路由到 nitro.options.prerender.routes
  hooks: {
    async 'nitro:build:before'(nitro) {
      const url = process.env.NUXT_SUPABASE_URL
      const key = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
      let productSlugs = PRESET_PRODUCTS
      let newsSlugs = PRESET_NEWS

      if (url && key) {
        const ps = await fetchSlugs(url, key, 'products')
        const ns = await fetchSlugs(url, key, 'posts')
        if (ps.length) productSlugs = ps
        if (ns.length) newsSlugs = ns
      } else {
        console.warn('[prerender] Supabase env not set, using hardcoded slug lists')
      }

      const routes = nitro.options.prerender.routes as string[]
      if (Array.isArray(routes)) {
        for (const l of ALL_LOCALES) {
          for (const slug of productSlugs) routes.push(`${l}/products/${slug}`)
          for (const slug of newsSlugs) routes.push(`${l}/news/${slug}`)
        }
        console.log(`[prerender] products: ${productSlugs.length} × 4 locales = ${productSlugs.length * 4}`)
        console.log(`[prerender] news: ${newsSlugs.length} × 4 locales = ${newsSlugs.length * 4}`)
      }
    },
  },
})

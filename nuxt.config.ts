export default defineNuxtConfig({
  srcDir: 'app/',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    public: {
      supabaseUrl: '',
      supabasePublishableKey: '',
      siteUrl: 'https://www.droneworld.tech',
      gtmId: ''
    }
  },
  app: {
    head: {
      title: 'Drone World | Professional UAV Catalogue',
      titleTemplate: '%s | Drone World',
      meta: [
        { name: 'description', content: 'Explore professional UAVs, cargo drones, agricultural aircraft and industrial drone solutions from specialist manufacturers.' },
        { name: 'theme-color', content: '#102c2b' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', href: '/droneworld_favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },
  nitro: {
    preset: 'cloudflare_pages',
    cloudflare: { pages: { routes: { include: ['/api/*', '/sitemap.xml'], exclude: [] } } }
  },
  typescript: { strict: true, typeCheck: true }
})

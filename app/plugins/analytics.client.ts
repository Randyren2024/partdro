/**
 * Client-side analytics bootstrap for the Nuxt application.
 *
 * The previous Vite entrypoint had a GTM snippet in root index.html, but the
 * production Nuxt app does not use that HTML file. Load the configured GTM
 * container here and capture first/last campaign attribution before forms run.
 */
import { captureAttribution } from '../composables/useAttribution'

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  // Capture the initial landing page, referrer, UTM values and Google click ID.
  // Re-capture after client-side navigation in case a campaign URL is opened
  // without a full page reload.
  captureAttribution()
  const router = useRouter()
  router.afterEach(() => {
    captureAttribution()
  })

  const config = useRuntimeConfig()
  const containerId = String(config.public.gtmId || '').trim()
  if (!containerId) return

  const w = window as Window & { dataLayer?: Array<Record<string, unknown>> }
  w.dataLayer = w.dataLayer || []

  // Prevent duplicate GTM bootstraps during HMR or if another integration
  // already inserted the same container.
  if (document.getElementById('partdro-google-tag-manager')) return

  w.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  })

  const script = document.createElement('script')
  script.id = 'partdro-google-tag-manager'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`

  const firstScript = document.getElementsByTagName('script')[0]
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript)
  } else {
    document.head.appendChild(script)
  }
})

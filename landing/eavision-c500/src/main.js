import { createApp } from 'vue'
import App from './App.vue'
import './styles/base.css'
import './styles/c500.css'
import './styles/shell.css'
import { captureAttribution } from './lib/attribution'
import { contentFor, localeFromPath, setDocumentLocale } from './lib/i18n'

captureAttribution()

const locale = localeFromPath()
setDocumentLocale(locale, contentFor(locale))

createApp(App).mount('#app')

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.dataset.landingReady = 'true'
  })
})

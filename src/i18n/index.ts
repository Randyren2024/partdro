import { createI18n } from 'vue-i18n'
import en from './en.json'
import es from './es.json'
import de from './de.json'
import fr from './fr.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages: { en, es, de, fr },
})

export default i18n

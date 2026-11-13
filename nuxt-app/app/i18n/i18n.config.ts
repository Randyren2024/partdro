import en from './i18n/en.json'
import de from './i18n/de.json'
import es from './i18n/es.json'
import fr from './i18n/fr.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, de, es, fr },
}))

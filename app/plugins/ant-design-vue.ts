/**
 * Register Ant Design Vue globally for the Nuxt application.
 *
 * Nuxt does not auto-register third-party Vue component libraries. Without
 * this plugin, templates using <a-form>, <a-input>, <a-button>, <a-card>,
 * <a-row>, etc. are rendered as unresolved custom elements. In particular,
 * the Contact page's inquiry form appears missing or unusable.
 *
 * Keep the app-level ConfigProvider in app.vue; this plugin only registers
 * the component library so all existing pages share the same components.
 */
import Antd from 'ant-design-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Antd)
})

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { captureAttribution } from './composables/useAttribution'

import './assets/styles/variables.css'
import './assets/styles/global.css'

// 首次落地即记录来源（referrer / UTM / gclid），供询盘表单写入归因字段。
// 必须在 mount 之前执行：晚于路由跳转就会丢掉广告落地页的真实 query。
captureAttribution()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(Antd)

app.mount('#app')

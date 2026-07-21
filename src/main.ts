import { createApp } from 'vue'
import 'shared-design-system-vue-lib/tokens.css'
import 'shared-design-system-vue-lib/style.css'
import './ds-tokens.css'
import './style.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

import { createApp } from 'vue'
import App from './App.vue'
import { appConfig } from './config.js'

document.title = appConfig.name
createApp(App).mount('#app')

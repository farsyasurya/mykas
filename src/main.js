import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';
import './assets/main.css';

// Registrasi Service Worker untuk PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.info('[MyKas PWA] Service Worker aktif:', registration.scope);
      })
      .catch((err) => {
        console.warn('[MyKas PWA] Gagal registrasi Service Worker:', err);
      });
  });
}

const app = createApp(App);

// Register Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

import VueApexCharts from 'vue3-apexcharts';

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.use(VueApexCharts);

app.mount('#app');

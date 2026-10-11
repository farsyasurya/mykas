import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';
import './assets/main.css';

// Bersihkan Service Worker lama yang mungkin tertinggal di localhost:5173 dari proyek lain
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((unregistered) => {
        if (unregistered) {
          console.info('[MyKas] Berhasil menghapus Service Worker lama dari localhost:', registration.scope);
        }
      });
    }
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

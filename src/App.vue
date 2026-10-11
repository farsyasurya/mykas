<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
    <!-- Render application layout when logged in -->
    <template v-if="authStore.isAuthenticated">
      <AppNavbar class="flex-shrink-0" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <div class="flex-1 flex min-h-0 overflow-hidden relative">
        <!-- Backdrop for mobile drawer (when sidebar opened manually) -->
        <div
          v-if="sidebarOpen"
          @click="sidebarOpen = false"
          class="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
        ></div>

        <!-- Desktop Sidebar Navigation -->
        <AppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

        <!-- Main Content Area (pb-24 on mobile so bottom nav does not overlap) -->
        <main class="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex flex-col justify-between bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <div class="max-w-7xl mx-auto w-full">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
          <AppFooter class="mt-8 rounded-xl flex-shrink-0 hidden sm:block" />
        </main>
      </div>

      <!-- Mobile Bottom Navigation (Maksimal 4 menu di layar HP) -->
      <AppBottomNav />
    </template>

    <!-- Standalone View for Login / Register / Guest Pages -->
    <template v-else>
      <div class="min-h-screen overflow-y-auto flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <router-view />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from './stores/authStore.js';
import { useTheme } from './composables/useTheme.js';
import AppNavbar from './components/layout/AppNavbar.vue';
import AppSidebar from './components/layout/AppSidebar.vue';
import AppBottomNav from './components/layout/AppBottomNav.vue';
import AppFooter from './components/layout/AppFooter.vue';

const authStore = useAuthStore();
const theme = useTheme();
const sidebarOpen = ref(false);

onMounted(() => {
  theme.initTheme();
});
</script>

<style>
/* App wide smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease-in-out, transform 0.18s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

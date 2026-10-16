<template>
  <aside
    class="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0 h-full"
  >
    <!-- Scrollable Nav Links -->
    <div class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
      <!-- Section: Navigation for Admin / Super Admin -->
      <div v-if="authStore.isAdmin">
        <p class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Administrasi Kelas</p>
        <div class="space-y-1">
          <router-link
            to="/admin/dashboard"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/dashboard') }"
          >
            <el-icon :size="18"><Odometer /></el-icon>
            <span>Dashboard Kas</span>
          </router-link>

          <router-link
            to="/admin/meetings"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/meetings') }"
          >
            <el-icon :size="18"><Calendar /></el-icon>
            <span>Jadwal Pertemuan</span>
          </router-link>

          <router-link
            to="/admin/payments/create"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/payments/create') }"
          >
            <el-icon :size="18"><CirclePlus /></el-icon>
            <span>Input Bayar Kas</span>
          </router-link>

          <router-link
            to="/admin/payments"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/payments') && !isCurrentRoute('/admin/payments/create') && !isCurrentRoute('/admin/payments/status') }"
          >
            <el-icon :size="18"><Tickets /></el-icon>
            <span>Histori Kas</span>
          </router-link>

          <router-link
            to="/admin/payments/status"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/payments/status') }"
          >
            <el-icon :size="18"><UserFilled /></el-icon>
            <span>Status & Tunggakan</span>
          </router-link>
        </div>

        <p class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-6 mb-2">Kas & Keuangan</p>
        <div class="space-y-1">
          <router-link
            to="/admin/finances"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/finances') }"
          >
            <el-icon :size="18"><Coin /></el-icon>
            <span>Keuangan & Transaksi</span>
          </router-link>

          <router-link
            to="/admin/reports/meeting"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/reports/meeting') }"
          >
            <el-icon :size="18"><Calendar /></el-icon>
            <span>Laporan Per Pertemuan</span>
          </router-link>

          <router-link
            to="/admin/reports"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/admin/reports') }"
          >
            <el-icon :size="18"><Document /></el-icon>
            <span>Laporan Keuangan</span>
          </router-link>
        </div>

        <!-- Super Admin Section (Hanya untuk Super Admin) -->
        <div v-if="authStore.isSuperAdmin">
          <p class="px-3 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mt-6 mb-2">Super Admin</p>
          <div class="space-y-1">
            <router-link
              to="/admin/classes"
              @click="handleLinkClick"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-900 dark:text-purple-200"
              :class="{ '!bg-purple-700 !text-white shadow-sm': isCurrentRoute('/admin/classes') }"
            >
              <el-icon :size="18"><OfficeBuilding /></el-icon>
              <span>Kelola Kelas</span>
            </router-link>

            <router-link
              to="/admin/users"
              @click="handleLinkClick"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-900 dark:text-purple-200"
              :class="{ '!bg-purple-700 !text-white shadow-sm': isCurrentRoute('/admin/users') }"
            >
              <el-icon :size="18"><User /></el-icon>
              <span>Kelola Role & Pengguna</span>
            </router-link>

            <router-link
              to="/admin/audit-logs"
              @click="handleLinkClick"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-900 dark:text-purple-200"
              :class="{ '!bg-purple-700 !text-white shadow-sm': isCurrentRoute('/admin/audit-logs') }"
            >
              <el-icon :size="18"><Memo /></el-icon>
              <span>Audit Log Sistem</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Section: Student / User Navigation (Hanya untuk Mahasiswa / USER) -->
      <div v-if="authStore.isUser">
        <p class="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Portal Mahasiswa</p>
        <div class="space-y-1">
          <router-link
            to="/user/dashboard"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/user/dashboard') }"
          >
            <el-icon :size="18"><DataBoard /></el-icon>
            <span>Dashboard Pribadi</span>
          </router-link>

          <router-link
            to="/user/savings"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/user/savings') }"
          >
            <el-icon :size="18"><Coin /></el-icon>
            <span>Tabungan Saya</span>
          </router-link>

          <router-link
            to="/user/meetings"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/user/meetings') }"
          >
            <el-icon :size="18"><Calendar /></el-icon>
            <span>Jadwal Kas Kelas</span>
          </router-link>

          <router-link
            to="/user/reports"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/user/reports') }"
          >
            <el-icon :size="18"><Document /></el-icon>
            <span>Transparansi Kas Kelas</span>
          </router-link>

          <router-link
            to="/user/telegram"
            @click="handleLinkClick"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            :class="{ '!bg-emerald-600 !text-white hover:!bg-emerald-600 shadow-sm': isCurrentRoute('/user/telegram') }"
          >
            <el-icon :size="18"><Bell /></el-icon>
            <span>Notifikasi Telegram</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Bottom Footer Profile Snippet -->
    <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-medium text-slate-700 dark:text-slate-300">MyKas Online</span>
      </div>
      <span class="text-[10px] text-slate-400">v1.0.0</span>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';

const route = useRoute();
const authStore = useAuthStore();

function isCurrentRoute(path) {
  return route.path === path;
}
</script>

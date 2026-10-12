<template>
  <div>
    <!-- Mobile Bottom Navigation Bar (Maksimal 4 Menu di Layar HP) -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-16 flex items-center justify-around px-2">
      <!-- Admin Menus (3 Utama + 1 Lainnya) -->
      <template v-if="authStore.isAdmin">
        <!-- 1. Dashboard -->
        <router-link
          to="/admin/dashboard"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isCurrentRoute('/admin/dashboard') }"
        >
          <el-icon :size="20"><Odometer /></el-icon>
          <span class="text-[10px] mt-1">Dashboard</span>
        </router-link>

        <!-- 2. Bayar Kas -->
        <router-link
          to="/admin/payments/create"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isCurrentRoute('/admin/payments/create') }"
        >
          <el-icon :size="20"><CirclePlus /></el-icon>
          <span class="text-[10px] mt-1">Bayar Kas</span>
        </router-link>

        <!-- 3. Jadwal Pertemuan -->
        <router-link
          to="/admin/meetings"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isCurrentRoute('/admin/meetings') }"
        >
          <el-icon :size="20"><Calendar /></el-icon>
          <span class="text-[10px] mt-1">Pertemuan</span>
        </router-link>

        <!-- 4. Lainnya (Buka Sheet Menu Tambahan) -->
        <button
          @click="moreSheetVisible = true"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isOtherAdminActive }"
        >
          <el-icon :size="20"><MoreFilled /></el-icon>
          <span class="text-[10px] mt-1">Lainnya</span>
        </button>
      </template>

      <!-- Student Menus (3 Utama + 1 Lainnya) -->
      <template v-else-if="authStore.isUser">
        <!-- 1. Dashboard Pribadi -->
        <router-link
          to="/user/dashboard"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isCurrentRoute('/user/dashboard') }"
        >
          <el-icon :size="20"><DataBoard /></el-icon>
          <span class="text-[10px] mt-1">Dashboard</span>
        </router-link>

        <!-- 2. Jadwal Kas -->
        <router-link
          to="/user/meetings"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isCurrentRoute('/user/meetings') }"
        >
          <el-icon :size="20"><Calendar /></el-icon>
          <span class="text-[10px] mt-1">Jadwal</span>
        </router-link>

        <!-- 3. Tabungan Saya -->
        <router-link
          to="/user/savings"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isCurrentRoute('/user/savings') }"
        >
          <el-icon :size="20"><Coin /></el-icon>
          <span class="text-[10px] mt-1">Tabungan</span>
        </router-link>

        <!-- 4. Lainnya -->
        <button
          @click="moreSheetVisible = true"
          class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          :class="{ '!text-emerald-600 dark:!text-emerald-400 font-bold': isOtherStudentActive }"
        >
          <el-icon :size="20"><MoreFilled /></el-icon>
          <span class="text-[10px] mt-1">Lainnya</span>
        </button>
      </template>
    </nav>

    <!-- Bottom Sheet / Drawer Menu "Lainnya" untuk HP -->
    <el-drawer
      v-model="moreSheetVisible"
      direction="btt"
      size="auto"
      :show-close="false"
      class="!rounded-t-3xl dark:!bg-slate-900"
    >
      <template #header>
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <img src="/mykas.png" alt="MyKas Logo" class="w-5 h-5 rounded-md object-contain" />
            <h3 class="font-extrabold text-sm text-slate-900 dark:text-slate-100">Menu Lainnya</h3>
          </div>
          <button
            @click="moreSheetVisible = false"
            class="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
          >
            Tutup
          </button>
        </div>
      </template>

      <!-- Isi Menu Tambahan (Grid Cards Touch-Friendly) -->
      <div class="py-2 space-y-4">
        <!-- Admin Additional Options -->
        <template v-if="authStore.isAdmin">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Kas & Transaksi
            </p>
            <div class="grid grid-cols-2 gap-2">
              <router-link
                to="/admin/payments"
                @click="moreSheetVisible = false"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
              >
                <el-icon :size="18" class="text-emerald-600 dark:text-emerald-400"><Tickets /></el-icon>
                <span>Histori Kas</span>
              </router-link>

              <router-link
                to="/admin/payments/status"
                @click="moreSheetVisible = false"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
              >
                <el-icon :size="18" class="text-emerald-600 dark:text-emerald-400"><UserFilled /></el-icon>
                <span>Tunggakan</span>
              </router-link>

              <router-link
                to="/admin/finances"
                @click="moreSheetVisible = false"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
              >
                <el-icon :size="18" class="text-emerald-600 dark:text-emerald-400"><Coin /></el-icon>
                <span>Keuangan & Transaksi</span>
              </router-link>

              <router-link
                to="/admin/reports/meeting"
                @click="moreSheetVisible = false"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
              >
                <el-icon :size="18" class="text-emerald-600 dark:text-emerald-400"><Calendar /></el-icon>
                <span>Laporan Pertemuan</span>
              </router-link>

              <router-link
                to="/admin/reports"
                @click="moreSheetVisible = false"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
              >
                <el-icon :size="18" class="text-emerald-600 dark:text-emerald-400"><Document /></el-icon>
                <span>Laporan & PDF</span>
              </router-link>
            </div>
          </div>

          <!-- Super Admin Additional -->
          <div v-if="authStore.isSuperAdmin">
            <p class="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
              Super Admin Menu
            </p>
            <div class="grid grid-cols-2 gap-2">
              <router-link
                to="/admin/classes"
                @click="moreSheetVisible = false"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 text-xs font-semibold hover:border-purple-500 transition-colors"
              >
                <el-icon :size="18"><OfficeBuilding /></el-icon>
                <span>Kelola Kelas</span>
              </router-link>

              <router-link
                to="/admin/users"
                @click="moreSheetVisible = false"
                class="flex items-center gap-2.5 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 text-xs font-semibold hover:border-purple-500 transition-colors"
              >
                <el-icon :size="18"><User /></el-icon>
                <span>Pengguna & Role</span>
              </router-link>

              <router-link
                to="/admin/audit-logs"
                @click="moreSheetVisible = false"
                class="col-span-2 flex items-center gap-2.5 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 text-xs font-semibold hover:border-purple-500 transition-colors"
              >
                <el-icon :size="18"><Memo /></el-icon>
                <span>Audit Log Sistem</span>
              </router-link>
            </div>
          </div>
        </template>

        <!-- Student Additional Options -->
        <template v-else-if="authStore.isUser">
          <div class="grid grid-cols-2 gap-2">
            <router-link
              to="/user/reports"
              @click="moreSheetVisible = false"
              class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
            >
              <el-icon :size="18" class="text-emerald-600 dark:text-emerald-400"><Document /></el-icon>
              <span>Transparansi Kas</span>
            </router-link>

            <router-link
              to="/user/telegram"
              @click="moreSheetVisible = false"
              class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
            >
              <el-icon :size="18" class="text-blue-500"><Bell /></el-icon>
              <span>Telegram Bot</span>
            </router-link>

            <router-link
              to="/user/profile"
              @click="moreSheetVisible = false"
              class="col-span-2 flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition-colors"
            >
              <el-icon :size="18" class="text-emerald-600 dark:text-emerald-400"><User /></el-icon>
              <span>Profil Saya</span>
            </router-link>
          </div>
        </template>

        <!-- Quick Theme & Logout Bar at the bottom of sheet -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            @click="toggleTheme"
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <el-icon :size="16">
              <Sunny v-if="!isDark" class="text-amber-500" />
              <Moon v-else class="text-indigo-400" />
            </el-icon>
            <span>{{ isDark ? 'Mode Malam' : 'Mode Siang' }}</span>
          </button>

          <button
            @click="handleLogout"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <el-icon :size="16"><SwitchButton /></el-icon>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { useTheme } from '../../composables/useTheme.js';
import { ElMessage } from 'element-plus';
import {
  Odometer,
  CirclePlus,
  Calendar,
  MoreFilled,
  DataBoard,
  Coin,
  Tickets,
  UserFilled,
  Document,
  OfficeBuilding,
  User,
  Memo,
  Bell,
  Moon,
  Sunny,
  SwitchButton
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();

const moreSheetVisible = ref(false);

function isCurrentRoute(path) {
  return route.path === path;
}

const isOtherAdminActive = computed(() => {
  const otherAdminPaths = [
    '/admin/payments',
    '/admin/payments/status',
    '/admin/finances',
    '/admin/reports',
    '/admin/classes',
    '/admin/users',
    '/admin/audit-logs'
  ];
  return otherAdminPaths.some(p => route.path.startsWith(p));
});

const isOtherStudentActive = computed(() => {
  const otherStudentPaths = ['/user/reports', '/user/telegram', '/user/profile'];
  return otherStudentPaths.some(p => route.path.startsWith(p));
});

async function handleLogout() {
  moreSheetVisible.value = false;
  try {
    await authStore.logout();
    ElMessage.success('Berhasil keluar');
    router.push('/login');
  } catch (e) {
    ElMessage.error('Gagal keluar');
  }
}
</script>

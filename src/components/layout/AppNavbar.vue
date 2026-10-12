<template>
  <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-200">
    <div class="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
      <!-- Left side: Brand Logo -->
      <div class="flex items-center gap-2.5">
        <img src="/mykas.png" alt="MyKas Logo" class="w-9 h-9 rounded-xl object-contain drop-shadow-sm" />
        <div>
          <span class="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-50">My<span class="text-emerald-600 dark:text-emerald-400">Kas</span></span>
          <span v-if="authStore.userProfile?.kelasNama" class="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            {{ authStore.userProfile.kelasNama }}
          </span>
        </div>
      </div>

      <!-- Right side: Theme switch, Role badge, user profile menu -->
      <div class="flex items-center gap-2.5">
        <!-- Dark / Light Mode Toggle Pill (Unambiguous indicator) -->
        <button
          @click="toggleTheme"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs font-semibold"
          :title="isDark ? 'Mode Malam aktif. Klik untuk ganti ke Mode Siang' : 'Mode Siang aktif. Klik untuk ganti ke Mode Malam'"
        >
          <el-icon :size="16">
            <Sunny v-if="!isDark" class="text-amber-500" />
            <Moon v-else class="text-indigo-400" />
          </el-icon>
          <span class="text-[11px] font-semibold">
            {{ isDark ? 'Malam' : 'Siang' }}
          </span>
        </button>

        <!-- Role Badge -->
        <span
          class="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
          :class="{
            'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800': authStore.isSuperAdmin,
            'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800': authStore.isClassAdminOnly,
            'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800': authStore.isUser
          }"
        >
          <el-icon class="mr-1" :size="12">
            <UserFilled v-if="authStore.isSuperAdmin" />
            <Management v-else-if="authStore.isClassAdminOnly" />
            <User v-else />
          </el-icon>
          {{ authStore.userProfile?.role || 'GUEST' }}
        </span>

        <!-- User Dropdown Menu -->
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <el-avatar
              :size="34"
              class="bg-emerald-600 text-white font-semibold"
            >
              {{ userInitial }}
            </el-avatar>
            <div class="hidden md:flex flex-col text-left">
              <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {{ authStore.userProfile?.namaPanggilan || authStore.userProfile?.namaLengkap || 'Pengguna' }}
              </span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {{ authStore.userProfile?.nim || authStore.user?.email || '' }}
              </span>
            </div>
            <el-icon class="text-slate-400 ml-1"><ArrowDown /></el-icon>
          </div>

          <template #dropdown>
            <el-dropdown-menu class="min-w-[190px]">
              <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p class="text-xs font-medium text-slate-400">Login sebagai</p>
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ authStore.userProfile?.namaLengkap }}</p>
                <p class="text-xs text-slate-400 truncate">{{ authStore.user?.email }}</p>
              </div>

              <el-dropdown-item v-if="authStore.isUser" command="profile">
                <el-icon><User /></el-icon> Profil Saya
              </el-dropdown-item>
              <el-dropdown-item v-if="authStore.isUser" command="telegram">
                <el-icon><Bell /></el-icon> Pengaturan Telegram
              </el-dropdown-item>
              <el-dropdown-item divided command="logout" class="text-rose-600 hover:text-rose-700">
                <el-icon><SwitchButton /></el-icon> Keluar
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { useTheme } from '../../composables/useTheme.js';
import { ElMessage } from 'element-plus';
import { Sunny, Moon } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const router = useRouter();
const { isDark, toggleTheme } = useTheme();

const userInitial = computed(() => {
  const name = authStore.userProfile?.namaPanggilan || authStore.userProfile?.namaLengkap || 'U';
  return name.charAt(0).toUpperCase();
});

async function handleCommand(command) {
  if (command === 'profile') {
    router.push('/user/profile');
  } else if (command === 'telegram') {
    router.push('/user/telegram');
  } else if (command === 'logout') {
    try {
      await authStore.logout();
      ElMessage.success('Berhasil keluar');
      router.push('/login');
    } catch (e) {
      ElMessage.error('Gagal keluar');
    }
  }
}
</script>

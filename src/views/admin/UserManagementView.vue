<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Manajemen Pengguna & Role</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Daftar seluruh mahasiswa dan staf pengelola terdaftar di sistem MyKas.</p>
      </div>

      <div class="flex items-center gap-3">
        <el-input
          v-model="searchQuery"
          placeholder="Cari Nama / NIM..."
          clearable
          class="!w-64"
          :prefix-icon="Search"
        />
      </div>
    </div>

    <!-- Table & Mobile Cards of Users -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table -->
      <div class="hidden md:block">
        <el-table :data="filteredUsers" v-loading="loading" style="width: 100%">
          <el-table-column label="Nama Lengkap" min-width="160">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaLengkap }}</div>
              <div class="text-xs text-slate-400">{{ row.email }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="nim" label="NIM" width="140">
            <template #default="{ row }">
              <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{{ row.nim || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="kelasNama" label="Kelas" min-width="140">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.kelasNama || 'Belum ada kelas' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="tabungan" label="Saldo Tabungan" width="130" align="right">
            <template #default="{ row }">
              <span class="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(row.tabungan || 0) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Telegram" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.telegramConnected ? 'success' : 'info'" size="small">
                {{ row.telegramConnected ? 'Terhubung' : 'Belum' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Role Akun" width="140" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.role === 'SUPER_ADMIN' ? 'danger' : (row.role === 'ADMIN' ? 'warning' : 'primary')"
                effect="light"
                size="small"
                class="!font-bold"
              >
                {{ row.role }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Ubah Role" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-select
                :model-value="row.role"
                size="small"
                @change="(val) => handleRoleChange(row, val)"
                :disabled="row.id === authStore.user?.uid"
              >
                <el-option label="USER" value="USER" />
                <el-option label="ADMIN" value="ADMIN" />
                <el-option label="SUPER_ADMIN" value="SUPER_ADMIN" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards -->
      <div class="block md:hidden space-y-3">
        <div
          v-for="item in filteredUsers"
          :key="item.id"
          class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{{ item.namaLengkap }}</h4>
              <p class="text-xs text-slate-400 font-mono mt-0.5">NIM: {{ item.nim || '-' }}</p>
            </div>
            <el-tag
              :type="item.role === 'SUPER_ADMIN' ? 'danger' : (item.role === 'ADMIN' ? 'warning' : 'primary')"
              effect="light"
              size="small"
              class="!font-bold shrink-0"
            >
              {{ item.role }}
            </el-tag>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/50 dark:border-slate-700/50">
            <div>
              <span class="text-slate-400 text-[11px] block">Kelas</span>
              <span class="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                {{ item.kelasNama || 'Belum ada' }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 text-[11px] block">Saldo Tabungan</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {{ formatRupiah(item.tabungan || 0) }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1 gap-2">
            <div class="flex-1">
              <el-select
                :model-value="item.role"
                size="small"
                class="!w-full"
                @change="(val) => handleRoleChange(item, val)"
                :disabled="item.id === authStore.user?.uid"
              >
                <el-option label="USER" value="USER" />
                <el-option label="ADMIN" value="ADMIN" />
                <el-option label="SUPER_ADMIN" value="SUPER_ADMIN" />
              </el-select>
            </div>
            <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold shrink-0" @click="openUserDetail(item)">
              Detail
            </el-button>
          </div>
        </div>

        <div v-if="!filteredUsers.length && !loading" class="text-center py-8 text-xs text-slate-400">
          Tidak ada pengguna ditemukan
        </div>
      </div>
    </div>

    <!-- Mobile Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Pengguna"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedUser" class="space-y-4">
        <div class="flex items-start justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div>
            <h4 class="font-extrabold text-slate-900 dark:text-slate-100 text-base">{{ selectedUser.namaLengkap }}</h4>
            <p class="text-xs text-slate-400 mt-0.5">{{ selectedUser.email }}</p>
          </div>
          <el-tag
            :type="selectedUser.role === 'SUPER_ADMIN' ? 'danger' : (selectedUser.role === 'ADMIN' ? 'warning' : 'primary')"
            size="small"
            class="!font-bold shrink-0"
          >
            {{ selectedUser.role }}
          </el-tag>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">NIM</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ selectedUser.nim || '-' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Kelas</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ selectedUser.kelasNama || 'Belum terdaftar di kelas' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Saldo Tabungan</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(selectedUser.tabungan || 0) }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Notifikasi Telegram</span>
            <el-tag :type="selectedUser.telegramConnected ? 'success' : 'info'" size="small">
              {{ selectedUser.telegramConnected ? 'Terhubung' : 'Belum Terhubung' }}
            </el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false" class="!w-full !rounded-xl !font-semibold">Tutup</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { userService } from '../../services/userService.js';
import { formatRupiah } from '../../utils/currency.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const usersList = ref([]);
const searchQuery = ref('');

const detailDialogVisible = ref(false);
const selectedUser = ref(null);

function openUserDetail(item) {
  selectedUser.value = item;
  detailDialogVisible.value = true;
}

onMounted(async () => {
  await loadUsers();
});

async function loadUsers() {
  loading.value = true;
  try {
    usersList.value = await userService.getAllUsers();
  } catch (err) {
    ElMessage.error('Gagal memuat pengguna: ' + err.message);
  } finally {
    loading.value = false;
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return usersList.value;
  const q = searchQuery.value.toLowerCase();
  return usersList.value.filter(u =>
    (u.namaLengkap || '').toLowerCase().includes(q) ||
    (u.nim || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  );
});

async function handleRoleChange(user, newRole) {
  try {
    await ElMessageBox.confirm(
      `Apakah Anda yakin ingin mengubah role "${user.namaLengkap}" menjadi "${newRole}"?`,
      'Konfirmasi Perubahan Role',
      { confirmButtonText: 'Ubah Role', cancelButtonText: 'Batal', type: 'warning' }
    );

    await userService.updateUserRole(user.id, newRole);
    user.role = newRole;
    ElMessage.success(`Role ${user.namaLengkap} berhasil diubah menjadi ${newRole}`);
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal mengubah role');
    }
  }
}
</script>

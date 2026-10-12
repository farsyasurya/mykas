<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Manajemen Pengguna & Role</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola hak akses role, status keaktifan mahasiswa/staf, dan atur ulang kata sandi.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <el-select v-model="statusFilter" placeholder="Filter Status" class="!w-36" clearable>
          <el-option label="Semua Status" value="" />
          <el-option label="Aktif" value="ACTIVE" />
          <el-option label="Tidak Aktif" value="INACTIVE" />
        </el-select>

        <el-select v-model="roleFilter" placeholder="Filter Role" class="!w-36" clearable>
          <el-option label="Semua Role" value="" />
          <el-option label="USER" value="USER" />
          <el-option label="ADMIN" value="ADMIN" />
          <el-option label="SUPER_ADMIN" value="SUPER_ADMIN" />
        </el-select>

        <el-input
          v-model="searchQuery"
          placeholder="Cari Nama / NIM..."
          clearable
          class="!w-56"
          :prefix-icon="Search"
        />
      </div>
    </div>

    <!-- Table & Mobile Cards of Users -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table -->
      <div class="hidden lg:block">
        <el-table :data="filteredUsers" v-loading="loading" style="width: 100%">
          <el-table-column label="Nama Lengkap" min-width="160">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaLengkap }}</div>
              <div class="text-xs text-slate-400">{{ row.email }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="nim" label="NIM" width="120">
            <template #default="{ row }">
              <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{{ row.nim || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="kelasNama" label="Kelas" min-width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.kelasNama || 'Belum ada kelas' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="tabungan" label="Saldo Tabungan" width="130" align="right">
            <template #default="{ row }">
              <span class="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(row.tabungan || 0) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Status Akun" width="115" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.isActive !== false ? 'success' : 'danger'"
                effect="light"
                size="small"
                class="!font-bold"
              >
                {{ row.isActive !== false ? 'Aktif' : 'Tidak Aktif' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Role Akun" width="120" align="center">
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

          <el-table-column label="Ubah Status" width="130" align="center">
            <template #default="{ row }">
              <el-select
                :model-value="row.isActive !== false"
                size="small"
                @change="(val) => handleStatusChange(row, val)"
                :disabled="row.id === authStore.user?.uid"
                class="!w-28"
              >
                <el-option label="Aktif" :value="true" />
                <el-option label="Tidak Aktif" :value="false" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="Ubah Role" width="140" align="center">
            <template #default="{ row }">
              <el-select
                :model-value="row.role"
                size="small"
                @change="(val) => handleRoleChange(row, val)"
                :disabled="row.id === authStore.user?.uid"
                class="!w-28"
              >
                <el-option label="USER" value="USER" />
                <el-option label="ADMIN" value="ADMIN" />
                <el-option label="SUPER_ADMIN" value="SUPER_ADMIN" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="Sandi" width="110" align="center" fixed="right">
            <template #default="{ row }">
              <el-tooltip content="Kirim email atur ulang kata sandi" placement="top">
                <el-button
                  size="small"
                  type="warning"
                  plain
                  class="!rounded-lg !px-2.5 !text-xs font-semibold"
                  @click="handleResetPassword(row)"
                  :loading="resettingId === row.id"
                >
                  <el-icon class="mr-1"><Key /></el-icon>
                  Reset
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile & Tablet Cards (< lg) -->
      <div class="block lg:hidden space-y-3">
        <div
          v-for="item in filteredUsers"
          :key="item.id"
          class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{{ item.namaLengkap }}</h4>
              <p class="text-xs text-slate-400 font-mono mt-0.5">NIM: {{ item.nim || '-' }} • {{ item.email }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <el-tag
                :type="item.isActive !== false ? 'success' : 'danger'"
                effect="light"
                size="small"
                class="!font-bold !text-[11px]"
              >
                {{ item.isActive !== false ? 'Aktif' : 'Nonaktif' }}
              </el-tag>
              <el-tag
                :type="item.role === 'SUPER_ADMIN' ? 'danger' : (item.role === 'ADMIN' ? 'warning' : 'primary')"
                effect="light"
                size="small"
                class="!font-bold !text-[11px]"
              >
                {{ item.role }}
              </el-tag>
            </div>
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

          <!-- Controls in mobile -->
          <div class="space-y-2 pt-1">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-[10px] text-slate-400 block mb-1">Status Pengguna</span>
                <el-select
                  :model-value="item.isActive !== false"
                  size="small"
                  class="!w-full"
                  @change="(val) => handleStatusChange(item, val)"
                  :disabled="item.id === authStore.user?.uid"
                >
                  <el-option label="Aktif" :value="true" />
                  <el-option label="Tidak Aktif" :value="false" />
                </el-select>
              </div>

              <div>
                <span class="text-[10px] text-slate-400 block mb-1">Role Akun</span>
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
            </div>

            <div class="flex items-center gap-2 pt-1">
              <el-button
                size="small"
                type="warning"
                plain
                class="flex-1 !rounded-xl !text-xs !font-semibold"
                @click="handleResetPassword(item)"
                :loading="resettingId === item.id"
              >
                <el-icon class="mr-1"><Key /></el-icon>
                Reset Sandi
              </el-button>
              <el-button
                size="small"
                plain
                class="!rounded-xl !text-xs !font-semibold"
                @click="openUserDetail(item)"
              >
                Detail
              </el-button>
            </div>
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
          <div class="flex flex-col items-end gap-1 shrink-0">
            <el-tag
              :type="selectedUser.isActive !== false ? 'success' : 'danger'"
              size="small"
              class="!font-bold"
            >
              {{ selectedUser.isActive !== false ? 'Aktif' : 'Tidak Aktif' }}
            </el-tag>
            <el-tag
              :type="selectedUser.role === 'SUPER_ADMIN' ? 'danger' : (selectedUser.role === 'ADMIN' ? 'warning' : 'primary')"
              size="small"
              class="!font-bold"
            >
              {{ selectedUser.role }}
            </el-tag>
          </div>
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
            <span class="text-slate-400">Kewajiban Kas</span>
            <span class="font-semibold" :class="selectedUser.isActive !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
              {{ selectedUser.isActive !== false ? 'Wajib membayar jika belum lunas' : 'Bebas kewajiban bayar kas (Nonaktif)' }}
            </span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Akses Login</span>
            <span class="font-semibold" :class="selectedUser.isActive !== false ? 'text-emerald-600' : 'text-rose-600'">
              {{ selectedUser.isActive !== false ? 'Diizinkan masuk' : 'Diblokir / Tidak bisa login' }}
            </span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Notifikasi Telegram</span>
            <el-tag :type="selectedUser.telegramConnected ? 'success' : 'info'" size="small">
              {{ selectedUser.telegramConnected ? 'Terhubung' : 'Belum Terhubung' }}
            </el-tag>
          </div>
        </div>

        <div class="pt-2">
          <el-button
            type="warning"
            plain
            class="!w-full !rounded-xl !font-semibold !text-xs"
            @click="handleResetPassword(selectedUser)"
            :loading="resettingId === selectedUser.id"
          >
            <el-icon class="mr-1.5"><Key /></el-icon>
            Kirim Tautan Atur Ulang Kata Sandi ke Email
          </el-button>
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
import { authService } from '../../services/authService.js';
import { formatRupiah } from '../../utils/currency.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Key } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const resettingId = ref(null);
const usersList = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const roleFilter = ref('');

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
  let list = usersList.value;

  // Status Filter
  if (statusFilter.value === 'ACTIVE') {
    list = list.filter(u => u.isActive !== false);
  } else if (statusFilter.value === 'INACTIVE') {
    list = list.filter(u => u.isActive === false);
  }

  // Role Filter
  if (roleFilter.value) {
    list = list.filter(u => u.role === roleFilter.value);
  }

  // Search Query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(u =>
      (u.namaLengkap || '').toLowerCase().includes(q) ||
      (u.nim || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }

  return list;
});

async function handleStatusChange(user, newStatus) {
  const isActivating = Boolean(newStatus);
  try {
    const confirmMessage = isActivating
      ? `Aktifkan kembali akun "${user.namaLengkap}"?\n\nPengguna akan dapat masuk kembali ke aplikasi MyKas dan kewajiban bayar kas berjalan akan aktif jika belum lunas.`
      : `Apakah Anda yakin ingin menonaktifkan akun "${user.namaLengkap}"?\n\nPengguna tidak akan bisa login ke akunnya, dan tidak lagi diwajibkan membayar kas kelas.`;

    await ElMessageBox.confirm(
      confirmMessage,
      isActivating ? 'Konfirmasi Aktivasi Akun' : 'Konfirmasi Nonaktifkan Akun',
      {
        confirmButtonText: isActivating ? 'Aktifkan Akun' : 'Nonaktifkan Akun',
        cancelButtonText: 'Batal',
        type: isActivating ? 'info' : 'warning'
      }
    );

    await userService.updateUserStatus(user.id, isActivating);
    user.isActive = isActivating;
    ElMessage.success(`Status akun ${user.namaLengkap} berhasil diubah menjadi ${isActivating ? 'Aktif' : 'Tidak Aktif'}`);
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal mengubah status akun');
    }
  }
}

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

async function handleResetPassword(user) {
  if (!user.email) {
    ElMessage.warning('Pengguna tidak memiliki email terdaftar');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `Kirimkan tautan atur ulang (reset) kata sandi ke email "${user.email}" (${user.namaLengkap})?`,
      'Reset Kata Sandi Pengguna',
      { confirmButtonText: 'Kirim Tautan', cancelButtonText: 'Batal', type: 'info' }
    );

    resettingId.value = user.id;
    await authService.resetPassword(user.email);
    ElMessage.success(`Tautan reset kata sandi berhasil dikirim ke ${user.email}`);
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal mengirim email reset kata sandi');
    }
  } finally {
    resettingId.value = null;
  }
}
</script>

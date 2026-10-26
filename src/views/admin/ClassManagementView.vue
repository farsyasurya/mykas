<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Manajemen Kelas</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola kelas perkuliahan dan tentukan admin kas untuk masing-masing kelas.</p>
      </div>

      <el-button
        type="primary"
        class="!rounded-xl !bg-purple-600 hover:!bg-purple-700 !border-none !font-semibold"
        @click="openCreateDialog"
      >
        <el-icon class="mr-1"><Plus /></el-icon> Tambah Kelas Baru
      </el-button>
    </div>

    <!-- Table of Classes -->
    <!-- Table & Mobile Cards of Classes -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table -->
      <div class="hidden md:block">
        <el-table :data="classesList" v-loading="loading" style="width: 100%">
          <el-table-column prop="namaKelas" label="Nama Kelas" min-width="160">
            <template #default="{ row }">
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaKelas }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="semesterAktif" label="Semester" width="160">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.semesterAktif || 'Ganjil 2026/2027' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="tarifKas" label="Tarif Kas" width="130" align="right">
            <template #default="{ row }">
              <span class="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(row.tarifKas || 7000) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="saldo" label="Saldo Kas" width="140" align="right">
            <template #default="{ row }">
              <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(row.saldo || 0) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Admin Kelas Aktif" min-width="180">
            <template #default="{ row }">
              <div v-if="getAdminName(row.adminUid)" class="flex items-center gap-2">
                <el-avatar :size="24" class="!bg-purple-600 text-white !text-xs">A</el-avatar>
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ getAdminName(row.adminUid) }}</span>
              </div>
              <span v-else class="text-xs text-amber-600 italic">Belum ditentukan</span>
            </template>
          </el-table-column>

          <el-table-column label="Aksi" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" plain @click="openAssignAdminDialog(row)">
                Tetapkan Admin
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards -->
      <div class="block md:hidden space-y-3">
        <div
          v-for="item in classesList"
          :key="item.id"
          class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm">{{ item.namaKelas }}</h4>
              <el-tag type="info" size="small" class="mt-1">
                {{ item.semesterAktif || 'Ganjil 2026/2027' }}
              </el-tag>
            </div>
            <div class="text-right">
              <span class="text-[11px] text-slate-400 block">Saldo Kas</span>
              <span class="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                {{ formatRupiah(item.saldo || 0) }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between py-1.5 border-y border-slate-200/50 dark:border-slate-700/50 text-xs">
            <span class="text-slate-500">Tarif per Pertemuan:</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {{ formatRupiah(item.tarifKas || 7000) }}
            </span>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="text-xs text-slate-500">
              Admin: <span class="font-semibold text-slate-700 dark:text-slate-300">{{ getAdminName(item.adminUid) || 'Belum ada' }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold" @click="openClassDetail(item)">
                Detail
              </el-button>
              <el-button size="small" type="primary" plain class="!rounded-lg !text-xs !font-semibold" @click="openAssignAdminDialog(item)">
                Admin
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="!classesList.length && !loading" class="text-center py-8 text-xs text-slate-400">
          Belum ada kelas terdaftar
        </div>
      </div>
    </div>

    <!-- Mobile Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Informasi Kelas"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedClass" class="space-y-4">
        <div class="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60">
          <h4 class="text-lg font-black text-purple-900 dark:text-purple-100">{{ selectedClass.namaKelas }}</h4>
          <span class="text-xs text-purple-600 dark:text-purple-400 font-semibold">{{ selectedClass.semesterAktif || 'Ganjil 2026/2027' }}</span>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Tarif Kas Rutin</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(selectedClass.tarifKas || 7000) }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Saldo Kas Sekarang</span>
            <span class="font-black text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(selectedClass.saldo || 0) }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Admin Pengelola</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ getAdminName(selectedClass.adminUid) || 'Belum ditentukan' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center gap-2">
          <el-button
            type="primary"
            plain
            class="!rounded-xl !text-xs !font-semibold"
            @click="detailDialogVisible = false; openAssignAdminDialog(selectedClass)"
          >
            Tetapkan Admin
          </el-button>
          <el-button @click="detailDialogVisible = false" class="!flex-1 !rounded-xl !font-semibold">Tutup</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog Create Class -->
    <el-dialog
      v-model="createDialogVisible"
      title="Buat Kelas Baru"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <el-form :model="createForm" label-position="top">
        <el-form-item label="Nama Kelas" required>
          <el-input v-model="createForm.namaKelas" placeholder="Contoh: Teknik Informatika A 2026" />
        </el-form-item>

        <el-form-item label="Semester Aktif" required>
          <el-input v-model="createForm.semesterAktif" placeholder="Contoh: Ganjil 2026/2027" />
        </el-form-item>

        <el-form-item label="Tarif Kas per Pertemuan (Rp)" required>
          <el-input-number
            v-model="createForm.tarifKas"
            :min="1000"
            :step="1000"
            :formatter="rupiahInputFormatter"
            :parser="rupiahInputParser"
            class="!w-full"
          />
          <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Nominal terbaca: <strong class="text-purple-600 dark:text-purple-400 font-mono">{{ formatRupiah(createForm.tarifKas || 0) }}</strong> / pertemuan
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="handleCreateClass" class="!bg-purple-600 !border-none">
            Simpan Kelas
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Dialog Assign Admin -->
    <el-dialog
      v-model="assignDialogVisible"
      title="Tetapkan Admin Kelas"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <p class="text-xs text-slate-500 mb-4">
        Pilih mahasiswa yang akan menjadi Admin Kas untuk kelas <strong>{{ activeClass?.namaKelas }}</strong>. Mahasiswa terpilih akan diberikan hak kelola pertemuan, pencatatan kas, dan laporan.
      </p>

      <el-form label-position="top">
        <el-form-item label="Pilih Mahasiswa">
          <el-select
            v-model="selectedAdminUid"
            placeholder="Pencarian Mahasiswa"
            filterable
            class="w-full"
          >
            <el-option
              v-for="u in usersList"
              :key="u.id"
              :label="`${u.namaLengkap} (${u.nim || 'Tanpa NIM'}) - ${u.kelasNama || 'Belum ada kelas'}`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="handleAssignAdmin" class="!bg-purple-600 !border-none">
            Tetapkan Sebagai Admin
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { classService } from '../../services/classService.js';
import { userService } from '../../services/userService.js';
import { formatRupiah, rupiahInputFormatter, rupiahInputParser } from '../../utils/currency.js';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const loading = ref(false);
const saving = ref(false);
const classesList = ref([]);
const usersList = ref([]);

const detailDialogVisible = ref(false);
const selectedClass = ref(null);

function openClassDetail(item) {
  selectedClass.value = item;
  detailDialogVisible.value = true;
}

const createDialogVisible = ref(false);
const assignDialogVisible = ref(false);
const activeClass = ref(null);
const selectedAdminUid = ref('');

const createForm = reactive({
  namaKelas: '',
  semesterAktif: 'Ganjil 2026/2027',
  tarifKas: 7000
});

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const [classes, users] = await Promise.all([
      classService.getAllClasses(),
      userService.getAllUsers()
    ]);
    classesList.value = classes;
    usersList.value = users;
  } catch (err) {
    ElMessage.error('Gagal memuat data kelas: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function getAdminName(adminUid) {
  if (!adminUid) return null;
  const user = usersList.value.find(u => u.id === adminUid || u.uid === adminUid);
  return user ? user.namaLengkap : adminUid;
}

function openCreateDialog() {
  createForm.namaKelas = '';
  createForm.semesterAktif = 'Ganjil 2026/2027';
  createForm.tarifKas = 7000;
  createDialogVisible.value = true;
}

async function handleCreateClass() {
  if (!createForm.namaKelas.trim()) {
    ElMessage.warning('Nama kelas tidak boleh kosong');
    return;
  }
  saving.value = true;
  try {
    await classService.createClass({
      namaKelas: createForm.namaKelas,
      semesterAktif: createForm.semesterAktif,
      tarifKas: createForm.tarifKas
    });
    ElMessage.success('Kelas berhasil dibuat!');
    createDialogVisible.value = false;
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal membuat kelas');
  } finally {
    saving.value = false;
  }
}

function openAssignAdminDialog(cls) {
  activeClass.value = cls;
  selectedAdminUid.value = cls.adminUid || '';
  assignDialogVisible.value = true;
}

async function handleAssignAdmin() {
  if (!activeClass.value || !selectedAdminUid.value) {
    ElMessage.warning('Pilih mahasiswa terlebih dahulu');
    return;
  }
  saving.value = true;
  try {
    await classService.assignAdmin(activeClass.value.id, selectedAdminUid.value);
    ElMessage.success('Admin kelas berhasil ditetapkan!');
    assignDialogVisible.value = false;
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal menetapkan admin');
  } finally {
    saving.value = false;
  }
}
</script>

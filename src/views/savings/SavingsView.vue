<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Kelola Tabungan Mahasiswa</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Saldo tabungan berasal dari kelebihan setoran kas dan merupakan kewajiban kelas kepada mahasiswa.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <el-input
          v-model="searchQuery"
          placeholder="Cari Mahasiswa..."
          clearable
          class="!w-64"
          :prefix-icon="Search"
        />
      </div>
    </div>

    <!-- Total Savings Info Card -->
    <div class="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p class="text-amber-100 text-xs font-semibold uppercase tracking-wider">Total Tabungan Terkumpul Seluruh Mahasiswa</p>
        <h2 class="text-3xl font-black mt-1">{{ formatRupiah(totalSavingsBalance) }}</h2>
        <p class="text-xs text-amber-100/90 mt-1">Bukan merupakan saldo kas bebas operasional kelas.</p>
      </div>
      <div class="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs text-white">
        Mahasiswa dengan Tabungan Aktif: <strong>{{ studentsWithSavingsCount }} Mahasiswa</strong>
      </div>
    </div>

    <!-- Savings Table & Mobile Cards -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table -->
      <div class="hidden md:block">
        <el-table :data="filteredStudents" v-loading="loading" style="width: 100%">
          <el-table-column label="Mahasiswa" min-width="180">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaLengkap }}</div>
              <div class="text-xs text-slate-400">Panggilan: {{ row.namaPanggilan || '-' }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="nim" label="NIM" width="140">
            <template #default="{ row }">
              <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{{ row.nim }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Saldo Tabungan Aktif" width="180" align="right">
            <template #default="{ row }">
              <span class="font-extrabold text-base text-amber-600 dark:text-amber-400 font-mono">{{ formatRupiah(row.tabungan || 0) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Aksi Pengembalian" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                type="warning"
                plain
                :disabled="!row.tabungan || row.tabungan <= 0"
                @click="openRefundDialog(row)"
              >
                Kembalikan Uang
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards -->
      <div class="block md:hidden space-y-3">
        <div
          v-for="item in filteredStudents"
          :key="item.id || item.nim"
          class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm">{{ item.namaLengkap }}</h4>
              <p class="text-xs text-slate-400 font-mono mt-0.5">NIM: {{ item.nim }}</p>
            </div>
            <div class="text-right">
              <span class="text-[11px] text-slate-400 block">Saldo Tabungan</span>
              <span class="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                {{ formatRupiah(item.tabungan || 0) }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold" @click="openSavingsDetail(item)">
              Detail
            </el-button>
            <el-button
              size="small"
              type="warning"
              plain
              class="!rounded-lg !text-xs !font-semibold"
              :disabled="!item.tabungan || item.tabungan <= 0"
              @click="openRefundDialog(item)"
            >
              Kembalikan Uang
            </el-button>
          </div>
        </div>

        <div v-if="!filteredStudents.length && !loading" class="text-center py-8 text-xs text-slate-400">
          Tidak ada data mahasiswa ditemukan
        </div>
      </div>
    </div>

    <!-- Mobile Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Tabungan Mahasiswa"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedStudent" class="space-y-4">
        <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
          <div>
            <span class="text-[11px] text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider block">Saldo Tabungan</span>
            <span class="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{{ formatRupiah(selectedStudent.tabungan || 0) }}</span>
          </div>
          <el-tag :type="(selectedStudent.tabungan || 0) > 0 ? 'warning' : 'info'" size="small" class="!font-bold">
            {{ (selectedStudent.tabungan || 0) > 0 ? 'Ada Saldo' : 'Nol' }}
          </el-tag>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Nama Lengkap</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">{{ selectedStudent.namaLengkap }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">NIM</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ selectedStudent.nim }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Nama Panggilan</span>
            <span class="text-slate-700 dark:text-slate-300">{{ selectedStudent.namaPanggilan || '-' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Email</span>
            <span class="text-slate-700 dark:text-slate-300">{{ selectedStudent.email || '-' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center gap-2">
          <el-button
            v-if="selectedStudent && (selectedStudent.tabungan || 0) > 0"
            type="warning"
            plain
            class="!rounded-xl !text-xs !font-semibold"
            @click="detailDialogVisible = false; openRefundDialog(selectedStudent)"
          >
            Kembalikan Saldo
          </el-button>
          <el-button @click="detailDialogVisible = false" class="!flex-1 !rounded-xl !font-semibold">Tutup</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Refund Dialog -->
    <el-dialog
      v-model="refundDialogVisible"
      title="Pengembalian Uang Tabungan Mahasiswa"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="activeStudent" class="space-y-4">
        <div class="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-600 dark:text-slate-400">Mahasiswa:</span>
            <span class="font-bold text-slate-900 dark:text-slate-100">{{ activeStudent.namaLengkap }} ({{ activeStudent.nim }})</span>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-slate-600 dark:text-slate-400">Saldo Tabungan Saat Ini:</span>
            <span class="font-extrabold text-amber-700 dark:text-amber-400 font-mono">{{ formatRupiah(activeStudent.tabungan || 0) }}</span>
          </div>
        </div>

        <el-form label-position="top">
          <el-form-item label="Nominal yang Dikembalikan (Rp)" required>
            <el-input-number
              v-model="refundNominal"
              :min="1000"
              :max="activeStudent.tabungan || 0"
              :step="1000"
              class="!w-full"
            />
            <span class="text-[11px] text-slate-400 mt-1">Maksimal: {{ formatRupiah(activeStudent.tabungan || 0) }}</span>
          </el-form-item>

          <el-form-item label="Alasan / Keterangan Pengembalian">
            <el-input
              v-model="refundDesc"
              type="textarea"
              rows="2"
              placeholder="Contoh: Pengembalian uang lebih kas kepada mahasiswa secara tunai/transfer"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refundDialogVisible = false">Batal</el-button>
          <el-button type="primary" :loading="refunding" @click="handleExecuteRefund" class="!bg-amber-600 !border-none">
            Proses Pengembalian
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { userService } from '../../services/userService.js';
import { savingsService } from '../../services/savingsService.js';
import { formatRupiah } from '../../utils/currency.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const refunding = ref(false);
const studentsList = ref([]);
const searchQuery = ref('');

const detailDialogVisible = ref(false);
const selectedStudent = ref(null);

function openSavingsDetail(item) {
  selectedStudent.value = item;
  detailDialogVisible.value = true;
}

const refundDialogVisible = ref(false);
const activeStudent = ref(null);
const refundNominal = ref(10000);
const refundDesc = ref('');

onMounted(async () => {
  await loadStudents();
});

async function loadStudents() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    const users = await userService.getUsersByClass(classId);
    // Hanya tampilkan mahasiswa (role: USER), kecualikan admin & super admin
    studentsList.value = users.filter(s => s.role === 'USER');
  } catch (err) {
    ElMessage.error('Gagal memuat data tabungan: ' + err.message);
  } finally {
    loading.value = false;
  }
}

const totalSavingsBalance = computed(() => {
  return studentsList.value.reduce((acc, s) => acc + (Number(s.tabungan) || 0), 0);
});

const studentsWithSavingsCount = computed(() => {
  return studentsList.value.filter(s => (s.tabungan || 0) > 0).length;
});

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) return studentsList.value;
  const q = searchQuery.value.toLowerCase();
  return studentsList.value.filter(s =>
    (s.namaLengkap || '').toLowerCase().includes(q) ||
    (s.nim || '').toLowerCase().includes(q)
  );
});

function openRefundDialog(student) {
  activeStudent.value = student;
  refundNominal.value = student.tabungan || 0;
  refundDesc.value = 'Pengembalian saldo tabungan lebih kepada mahasiswa';
  refundDialogVisible.value = true;
}

async function handleExecuteRefund() {
  if (!activeStudent.value) return;
  if (refundNominal.value <= 0 || refundNominal.value > (activeStudent.value.tabungan || 0)) {
    ElMessage.warning('Nominal pengembalian tidak valid');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `Apakah Anda yakin ingin mengembalikan uang tabungan sebesar ${formatRupiah(refundNominal.value)} kepada ${activeStudent.value.namaLengkap}?`,
      'Konfirmasi Pengembalian Uang',
      { confirmButtonText: 'Kembalikan', cancelButtonText: 'Batal', type: 'warning' }
    );

    refunding.value = true;
    await savingsService.refundSavings({
      kelasId: authStore.userClassId,
      userId: activeStudent.value.id,
      nominal: refundNominal.value,
      deskripsi: refundDesc.value,
      createdBy: authStore.user?.uid
    });

    ElMessage.success('Uang tabungan berhasil dikembalikan!');
    refundDialogVisible.value = false;
    await loadStudents();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal memproses pengembalian tabungan');
    }
  } finally {
    refunding.value = false;
  }
}
</script>

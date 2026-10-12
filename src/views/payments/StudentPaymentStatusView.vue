<template>
  <div class="space-y-6">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">Status Kas & Tunggakan</h1>
          <el-tag size="small" type="success" effect="plain" class="!font-bold !rounded-lg shrink-0">
            {{ currentSemester }}
          </el-tag>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 sm:line-clamp-none">
          Pantau status kewajiban kas & tunggakan khusus untuk <strong>{{ currentSemester }}</strong> (Semester Berjalan).
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
        <el-select v-model="statusFilter" placeholder="Filter Status" class="w-full sm:!w-44" clearable>
          <el-option label="Semua Status" value="" />
          <el-option label="LUNAS" value="LUNAS" />
          <el-option label="BELUM LUNAS" value="BELUM LUNAS" />
          <el-option label="BELUM ADA PEMBAYARAN" value="BELUM ADA PEMBAYARAN" />
          <el-option label="TIDAK AKTIF" value="TIDAK AKTIF" />
        </el-select>

        <el-input
          v-model="searchQuery"
          placeholder="Cari Nama / NIM..."
          clearable
          class="w-full sm:!w-56"
          :prefix-icon="Search"
        />
      </div>
    </div>

    <!-- Summary Badges -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between">
        <div class="min-w-0">
          <span class="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Mahasiswa Lunas</span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{{ lunasCount }} Orang</h3>
          <p class="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">Sudah bayar pertemuan saat ini & sebelumnya</p>
        </div>
        <el-icon class="text-emerald-500 shrink-0 ml-2" :size="30"><Check /></el-icon>
      </div>

      <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between">
        <div class="min-w-0">
          <span class="text-xs font-semibold text-amber-800 dark:text-amber-300">Ada Tunggakan</span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">{{ belumLunasCount }} Orang</h3>
          <p class="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 truncate">Pertemuan jatuh tempo belum dibayar</p>
        </div>
        <el-icon class="text-amber-500 shrink-0 ml-2" :size="30"><Warning /></el-icon>
      </div>

      <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 flex items-center justify-between">
        <div class="min-w-0">
          <span class="text-xs font-semibold text-rose-800 dark:text-rose-300">Belum Ada Bayar</span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">{{ belumAdaPembayaranCount }} Orang</h3>
          <p class="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 truncate">Belum bayar dari awal semester</p>
        </div>
        <el-icon class="text-rose-500 shrink-0 ml-2" :size="30"><Close /></el-icon>
      </div>

      <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
        <div class="min-w-0">
          <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Tidak Aktif</span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{{ tidakAktifCount }} Orang</h3>
          <p class="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Bebas kewajiban kas (nonaktif)</p>
        </div>
        <el-icon class="text-slate-400 shrink-0 ml-2" :size="30"><InfoFilled /></el-icon>
      </div>
    </div>

    <!-- Status Content (Desktop Table vs Mobile Cards) -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table (md and above) -->
      <div class="hidden md:block">
        <el-table :data="filteredStudents" v-loading="loading" style="width: 100%">
          <el-table-column label="Mahasiswa" min-width="180">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaLengkap }}</div>
              <div class="text-xs text-slate-400">Panggilan: {{ row.namaPanggilan || '-' }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="nim" label="NIM" width="130">
            <template #default="{ row }">
              <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{{ row.nim }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Pertemuan Lunas" width="150" align="center">
            <template #default="{ row }">
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ row.pertemuanLunas }}</span>
              <span class="text-slate-400"> / {{ row.totalPertemuanWajib }} Wajib</span>
              <div v-if="row.totalPertemuan > row.totalPertemuanWajib" class="text-[10px] text-slate-400">
                ({{ row.totalPertemuan }} terjadwal)
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Kewajiban Saat Ini" width="145" align="right">
            <template #default="{ row }">
              <span class="text-slate-700 dark:text-slate-300 font-mono font-semibold">{{ formatRupiah(row.totalKewajiban) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Kas Terbayar" width="130" align="right">
            <template #default="{ row }">
              <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(row.totalKasPaid) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Sisa Tunggakan" width="130" align="right">
            <template #default="{ row }">
              <span :class="row.tunggakan > 0 ? 'font-bold text-rose-600 dark:text-rose-400 font-mono' : 'text-slate-400 dark:text-slate-500 font-mono'">
                {{ formatRupiah(row.tunggakan) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Saldo Tabungan" width="130" align="right">
            <template #default="{ row }">
              <span class="font-semibold text-amber-600 dark:text-amber-400 font-mono">{{ formatRupiah(row.saldoTabungan) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Status Pembayaran" width="160" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'LUNAS' ? 'success' : (row.status === 'BELUM LUNAS' ? 'warning' : (row.status === 'TIDAK AKTIF' ? 'info' : 'danger'))"
                effect="light"
                class="!font-bold !text-[11px]"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Aksi" width="110" align="center" fixed="right">
            <template #default="{ row }">
              <span v-if="row.status === 'TIDAK AKTIF'" class="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                Bebas Kas
              </span>
              <router-link
                v-else-if="row.status !== 'LUNAS'"
                :to="`/admin/payments/create?studentId=${row.userId}`"
              >
                <el-button size="small" type="primary" link class="!text-xs !font-bold">
                  Bayar Kas
                </el-button>
              </router-link>
              <span v-else class="text-xs text-emerald-600 font-bold">✓ Lunas</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards (< md) -->
      <div class="block md:hidden space-y-3" v-loading="loading">
        <div v-if="filteredStudents.length === 0" class="text-center py-8 text-xs text-slate-400">
          Tidak ada data mahasiswa yang cocok dengan filter
        </div>

        <div
          v-for="st in filteredStudents"
          :key="st.userId"
          class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shadow-xs space-y-3 transition-colors"
        >
          <!-- Card Header -->
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{{ st.namaLengkap }}</h4>
              <p class="text-[11px] text-slate-400 font-mono">NIM: {{ st.nim }}</p>
            </div>
            <el-tag
              :type="st.status === 'LUNAS' ? 'success' : (st.status === 'BELUM LUNAS' ? 'warning' : (st.status === 'TIDAK AKTIF' ? 'info' : 'danger'))"
              size="small"
              class="!font-bold shrink-0 text-[10px]"
            >
              {{ st.status }}
            </el-tag>
          </div>

          <!-- Card Metrics Grid -->
          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span class="text-slate-400 text-[11px] block">Pertemuan Lunas</span>
              <strong class="text-slate-800 dark:text-slate-200 font-bold">
                {{ st.pertemuanLunas }} <span class="text-slate-400 font-normal">/ {{ st.totalPertemuanWajib }} Wajib</span>
              </strong>
            </div>

            <div class="text-right">
              <span class="text-slate-400 text-[11px] block">Sisa Tunggakan</span>
              <strong
                :class="st.tunggakan > 0 ? 'text-rose-600 dark:text-rose-400 font-bold font-mono' : 'text-slate-500 font-mono'"
              >
                {{ formatRupiah(st.tunggakan) }}
              </strong>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <el-button
              size="small"
              type="info"
              plain
              class="flex-1 !rounded-xl !text-xs !font-semibold"
              @click="openStudentDetail(st)"
            >
              Detail Rincian
            </el-button>

            <span v-if="st.status === 'TIDAK AKTIF'" class="text-xs text-slate-400 dark:text-slate-500 font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-center flex-1">
              Bebas Kas
            </span>
            <router-link
              v-else-if="st.status !== 'LUNAS'"
              :to="`/admin/payments/create?studentId=${st.userId}`"
              class="flex-1"
            >
              <el-button
                size="small"
                type="primary"
                class="w-full !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !text-xs !font-semibold"
              >
                Bayar Kas
              </el-button>
            </router-link>
            <span v-else class="text-xs text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl">
              ✓ Lunas
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- DIALOG: Rincian Lengkap Mahasiswa (Mobile Detail Dialog) -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Status Kas Mahasiswa"
      width="92%"
      class="!max-w-[480px] !rounded-2xl"
    >
      <div v-if="selectedStudent" class="space-y-4">
        <!-- Student Identity Header inside Dialog -->
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
          <div class="min-w-0">
            <h4 class="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">{{ selectedStudent.namaLengkap }}</h4>
            <p class="text-xs text-slate-400 font-mono mt-0.5">NIM: {{ selectedStudent.nim }}</p>
          </div>
          <el-tag
            :type="selectedStudent.status === 'LUNAS' ? 'success' : (selectedStudent.status === 'BELUM LUNAS' ? 'warning' : (selectedStudent.status === 'TIDAK AKTIF' ? 'info' : 'danger'))"
            class="!font-bold shrink-0"
          >
            {{ selectedStudent.status }}
          </el-tag>
        </div>

        <!-- Detail Breakdown Table -->
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <span class="text-slate-500 dark:text-slate-400">Semester</span>
            <strong class="text-slate-800 dark:text-slate-200">{{ selectedStudent.semester || currentSemester }}</strong>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <span class="text-slate-500 dark:text-slate-400">Pertemuan Lunas</span>
            <strong class="text-slate-800 dark:text-slate-200">
              {{ selectedStudent.pertemuanLunas }} dari {{ selectedStudent.totalPertemuanWajib }} Wajib
              <span v-if="selectedStudent.totalPertemuan > selectedStudent.totalPertemuanWajib" class="text-slate-400 font-normal">
                ({{ selectedStudent.totalPertemuan }} terjadwal)
              </span>
            </strong>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <span class="text-slate-500 dark:text-slate-400">Kewajiban Saat Ini</span>
            <strong class="font-mono text-slate-800 dark:text-slate-200">{{ formatRupiah(selectedStudent.totalKewajiban) }}</strong>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <span class="text-slate-500 dark:text-slate-400">Kas Terbayar</span>
            <strong class="font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(selectedStudent.totalKasPaid) }}</strong>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <span class="text-slate-500 dark:text-slate-400">Sisa Tunggakan</span>
            <strong :class="selectedStudent.tunggakan > 0 ? 'font-mono text-rose-600 dark:text-rose-400 font-bold' : 'font-mono text-slate-400'">
              {{ formatRupiah(selectedStudent.tunggakan) }}
            </strong>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <span class="text-slate-500 dark:text-slate-400">Saldo Tabungan</span>
            <strong class="font-mono text-amber-600 dark:text-amber-400">{{ formatRupiah(selectedStudent.saldoTabungan) }}</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <el-button @click="detailDialogVisible = false" class="!rounded-xl">Tutup</el-button>
          <router-link
            v-if="selectedStudent && selectedStudent.status !== 'LUNAS' && selectedStudent.status !== 'TIDAK AKTIF'"
            :to="`/admin/payments/create?studentId=${selectedStudent.userId}`"
          >
            <el-button
              type="primary"
              class="!bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold !rounded-xl"
              @click="detailDialogVisible = false"
            >
              Bayar Kas
            </el-button>
          </router-link>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { reportService } from '../../services/reportService.js';
import { formatRupiah } from '../../utils/currency.js';
import { getCurrentMonthYear } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Search, Check, Warning, Close, InfoFilled } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const students = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const currentSemester = ref('Semester 1 2026/2027');

const detailDialogVisible = ref(false);
const selectedStudent = ref(null);

function openStudentDetail(student) {
  selectedStudent.value = student;
  detailDialogVisible.value = true;
}

onMounted(async () => {
  await loadStatus();
});

async function loadStatus() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    const report = await reportService.getMonthlyReport(classId, getCurrentMonthYear());
    students.value = report.rekapMahasiswa || [];
    currentSemester.value = report.classData?.semesterAktif || authStore.userProfile?.kelasSemester || 'Semester 1 2026/2027';
  } catch (err) {
    ElMessage.error('Gagal memuat rekap status kas: ' + err.message);
  } finally {
    loading.value = false;
  }
}

const lunasCount = computed(() => students.value.filter(s => s.status === 'LUNAS').length);
const belumLunasCount = computed(() => students.value.filter(s => s.status === 'BELUM LUNAS').length);
const belumAdaPembayaranCount = computed(() => students.value.filter(s => s.status === 'BELUM ADA PEMBAYARAN').length);
const tidakAktifCount = computed(() => students.value.filter(s => s.status === 'TIDAK AKTIF').length);

const filteredStudents = computed(() => {
  let list = students.value;
  if (statusFilter.value) {
    list = list.filter(s => s.status === statusFilter.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(s =>
      (s.namaLengkap || '').toLowerCase().includes(q) ||
      (s.nim || '').toLowerCase().includes(q)
    );
  }
  return list;
});
</script>

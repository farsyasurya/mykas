<template>
  <div class="space-y-6 w-full min-w-0">
    <!-- Top Header Card -->
    <div class="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
      <div class="min-w-0">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <el-icon :size="22"><Calendar /></el-icon>
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Laporan Kas Per Pertemuan
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau kepatuhan bayar kas seluruh mahasiswa per jadwal pertemuan perkuliahan.
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Action: Export / Print -->
      <div class="flex items-center gap-2 shrink-0">
        <el-button
          v-if="selectedMeeting"
          type="primary"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-none !text-white !rounded-xl !text-xs !font-bold flex items-center gap-1.5 shadow-sm"
          :loading="exporting"
          @click="handleExportPdf('print')"
        >
          <el-icon><Printer /></el-icon>
          <span>Cetak PDF</span>
        </el-button>

        <el-button
          v-if="selectedMeeting"
          type="primary"
          plain
          class="!rounded-xl !text-xs !font-bold flex items-center gap-1.5"
          :loading="exporting"
          @click="handleExportPdf('download')"
        >
          <el-icon><Download /></el-icon>
          <span>Unduh PDF</span>
        </el-button>
      </div>
    </div>

    <!-- Filter Bar: Select 1 Pertemuan & Controls -->
    <div class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        <!-- 1. SELECT UTAMA: Filter 1 Per Pertemuan (Col 6) -->
        <div class="md:col-span-6 min-w-0">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Pilih Pertemuan Kelas:
          </label>
          <el-select
            v-model="selectedMeetingId"
            placeholder="Pilih salah satu pertemuan..."
            class="w-full"
            filterable
            @change="handleMeetingChange"
          >
            <el-option
              v-for="m in meetingsList"
              :key="m.id"
              :label="`Pertemuan ${m.nomorPertemuan} • ${formatIndonesianDate(m.tanggalPertemuan)} (${m.semester || 'Reguler'})`"
              :value="m.id"
            >
              <div class="flex items-center justify-between w-full py-0.5">
                <span class="font-bold text-slate-900 dark:text-slate-100">
                  Pertemuan {{ m.nomorPertemuan }}
                </span>
                <span class="text-xs text-slate-400">
                  {{ formatIndonesianDate(m.tanggalPertemuan) }}
                </span>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 2. Filter Status (Col 3) -->
        <div class="md:col-span-3 min-w-0">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Filter Status:
          </label>
          <el-select v-model="statusFilter" placeholder="Semua Status" class="w-full" clearable>
            <el-option label="Semua Status" value="" />
            <el-option label="LUNAS" value="LUNAS" />
            <el-option label="BELUM BAYAR" value="BELUM BAYAR" />
          </el-select>
        </div>

        <!-- 3. Search Mahasiswa (Col 3) -->
        <div class="md:col-span-3 min-w-0">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Cari Mahasiswa:
          </label>
          <el-input
            v-model="searchQuery"
            placeholder="Nama atau NIM..."
            clearable
            :prefix-icon="Search"
            class="w-full"
          />
        </div>
      </div>

      <!-- Quick Semester Badges if Multiple Semesters exist -->
      <div v-if="semesters.length > 1" class="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <span class="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Semester:</span>
        <button
          v-for="sem in semesters"
          :key="sem"
          @click="filterBySemester(sem)"
          class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0"
          :class="activeSemesterFilter === sem
            ? 'bg-emerald-600 text-white font-bold shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
        >
          {{ sem }}
        </button>
      </div>
    </div>

    <!-- Active Meeting Summary Stats (Visible if meeting selected) -->
    <div v-if="selectedMeeting" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Total Mahasiswa -->
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Total Mahasiswa</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{{ studentsList.length }}</span>
          <span class="text-xs text-slate-400">Orang</span>
        </div>
      </div>

      <!-- Sudah Lunas -->
      <div class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm transition-colors">
        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">Sudah Lunas</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{{ lunasStudents.length }}</span>
          <span class="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">({{ lunasPercentage }}%)</span>
        </div>
        <p class="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 font-bold">
          {{ formatRupiah(lunasStudents.length * (selectedMeeting.tarifKas || 7000)) }}
        </p>
      </div>

      <!-- Belum Bayar -->
      <div class="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 shadow-sm transition-colors">
        <span class="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block">Belum Bayar</span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{{ unpaidStudents.length }}</span>
          <span class="text-xs text-rose-700 dark:text-rose-300 font-semibold">({{ 100 - lunasPercentage }}%)</span>
        </div>
        <p class="text-[11px] text-rose-700 dark:text-rose-400 font-mono mt-0.5 font-bold">
          {{ formatRupiah(unpaidStudents.length * (selectedMeeting.tarifKas || 7000)) }}
        </p>
      </div>

      <!-- Info Jadwal & Tarif -->
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Jadwal & Tarif Kas</span>
        <div class="mt-1">
          <div class="text-sm font-bold text-slate-800 dark:text-slate-200">
            {{ formatIndonesianDate(selectedMeeting.tanggalPertemuan) }}
          </div>
          <div class="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">
            {{ formatRupiah(selectedMeeting.tarifKas || 7000) }} / mhs
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State: Belum Ada Pertemuan Dipilih -->
    <div
      v-if="!selectedMeeting && !loading"
      class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm"
    >
      <el-icon :size="48" class="text-slate-300 dark:text-slate-600 mb-3"><Calendar /></el-icon>
      <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Pilih Pertemuan Terlebih Dahulu</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        Silakan pilih salah satu pertemuan pada dropdown filter di atas untuk menampilkan daftar status kas mahasiswa.
      </p>
    </div>

    <!-- MAIN DATA VIEW (Desktop Table vs Mobile Cards) -->
    <div
      v-else
      class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors"
      v-loading="loading"
    >
      <!-- Table Header Info Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
            Rekap Pertemuan {{ selectedMeeting?.nomorPertemuan }} • {{ selectedMeeting?.semester }}
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Menampilkan {{ filteredRows.length }} dari {{ processedRows.length }} mahasiswa
          </p>
        </div>

        <div class="flex items-center gap-2">
          <el-tag size="small" type="success" effect="plain" class="!font-bold">
            Tarif: {{ formatRupiah(selectedMeeting?.tarifKas || 7000) }}
          </el-tag>
        </div>
      </div>

      <!-- DESKTOP TABLE (md and above) -->
      <div class="hidden md:block">
        <el-table :data="paginatedRows" style="width: 100%">
          <!-- 1. Kolom Mahasiswa -->
          <el-table-column label="Mahasiswa" min-width="190">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {{ row.namaLengkap }}
              </div>
              <div class="text-xs text-slate-400 font-mono">
                NIM: {{ row.nim }}
              </div>
            </template>
          </el-table-column>

          <!-- 2. Kolom Pertemuan -->
          <el-table-column label="Pertemuan" width="130" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info" class="!font-bold !rounded-lg">
                Pertemuan {{ row.nomorPertemuan }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 3. Kolom Nominal -->
          <el-table-column label="Nominal" width="120" align="right">
            <template #default="{ row }">
              <span class="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                {{ formatRupiah(row.nominal) }}
              </span>
            </template>
          </el-table-column>

          <!-- 4. Kolom Status -->
          <el-table-column label="Status" width="130" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'LUNAS' ? 'success' : 'danger'"
                size="small"
                effect="light"
                class="!font-bold !rounded-lg"
              >
                <el-icon class="mr-1" v-if="row.status === 'LUNAS'"><Check /></el-icon>
                <el-icon class="mr-1" v-else><Close /></el-icon>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 5. Kolom Tanggal Pertemuan -->
          <el-table-column label="Tanggal Pertemuan" width="160">
            <template #default="{ row }">
              <div class="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {{ formatIndonesianDate(row.tanggalPertemuan) }}
              </div>
            </template>
          </el-table-column>

          <!-- 6. Kolom Tanggal Membayar -->
          <el-table-column label="Tanggal Membayar" min-width="170">
            <template #default="{ row }">
              <div v-if="row.status === 'LUNAS'" class="space-y-0.5">
                <div class="font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                  {{ formatIndonesianDateTime(row.tanggalMembayar) }}
                </div>
                <div class="text-[10px] text-slate-400 font-mono">
                  Metode: {{ row.metodePembayaran }}
                </div>
              </div>
              <div v-else class="text-xs text-slate-400 italic">
                - Belum Bayar -
              </div>
            </template>
          </el-table-column>

          <!-- Aksi Kolom -->
          <el-table-column label="Aksi" width="110" align="center" fixed="right">
            <template #default="{ row }">
              <router-link
                v-if="row.status !== 'LUNAS'"
                :to="`/admin/payments/create?studentId=${row.userId}`"
              >
                <el-button size="small" type="primary" class="!rounded-lg !text-xs !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold">
                  Bayar
                </el-button>
              </router-link>
              <el-button
                v-else
                size="small"
                text
                type="primary"
                class="!font-bold"
                @click="openDetail(row)"
              >
                Detail
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- MOBILE CARDS (< md) -->
      <div class="block md:hidden space-y-3">
        <div v-if="paginatedRows.length === 0" class="text-center py-8 text-xs text-slate-400">
          Tidak ada data mahasiswa yang sesuai filter.
        </div>

        <div
          v-for="row in paginatedRows"
          :key="row.userId"
          class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shadow-xs space-y-2.5 transition-colors"
        >
          <!-- Mahasiswa Header & Status Badge -->
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                {{ row.namaLengkap }}
              </h4>
              <p class="text-[11px] text-slate-400 font-mono">
                NIM: {{ row.nim }}
              </p>
            </div>
            <el-tag
              :type="row.status === 'LUNAS' ? 'success' : 'danger'"
              size="small"
              class="!font-bold shrink-0 text-[10px]"
            >
              {{ row.status }}
            </el-tag>
          </div>

          <!-- Rincian Pertemuan & Nominal -->
          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span class="text-slate-400 text-[11px] block">Pertemuan & Tanggal</span>
              <strong class="text-slate-800 dark:text-slate-200">
                Ptm {{ row.nomorPertemuan }} • {{ formatIndonesianDate(row.tanggalPertemuan) }}
              </strong>
            </div>
            <div class="text-right">
              <span class="text-slate-400 text-[11px] block">Nominal Kas</span>
              <strong class="text-slate-900 dark:text-slate-100 font-bold font-mono">
                {{ formatRupiah(row.nominal) }}
              </strong>
            </div>
          </div>

          <!-- Tanggal Membayar & Aksi -->
          <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div class="min-w-0">
              <span class="text-slate-400 text-[10px] block">Waktu Bayar:</span>
              <span v-if="row.status === 'LUNAS'" class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {{ formatIndonesianDateTime(row.tanggalMembayar) }}
              </span>
              <span v-else class="text-[11px] text-slate-400 italic">
                Belum membayar
              </span>
            </div>

            <router-link
              v-if="row.status !== 'LUNAS'"
              :to="`/admin/payments/create?studentId=${row.userId}`"
            >
              <el-button size="small" type="primary" class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !text-xs !font-bold">
                Bayar Kas
              </el-button>
            </router-link>
            <el-button
              v-else
              size="small"
              type="primary"
              plain
              class="!rounded-xl !text-xs !font-semibold"
              @click="openDetail(row)"
            >
              Rincian
            </el-button>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span class="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          Menampilkan {{ paginatedRows.length }} dari {{ filteredRows.length }} mahasiswa
        </span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredRows.length"
          layout="prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- DETAIL MODAL DIALOG -->
    <el-dialog
      v-model="detailVisible"
      title="Rincian Status Pembayaran Pertemuan"
      width="92%"
      class="!max-w-[480px] !rounded-2xl"
      destroy-on-close
    >
      <div v-if="activeRow" class="space-y-3.5 text-xs">
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Nama Mahasiswa</span>
          <span class="font-bold text-slate-900 dark:text-slate-100">{{ activeRow.namaLengkap }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">NIM</span>
          <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ activeRow.nim }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Pertemuan</span>
          <span class="font-bold text-slate-900 dark:text-slate-100">Pertemuan {{ activeRow.nomorPertemuan }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Tanggal Pertemuan</span>
          <span class="text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(activeRow.tanggalPertemuan) }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Tarif Kas</span>
          <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(activeRow.nominal) }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Status Pembayaran</span>
          <el-tag :type="activeRow.status === 'LUNAS' ? 'success' : 'danger'" size="small" class="!font-bold">
            {{ activeRow.status }}
          </el-tag>
        </div>
        <div v-if="activeRow.status === 'LUNAS'" class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Waktu Pembayaran</span>
          <span class="font-semibold text-emerald-700 dark:text-emerald-400">{{ formatIndonesianDateTime(activeRow.tanggalMembayar) }}</span>
        </div>
        <div v-if="activeRow.status === 'LUNAS'" class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Metode</span>
          <el-tag size="small" type="info">{{ activeRow.metodePembayaran }}</el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { meetingService } from '../../services/meetingService.js';
import { userService } from '../../services/userService.js';
import { paymentService } from '../../services/paymentService.js';
import { classService } from '../../services/classService.js';
import { exportMeetingReportPdf } from '../../utils/pdfExport.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate, formatIndonesianDateTime } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Calendar, Search, Check, Close, Printer, Download } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const exporting = ref(false);

const meetingsList = ref([]);
const studentsList = ref([]);
const paymentsList = ref([]);
const classData = ref(null);

const selectedMeetingId = ref('');
const statusFilter = ref('');
const searchQuery = ref('');
const activeSemesterFilter = ref('');

const currentPage = ref(1);
const pageSize = ref(15);

const detailVisible = ref(false);
const activeRow = ref(null);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    const [meetings, students, payments, classInfo] = await Promise.all([
      meetingService.getMeetingsByClass(classId),
      userService.getStudentsByClass(classId),
      paymentService.getPaymentsByClass(classId),
      classService.getClassById(classId).catch(() => null)
    ]);

    meetingsList.value = meetings || [];
    studentsList.value = students || [];
    paymentsList.value = payments || [];
    classData.value = classInfo || null;

    // Pilih pertemuan terbaru secara default jika tersedia
    if (meetingsList.value.length > 0) {
      // Cari pertemuan yang tanggalnya paling dekat atau pertemuan pertama
      selectedMeetingId.value = meetingsList.value[0].id;
    }
  } catch (err) {
    ElMessage.error('Gagal memuat data laporan pertemuan: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// Daftar semester unik yang ada di jadwal pertemuan
const semesters = computed(() => {
  const set = new Set();
  meetingsList.value.forEach(m => {
    if (m.semester) set.add(m.semester);
  });
  return Array.from(set);
});

function filterBySemester(semesterName) {
  if (activeSemesterFilter.value === semesterName) {
    activeSemesterFilter.value = '';
  } else {
    activeSemesterFilter.value = semesterName;
    // Otomatis pilih pertemuan pertama di semester tersebut
    const match = meetingsList.value.find(m => m.semester === semesterName);
    if (match) {
      selectedMeetingId.value = match.id;
    }
  }
}

const selectedMeeting = computed(() => {
  if (!selectedMeetingId.value) return null;
  return meetingsList.value.find(m => m.id === selectedMeetingId.value) || null;
});

function handleMeetingChange() {
  currentPage.value = 1;
}

// Rekap baris data tabel per mahasiswa untuk pertemuan yang dipilih
const processedRows = computed(() => {
  if (!selectedMeeting.value) return [];

  const targetMeetingId = selectedMeeting.value.id;
  const tarif = Number(selectedMeeting.value.tarifKas) || 7000;
  const tglPertemuan = selectedMeeting.value.tanggalPertemuan;
  const ptmNomor = selectedMeeting.value.nomorPertemuan;

  // Bangun peta pembayaran: userId -> payment record yang meng-cover targetMeetingId
  const paymentMap = new Map();
  paymentsList.value.forEach(p => {
    if (Array.isArray(p.meetingIds) && p.meetingIds.includes(targetMeetingId)) {
      paymentMap.set(p.userId, p);
    }
  });

  return studentsList.value.map(s => {
    const payment = paymentMap.get(s.id);
    const isPaid = !!payment;

    return {
      userId: s.id,
      namaLengkap: s.namaLengkap || 'Tanpa Nama',
      nim: s.nim || '-',
      nomorPertemuan: ptmNomor,
      nominal: tarif,
      status: isPaid ? 'LUNAS' : 'BELUM BAYAR',
      tanggalPertemuan: tglPertemuan,
      tanggalMembayar: isPaid ? payment.createdAt : null,
      metodePembayaran: isPaid ? (payment.tipePembayaran || 'CASH') : '-',
      paymentId: isPaid ? payment.id : null
    };
  });
});

const lunasStudents = computed(() => processedRows.value.filter(r => r.status === 'LUNAS'));
const unpaidStudents = computed(() => processedRows.value.filter(r => r.status === 'BELUM BAYAR'));

const lunasPercentage = computed(() => {
  if (processedRows.value.length === 0) return 0;
  return Math.round((lunasStudents.value.length / processedRows.value.length) * 100);
});

const filteredRows = computed(() => {
  let list = processedRows.value;

  if (statusFilter.value) {
    list = list.filter(r => r.status === statusFilter.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(r =>
      r.namaLengkap.toLowerCase().includes(q) ||
      r.nim.toLowerCase().includes(q)
    );
  }

  return list;
});

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

function openDetail(row) {
  activeRow.value = row;
  detailVisible.value = true;
}

function handleExportPdf(action = 'print') {
  if (!selectedMeeting.value) {
    ElMessage.warning('Pilih salah satu pertemuan terlebih dahulu.');
    return;
  }
  if (processedRows.value.length === 0) {
    ElMessage.warning('Belum ada data mahasiswa untuk diekspor.');
    return;
  }

  exporting.value = true;
  try {
    const className = classData.value?.namaKelas || authStore.userClassName || 'Kelas Mahasiswa';
    const generatedBy = authStore.userProfile?.namaLengkap || 'Bendahara Kelas';

    // Gunakan filteredRows jika ada filter status/pencarian yang aktif
    const dataToExport = (statusFilter.value || searchQuery.value.trim()) && filteredRows.value.length > 0
      ? filteredRows.value
      : processedRows.value;

    exportMeetingReportPdf({
      meeting: selectedMeeting.value,
      students: dataToExport,
      className,
      generatedBy
    }, action);

    ElMessage.success(action === 'print' ? 'Mempersiapkan dokumen PDF untuk dicetak...' : 'Laporan PDF pertemuan berhasil diunduh!');
  } catch (err) {
    ElMessage.error('Gagal mencetak laporan PDF: ' + err.message);
    console.error(err);
  } finally {
    exporting.value = false;
  }
}
</script>

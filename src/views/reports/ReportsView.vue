<template>
  <div class="space-y-6">
    <!-- Top Filter & Action Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Laporan Keuangan Bulanan</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Rekonsiliasi arus kas kelas berdasarkan filter periode <strong>MM-YYYY</strong> dan ekspor dokumen resmi PDF.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="Pilih Bulan & Tahun"
          format="MM-YYYY"
          value-format="MM-YYYY"
          :clearable="false"
          @change="generateReport"
          class="!w-44"
        />

        <el-button
          type="primary"
          class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold"
          :loading="loading"
          @click="handleExportPdf('download')"
        >
          <el-icon class="mr-1"><Download /></el-icon> Unduh PDF
        </el-button>

        <el-button
          class="!rounded-xl !font-semibold dark:!border-slate-700 text-slate-700 dark:text-slate-300"
          :loading="loading"
          @click="handleExportPdf('print')"
        >
          <el-icon class="mr-1"><Printer /></el-icon> Cetak Laporan
        </el-button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
      <el-icon class="is-loading text-emerald-600" :size="36"><Loading /></el-icon>
      <p class="text-sm text-slate-600 font-semibold mt-3">Sedang menyusun laporan keuangan...</p>
    </div>

    <div v-else-if="reportData" class="space-y-6">
      <!-- 1. Header Information Banner -->
      <div class="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-emerald-100 uppercase tracking-wider">
              Laporan Kas Resmi
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
              {{ reportData.classData?.namaKelas }}
            </h2>
            <p class="text-emerald-100/90 text-sm mt-0.5">
              Semester: {{ reportData.classData?.semesterAktif }} • Periode: {{ reportData.period?.label }}
            </p>
          </div>

          <div class="text-left sm:text-right">
            <span class="text-xs text-emerald-200 uppercase font-bold tracking-wider">Saldo Akhir Kas Periode</span>
            <h3 class="text-3xl font-black text-white mt-1">{{ formatRupiah(reportData.saldoAkhir) }}</h3>
          </div>
        </div>

        <!-- Formula Breakdown Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6 text-xs">
          <div>
            <span class="text-emerald-200/80">Saldo Awal</span>
            <p class="font-bold text-sm text-white mt-0.5">{{ formatRupiah(reportData.saldoAwal) }}</p>
          </div>
          <div>
            <span class="text-emerald-200/80">(+) Kas Rutin</span>
            <p class="font-bold text-sm text-emerald-300 mt-0.5">+ {{ formatRupiah(reportData.totalPemasukanKasRutin) }}</p>
          </div>
          <div>
            <span class="text-emerald-200/80">(+) Pemasukan Lain</span>
            <p class="font-bold text-sm text-blue-300 mt-0.5">+ {{ formatRupiah(reportData.totalPemasukanLain) }}</p>
          </div>
          <div>
            <span class="text-emerald-200/80">(-) Pengeluaran</span>
            <p class="font-bold text-sm text-rose-300 mt-0.5">- {{ formatRupiah(reportData.totalPengeluaranOperasional) }}</p>
          </div>
          <div>
            <span class="text-emerald-200/80">(-) Retur Tabungan</span>
            <p class="font-bold text-sm text-amber-300 mt-0.5">- {{ formatRupiah(reportData.totalPengembalianTabungan) }}</p>
          </div>
          <div class="bg-white/10 rounded-xl p-2.5">
            <span class="text-amber-200 font-semibold">[Info] Tabungan Total</span>
            <p class="font-black text-sm text-amber-300 mt-0.5">{{ formatRupiah(reportData.totalTabunganMahasiswa) }}</p>
          </div>
        </div>
      </div>

      <!-- 2. Section: Pengeluaran Bulan Ini Table -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 transition-colors">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Rincian Pengeluaran Operasional Bulan Ini</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Total: {{ formatRupiah(reportData.totalPengeluaranOperasional) }}</p>
          </div>
        </div>

        <!-- Desktop Table for Expenses -->
        <div class="hidden sm:block">
          <el-table :data="reportData.monthExpenses" size="small" style="width: 100%" empty-text="Tidak ada pengeluaran pada periode ini">
            <el-table-column prop="tanggalPengeluaran" label="Tanggal" width="140">
              <template #default="{ row }">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(row.tanggalPengeluaran) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="kategori" label="Kategori" width="160">
              <template #default="{ row }">
                <el-tag size="small" type="danger">{{ row.kategori }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="judul" label="Keperluan" min-width="180">
              <template #default="{ row }">
                <span class="font-bold text-slate-900 dark:text-slate-100">{{ row.judul }}</span>
                <span v-if="row.deskripsi" class="text-xs text-slate-400 block">{{ row.deskripsi }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="nominal" label="Nominal" width="140" align="right">
              <template #default="{ row }">
                <span class="font-bold text-rose-600 dark:text-rose-400 font-mono">{{ formatRupiah(row.nominal) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile Cards for Expenses -->
        <div class="block sm:hidden space-y-3">
          <div
            v-for="(exp, idx) in reportData.monthExpenses"
            :key="exp.id || idx"
            class="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
          >
            <div class="flex items-center justify-between">
              <el-tag size="small" type="danger" effect="light" class="!font-semibold">
                {{ exp.kategori }}
              </el-tag>
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {{ formatIndonesianDate(exp.tanggalPengeluaran) }}
              </span>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{{ exp.judul }}</h4>
              <p v-if="exp.deskripsi" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{{ exp.deskripsi }}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span class="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                {{ formatRupiah(exp.nominal) }}
              </span>
              <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold" @click="openExpenseDetail(exp)">
                Detail
              </el-button>
            </div>
          </div>
          <div v-if="!reportData.monthExpenses?.length" class="text-center py-6 text-xs text-slate-400">
            Tidak ada pengeluaran pada periode ini
          </div>
        </div>
      </div>

      <!-- 3. Section: Rekap Pembayaran Mahasiswa Table -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 transition-colors">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Rekapitulasi Kas Mahasiswa</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Lunas: {{ reportData?.mahasiswaLunasCount ?? 0 }} • Belum Lunas: {{ reportData?.mahasiswaBelumLunasCount ?? 0 }}
            </p>
          </div>
        </div>

        <!-- Desktop Table for Student Summary -->
        <div class="hidden md:block">
          <el-table :data="reportData.rekapMahasiswa" size="small" style="width: 100%" empty-text="Belum ada data mahasiswa">
            <el-table-column label="Mahasiswa" min-width="170">
              <template #default="{ row }">
                <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaLengkap }}</div>
                <div class="text-[11px] text-slate-400">NIM: {{ row.nim }}</div>
              </template>
            </el-table-column>
            <el-table-column label="Lunas" width="120" align="center">
              <template #default="{ row }">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ row.pertemuanLunas }} / {{ row.totalPertemuanWajib }} Wajib</span>
              </template>
            </el-table-column>
            <el-table-column label="Kas Masuk" width="120" align="right">
              <template #default="{ row }">
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(row.totalKasPaid) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Tunggakan" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.tunggakan > 0 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-400'">
                  {{ formatRupiah(row.tunggakan) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Tabungan" width="120" align="right">
              <template #default="{ row }">
                <span class="font-semibold text-amber-600 dark:text-amber-400">{{ formatRupiah(row.saldoTabungan) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Status" width="140" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'LUNAS' ? 'success' : (row.status === 'BELUM LUNAS' ? 'warning' : 'danger')"
                  size="small"
                  class="!font-bold"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile Cards for Student Summary -->
        <div class="block md:hidden space-y-3">
          <div
            v-for="(mhs, idx) in reportData.rekapMahasiswa"
            :key="mhs.nim || idx"
            class="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{{ mhs.namaLengkap }}</h4>
                <p class="text-xs text-slate-400 font-mono">NIM: {{ mhs.nim }}</p>
              </div>
              <el-tag
                :type="mhs.status === 'LUNAS' ? 'success' : (mhs.status === 'BELUM LUNAS' ? 'warning' : 'danger')"
                size="small"
                class="!font-bold shrink-0"
              >
                {{ mhs.status }}
              </el-tag>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/50 dark:border-slate-700/50">
              <div>
                <span class="text-slate-400 text-[11px] block">Pertemuan</span>
                <span class="font-semibold text-slate-700 dark:text-slate-300">
                  {{ mhs.pertemuanLunas }} / {{ mhs.totalPertemuanWajib }} Wajib
                </span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Kas Masuk</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {{ formatRupiah(mhs.totalKasPaid) }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Tunggakan</span>
                <span :class="mhs.tunggakan > 0 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-400 font-medium'" class="font-mono">
                  {{ formatRupiah(mhs.tunggakan) }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 text-[11px] block">Tabungan</span>
                <span class="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                  {{ formatRupiah(mhs.saldoTabungan) }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-end">
              <el-button size="small" type="primary" plain class="!rounded-lg !text-xs !font-semibold" @click="openStudentDetail(mhs)">
                Detail Rincian
              </el-button>
            </div>
          </div>
          <div v-if="!reportData.rekapMahasiswa?.length" class="text-center py-6 text-xs text-slate-400">
            Belum ada data mahasiswa
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Expense Detail Dialog -->
    <el-dialog
      v-model="expenseDetailVisible"
      title="Rincian Pengeluaran"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedExpense" class="space-y-4">
        <div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div>
            <span class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider block">Nominal Pengeluaran</span>
            <span class="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">{{ formatRupiah(selectedExpense.nominal) }}</span>
          </div>
          <el-tag size="small" type="danger" effect="light" class="!font-bold">
            {{ selectedExpense.kategori }}
          </el-tag>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Keperluan</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 text-right">{{ selectedExpense.judul }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Tanggal Pengeluaran</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(selectedExpense.tanggalPengeluaran) }}</span>
          </div>
          <div v-if="selectedExpense.deskripsi" class="pt-1">
            <span class="text-slate-400 block mb-1">Catatan / Deskripsi:</span>
            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              {{ selectedExpense.deskripsi }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="expenseDetailVisible = false" class="!w-full !rounded-xl !font-semibold">Tutup</el-button>
      </template>
    </el-dialog>

    <!-- Mobile Student Detail Dialog -->
    <el-dialog
      v-model="studentDetailVisible"
      title="Rincian Kas Mahasiswa"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedStudent" class="space-y-4">
        <div class="flex items-start justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div>
            <h4 class="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight">{{ selectedStudent.namaLengkap }}</h4>
            <p class="text-xs text-slate-400 font-mono mt-0.5">NIM: {{ selectedStudent.nim }}</p>
          </div>
          <el-tag
            :type="selectedStudent.status === 'LUNAS' ? 'success' : (selectedStudent.status === 'BELUM LUNAS' ? 'warning' : 'danger')"
            size="small"
            class="!font-bold shrink-0"
          >
            {{ selectedStudent.status }}
          </el-tag>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Pertemuan Lunas</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">
              {{ selectedStudent.pertemuanLunas }} dari {{ selectedStudent.totalPertemuanWajib }} Pertemuan Wajib
            </span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Total Kas Masuk</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {{ formatRupiah(selectedStudent.totalKasPaid) }}
            </span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Total Tunggakan</span>
            <span :class="selectedStudent.tunggakan > 0 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-500'" class="font-mono">
              {{ formatRupiah(selectedStudent.tunggakan) }}
            </span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Saldo Tabungan</span>
            <span class="font-bold text-amber-600 dark:text-amber-400 font-mono">
              {{ formatRupiah(selectedStudent.saldoTabungan) }}
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="studentDetailVisible = false" class="!w-full !rounded-xl !font-semibold">Tutup</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { reportService } from '../../services/reportService.js';
import { exportMonthlyReportPdf } from '../../utils/pdfExport.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate, getCurrentMonthYear } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Download, Printer, Loading } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const selectedMonth = ref(getCurrentMonthYear());
const loading = ref(false);
const reportData = ref(null);

const expenseDetailVisible = ref(false);
const selectedExpense = ref(null);
const studentDetailVisible = ref(false);
const selectedStudent = ref(null);

function openExpenseDetail(exp) {
  selectedExpense.value = exp;
  expenseDetailVisible.value = true;
}

function openStudentDetail(mhs) {
  selectedStudent.value = mhs;
  studentDetailVisible.value = true;
}

onMounted(async () => {
  await generateReport();
});

async function generateReport() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    reportData.value = await reportService.getMonthlyReport(classId, selectedMonth.value);
  } catch (err) {
    ElMessage.error('Gagal memuat laporan: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function handleExportPdf(action = 'download') {
  if (!reportData.value) {
    ElMessage.warning('Data laporan belum siap diekspor');
    return;
  }
  try {
    exportMonthlyReportPdf(reportData.value, action);
    ElMessage.success(action === 'print' ? 'Mempersiapkan cetak dokumen...' : 'Laporan PDF berhasil diunduh!');
  } catch (err) {
    ElMessage.error('Gagal membuat PDF: ' + err.message);
  }
}
</script>

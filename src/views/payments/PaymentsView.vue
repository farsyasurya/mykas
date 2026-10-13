<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">Histori Pembayaran Kas</h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 sm:line-clamp-none">Daftar seluruh transaksi setoran kas mahasiswa yang tersimpan secara terverifikasi.</p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
        <el-input
          v-model="searchQuery"
          placeholder="Cari Mahasiswa / NIM..."
          clearable
          class="w-full sm:!w-64"
          :prefix-icon="Search"
        />

        <router-link to="/admin/payments/create" class="w-full sm:w-auto">
          <el-button type="primary" class="w-full sm:w-auto !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold">
            <el-icon class="mr-1"><Plus /></el-icon> Input Bayar Kas
          </el-button>
        </router-link>
      </div>
    </div>

    <!-- Payments Container (Desktop Table vs Mobile Cards) -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table (md and above) -->
      <div class="hidden md:block">
        <el-table :data="paginatedPayments" v-loading="loading" style="width: 100%">
          <el-table-column label="Waktu Transaksi" min-width="160">
            <template #default="{ row }">
              <div class="font-semibold text-slate-800 dark:text-slate-200 text-xs">{{ formatIndonesianDateTime(row.createdAt) }}</div>
              <div class="text-[11px] text-slate-400 font-mono">ID: {{ row.id?.substring(0, 8) }}...</div>
            </template>
          </el-table-column>

          <el-table-column label="Nama Mahasiswa" min-width="170">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaLengkap }}</div>
              <div class="text-xs text-slate-400 font-mono">NIM: {{ row.nim }}</div>
            </template>
          </el-table-column>

          <el-table-column label="Pertemuan Dibayar" min-width="210">
            <template #default="{ row }">
              <div class="space-y-1 py-1">
                <!-- Badges pertemuan berapa aja -->
                <div class="flex flex-wrap items-center gap-1">
                  <template v-if="getMeetingDetails(row).length > 0">
                    <el-tag
                      v-for="m in getMeetingDetails(row)"
                      :key="m.id || m.nomor"
                      size="small"
                      type="success"
                      effect="light"
                      class="!font-bold !text-[10px] !rounded-md"
                    >
                      Ptm {{ m.nomor }}
                    </el-tag>
                  </template>
                  <el-tag v-else size="small" type="info">
                    {{ row.jumlahPertemuan }} Pertemuan
                  </el-tag>
                </div>

                <!-- Tanggal Pembayaran -->
                <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  <span class="font-medium text-slate-600 dark:text-slate-300">Tgl Bayar:</span> {{ formatIndonesianDateTime(row.createdAt) }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="tipePembayaran" label="Metode" width="95" align="center">
            <template #default="{ row }">
              <el-tag :type="row.tipePembayaran === 'TRANSFER' ? 'primary' : 'success'" size="small">
                {{ row.tipePembayaran }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="nominalPembayaran" label="Total Setoran" width="130" align="right">
            <template #default="{ row }">
              <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(row.nominalPembayaran) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="totalMasukKas" label="Kas Masuk" width="120" align="right">
            <template #default="{ row }">
              <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(row.totalMasukKas) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="totalMasukTabungan" label="Masuk Tabungan" width="130" align="right">
            <template #default="{ row }">
              <span :class="row.totalMasukTabungan > 0 ? 'font-semibold text-amber-600 dark:text-amber-400 font-mono' : 'text-slate-400 font-mono'">
                {{ formatRupiah(row.totalMasukTabungan) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Aksi" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center justify-center gap-1">
                <el-button size="small" text type="primary" class="!font-bold !px-2" @click="openDetail(row)">
                  Detail
                </el-button>
                <el-button size="small" text type="danger" class="!font-bold !px-2" @click="openDeleteConfirm(row)">
                  <el-icon class="mr-0.5"><Delete /></el-icon> Hapus
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards (< md) -->
      <div class="block md:hidden space-y-3" v-loading="loading">
        <div v-if="paginatedPayments.length === 0" class="text-center py-8 text-xs text-slate-400">
          Belum ada transaksi pembayaran yang tercatat
        </div>

        <div
          v-for="p in paginatedPayments"
          :key="p.id"
          class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shadow-xs space-y-2.5 transition-colors"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{{ p.namaLengkap }}</h4>
              <p class="text-[11px] text-slate-400 font-mono">NIM: {{ p.nim }} • {{ formatIndonesianDateTime(p.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <el-tag v-if="p.nominalDariTabungan > 0" size="small" type="warning" effect="dark" class="!font-bold text-[10px]">
                Tabungan
              </el-tag>
              <el-tag :type="p.tipePembayaran === 'TRANSFER' ? 'primary' : 'success'" size="small" class="!font-bold text-[10px]">
                {{ p.tipePembayaran }}
              </el-tag>
            </div>
          </div>

          <!-- Rincian Pertemuan Dibayar pada Mobile -->
          <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span class="text-slate-400 text-[11px] block">Pertemuan yang Dibayar:</span>
            <div class="flex flex-wrap items-center gap-1">
              <template v-if="getMeetingDetails(p).length > 0">
                <el-tag
                  v-for="m in getMeetingDetails(p)"
                  :key="m.id || m.nomor"
                  size="small"
                  type="success"
                  effect="light"
                  class="!font-bold !text-[10px] !rounded-md"
                >
                  Ptm {{ m.nomor }}
                </el-tag>
              </template>
              <span v-else class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {{ p.jumlahPertemuan }} Pertemuan
              </span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Tgl Bayar: {{ formatIndonesianDateTime(p.createdAt) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span class="text-slate-400 text-[11px] block">Total Setoran</span>
              <strong class="text-slate-800 dark:text-slate-200 font-mono">{{ formatRupiah(p.nominalPembayaran) }}</strong>
            </div>
            <div class="text-right">
              <span class="text-slate-400 text-[11px] block">Kas Masuk</span>
              <strong class="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                {{ formatRupiah(p.totalMasukKas) }}
              </strong>
            </div>
          </div>

          <div v-if="p.nominalDariTabungan > 0" class="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <span>Pakai Saldo Tabungan:</span>
            <span class="font-bold font-mono">{{ formatRupiah(p.nominalDariTabungan) }}</span>
          </div>

          <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span v-if="p.totalMasukTabungan > 0" class="text-[11px] text-amber-600 dark:text-amber-400 font-medium font-mono">
              Kelebihan Tabungan: +{{ formatRupiah(p.totalMasukTabungan) }}
            </span>
            <span v-else class="text-[11px] text-slate-400">
              Tanpa Sisa Tabungan
            </span>

            <div class="flex items-center gap-1.5 ml-auto">
              <el-button size="small" type="primary" plain class="!rounded-xl !text-xs !font-semibold" @click="openDetail(p)">
                Detail
              </el-button>
              <el-button size="small" type="danger" plain class="!rounded-xl !text-xs !font-semibold" @click="openDeleteConfirm(p)">
                Hapus
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span class="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          Menampilkan {{ paginatedPayments.length }} dari {{ filteredPayments.length }} transaksi
        </span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredPayments.length"
          layout="prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailVisible"
      title="Rincian Transaksi Kas"
      width="92%"
      class="!max-w-[520px] !rounded-2xl"
      destroy-on-close
    >
      <div v-if="activePayment" class="space-y-3.5 text-xs">
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Nama Mahasiswa</span>
          <span class="font-bold text-slate-900 dark:text-slate-100">{{ activePayment.namaLengkap }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">NIM</span>
          <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ activePayment.nim }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Tanggal Pembayaran</span>
          <span class="font-semibold text-emerald-700 dark:text-emerald-400">{{ formatIndonesianDateTime(activePayment.createdAt) }}</span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Metode Pembayaran</span>
          <div class="flex items-center gap-1.5">
            <el-tag v-if="activePayment.nominalDariTabungan > 0" size="small" type="warning" effect="dark" class="!font-bold">
              Tabungan
            </el-tag>
            <el-tag size="small" :type="activePayment.tipePembayaran === 'TRANSFER' ? 'primary' : 'success'">
              {{ activePayment.tipePembayaran }}
            </el-tag>
          </div>
        </div>

        <!-- Daftar Pertemuan yang Dibayar -->
        <div class="py-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 dark:text-slate-200">Rincian Pertemuan yang Dibayar:</span>
            <el-tag size="small" type="success" effect="plain" class="!font-bold">
              {{ activePayment.jumlahPertemuan }} Pertemuan
            </el-tag>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="m in getMeetingDetails(activePayment)"
              :key="m.id || m.nomor"
              class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
            >
              <div class="flex items-center gap-2">
                <el-tag size="small" type="success" effect="dark" class="!font-bold !rounded-lg text-[10px]">
                  Pertemuan {{ m.nomor }}
                </el-tag>
                <span class="text-slate-600 dark:text-slate-300 text-[11px]">
                  📅 {{ m.tanggal }}
                </span>
              </div>
              <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                {{ formatRupiah(m.tarif) }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Total Masuk Kas Kelas</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(activePayment.totalMasukKas) }}</span>
        </div>

        <div v-if="activePayment.nominalDariTabungan > 0" class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-amber-700 dark:text-amber-400">
          <span>Dipotong Dari Saldo Tabungan</span>
          <span class="font-bold font-mono">- {{ formatRupiah(activePayment.nominalDariTabungan) }}</span>
        </div>

        <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Kelebihan Masuk Tabungan</span>
          <span class="font-bold text-amber-600 dark:text-amber-400 font-mono">{{ formatRupiah(activePayment.totalMasukTabungan) }}</span>
        </div>

        <div class="flex justify-between py-2 border-t border-slate-200 dark:border-slate-700 text-sm">
          <span class="font-bold text-slate-900 dark:text-slate-100">Total Uang Disetor (Tunai/Transfer)</span>
          <span class="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-base">{{ formatRupiah(activePayment.nominalPembayaran) }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <el-button
            type="danger"
            plain
            class="!rounded-xl w-full sm:w-auto"
            @click="detailVisible = false; openDeleteConfirm(activePayment)"
          >
            <el-icon class="mr-1"><Delete /></el-icon> Hapus Transaksi Ini
          </el-button>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <el-button
              type="warning"
              class="!rounded-xl w-full sm:w-auto !font-semibold"
              @click="detailVisible = false; openDeleteConfirm(activePayment, true)"
            >
              <el-icon class="mr-1"><RefreshRight /></el-icon> Batal & Input Ulang
            </el-button>
            <el-button class="!rounded-xl w-full sm:w-auto" @click="detailVisible = false">
              Tutup
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog Konfirmasi Pembatalan / Hapus Transaksi -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="Batalkan / Hapus Transaksi Kas"
      width="92%"
      class="!max-w-[500px] !rounded-2xl"
      destroy-on-close
    >
      <div v-if="paymentToDelete" class="space-y-4">
        <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <el-icon class="text-amber-600 shrink-0 mt-0.5" :size="18"><WarningFilled /></el-icon>
          <div>
            <p class="font-bold">Apakah Anda yakin ingin membatalkan transaksi ini?</p>
            <p class="mt-0.5 text-amber-800/80 dark:text-amber-300/80">
              Pertemuan yang sebelumnya ditandai lunas akan kembali menjadi <strong>Belum Lunas</strong> sehingga dapat diinput ulang dengan benar.
            </p>
          </div>
        </div>

        <!-- Detail Mahasiswa & Transaksi -->
        <div class="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Mahasiswa:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">{{ paymentToDelete.namaLengkap }} ({{ paymentToDelete.nim }})</span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-slate-500 dark:text-slate-400">Pertemuan Dibayar:</span>
            <div class="flex flex-wrap gap-1 justify-end">
              <el-tag
                v-for="m in getMeetingDetails(paymentToDelete)"
                :key="m.id || m.nomor"
                size="small"
                type="info"
                class="!font-bold !text-[10px]"
              >
                Ptm {{ m.nomor }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- Efek Penyesuaian Saldo Otomatis -->
        <div class="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 space-y-2 text-xs">
          <span class="font-bold text-rose-800 dark:text-rose-300 block uppercase tracking-wider text-[10px]">
            Penyesuaian Saldo Otomatis (Rollback)
          </span>

          <div class="flex justify-between items-center text-rose-700 dark:text-rose-300">
            <span>Kas Kelas Berkurang:</span>
            <span class="font-bold font-mono">- {{ formatRupiah(paymentToDelete.totalMasukKas) }}</span>
          </div>

          <div v-if="paymentToDelete.nominalDariTabungan > 0" class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-semibold">
            <span>Saldo Tabungan Dikembalikan ke Mahasiswa:</span>
            <span class="font-bold font-mono">+ {{ formatRupiah(paymentToDelete.nominalDariTabungan) }}</span>
          </div>

          <div v-if="paymentToDelete.totalMasukTabungan > 0" class="flex justify-between items-center text-amber-700 dark:text-amber-400">
            <span>Kelebihan Tabungan Ditarik Kembali:</span>
            <span class="font-bold font-mono">- {{ formatRupiah(paymentToDelete.totalMasukTabungan) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <el-button class="w-full sm:w-auto !rounded-xl" @click="deleteDialogVisible = false" :disabled="isDeleting">
            Batal
          </el-button>

          <el-button
            type="danger"
            class="w-full sm:w-auto !rounded-xl !font-semibold"
            :loading="isDeleting && !redirectAfterDelete"
            :disabled="isDeleting"
            @click="executeDelete(false)"
          >
            <el-icon class="mr-1"><Delete /></el-icon> Hapus Transaksi
          </el-button>

          <el-button
            type="warning"
            class="w-full sm:w-auto !rounded-xl !font-semibold"
            :loading="isDeleting && redirectAfterDelete"
            :disabled="isDeleting"
            @click="executeDelete(true)"
          >
            <el-icon class="mr-1"><RefreshRight /></el-icon> Hapus & Input Ulang
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { paymentService } from '../../services/paymentService.js';
import { meetingService } from '../../services/meetingService.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate, formatIndonesianDateTime } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Plus, Search, Delete, RefreshRight, WarningFilled } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const paymentsList = ref([]);
const meetingsMap = ref(new Map());
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const detailVisible = ref(false);
const activePayment = ref(null);

const deleteDialogVisible = ref(false);
const paymentToDelete = ref(null);
const isDeleting = ref(false);
const redirectAfterDelete = ref(false);

onMounted(async () => {
  await loadPayments();
});

async function loadPayments() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    const [payments, meetings] = await Promise.all([
      paymentService.getPaymentsByClass(classId),
      meetingService.getMeetingsByClass(classId)
    ]);
    paymentsList.value = payments || [];

    const map = new Map();
    (meetings || []).forEach(m => {
      map.set(m.id, m);
    });
    meetingsMap.value = map;
  } catch (err) {
    ElMessage.error('Gagal memuat histori pembayaran: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function getMeetingDetails(payment) {
  if (!payment) return [];
  if (!payment.meetingIds || !Array.isArray(payment.meetingIds) || payment.meetingIds.length === 0) {
    return [];
  }

  const details = [];
  payment.meetingIds.forEach((id, idx) => {
    const m = meetingsMap.value.get(id);
    if (m) {
      details.push({
        id: m.id,
        nomor: m.nomorPertemuan,
        tanggal: m.tanggalPertemuan ? formatIndonesianDate(m.tanggalPertemuan) : '-',
        tarif: m.tarifKas || 7000,
        semester: m.semester || ''
      });
    } else {
      details.push({
        id,
        nomor: idx + 1,
        tanggal: '-',
        tarif: payment.tarifKas || 7000,
        semester: payment.semester || ''
      });
    }
  });

  return details.sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0));
}

function getMeetingDatesSummary(payment) {
  const details = getMeetingDetails(payment);
  const validDates = details.map(d => d.tanggal).filter(t => t && t !== '-');
  if (validDates.length === 0) return '';
  return validDates.join(', ');
}

const filteredPayments = computed(() => {
  if (!searchQuery.value.trim()) return paymentsList.value;
  const q = searchQuery.value.toLowerCase();
  return paymentsList.value.filter(p =>
    (p.namaLengkap || '').toLowerCase().includes(q) ||
    (p.nim || '').toLowerCase().includes(q)
  );
});

const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredPayments.value.slice(start, start + pageSize.value);
});

function openDetail(payment) {
  activePayment.value = payment;
  detailVisible.value = true;
}

function openDeleteConfirm(payment, shouldRedirect = false) {
  paymentToDelete.value = payment;
  redirectAfterDelete.value = shouldRedirect;
  deleteDialogVisible.value = true;
}

async function executeDelete(shouldRedirect = false) {
  if (!paymentToDelete.value) return;
  const target = paymentToDelete.value;
  isDeleting.value = true;
  redirectAfterDelete.value = shouldRedirect;

  try {
    await paymentService.deletePayment(
      target.id,
      authStore.userProfile?.namaLengkap || authStore.user?.email || 'admin'
    );

    const rollbackNotif = target.nominalDariTabungan > 0
      ? ` Tabungan Rp ${formatRupiah(target.nominalDariTabungan)} telah dikembalikan ke saldo mahasiswa.`
      : '';

    ElMessage.success({
      message: `Transaksi pembayaran ${target.namaLengkap} berhasil dibatalkan. Saldo kas disesuaikan (-${formatRupiah(target.totalMasukKas)}).${rollbackNotif}`,
      duration: 5000
    });

    deleteDialogVisible.value = false;

    if (shouldRedirect) {
      router.push({
        path: '/admin/payments/create',
        query: { studentId: target.userId }
      });
    } else {
      await loadPayments();
    }
  } catch (err) {
    ElMessage.error('Gagal membatalkan transaksi: ' + (err.message || 'Terjadi kesalahan sistem.'));
  } finally {
    isDeleting.value = false;
  }
}
</script>

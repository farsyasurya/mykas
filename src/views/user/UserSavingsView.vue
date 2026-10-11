<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Tabungan Mahasiswa</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Riwayat alokasi kelebihan setoran kas dan pengembalian dana tabungan pribadi Anda.
        </p>
      </div>
    </div>

    <!-- Savings Balance Hero Card -->
    <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div>
        <p class="text-amber-100 text-xs font-semibold uppercase tracking-wider">Saldo Tabungan Anda Saat Ini</p>
        <h2 class="text-3xl sm:text-4xl font-black mt-1">{{ formatRupiah(authStore.userProfile?.tabungan || 0) }}</h2>
        <p class="text-xs text-amber-100/90 mt-1">
          Saldo ini disimpan aman oleh admin kelas dan dapat dikembalikan kapan saja kepada Anda.
        </p>
      </div>

      <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-xs text-white">
        Total Transaksi Tabungan: <strong>{{ transactions.length }} Catatan</strong>
      </div>
    </div>

    <!-- Transactions History Table & Mobile Cards -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Riwayat Perubahan Tabungan</h3>

      <!-- Desktop Table -->
      <div class="hidden sm:block">
        <el-table :data="transactions" v-loading="loading" style="width: 100%" empty-text="Belum ada riwayat mutasi tabungan">
          <el-table-column label="Waktu Transaksi" min-width="160">
            <template #default="{ row }">
              <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs">{{ formatIndonesianDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Jenis Mutasi" width="160" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.type === 'DEPOSIT' ? 'success' : (row.type === 'WITHDRAWAL' ? 'warning' : 'info')"
                size="small"
                class="!font-bold"
              >
                {{ row.type === 'DEPOSIT' ? 'KELEBIHAN KAS (+)' : (row.type === 'WITHDRAWAL' ? 'PENGEMBALIAN (-)' : 'PENYESUAIAN') }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="deskripsi" label="Keterangan / Alasan" min-width="200">
            <template #default="{ row }">
              <span class="text-xs text-slate-700 dark:text-slate-300">{{ row.deskripsi || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Nominal" width="140" align="right">
            <template #default="{ row }">
              <span
                class="font-extrabold text-sm font-mono"
                :class="row.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
              >
                {{ row.type === 'DEPOSIT' ? '+' : '-' }} {{ formatRupiah(row.nominal) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards -->
      <div class="block sm:hidden space-y-3">
        <div
          v-for="item in transactions"
          :key="item.id || item.createdAt"
          class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <el-tag
              :type="item.type === 'DEPOSIT' ? 'success' : (item.type === 'WITHDRAWAL' ? 'warning' : 'info')"
              size="small"
              class="!font-bold"
            >
              {{ item.type === 'DEPOSIT' ? 'KELEBIHAN (+)' : (item.type === 'WITHDRAWAL' ? 'PENGEMBALIAN (-)' : 'PENYESUAIAN') }}
            </el-tag>
            <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {{ formatIndonesianDateTime(item.createdAt) }}
            </span>
          </div>

          <p class="text-xs text-slate-700 dark:text-slate-300">{{ item.deskripsi || '-' }}</p>

          <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span
              class="font-extrabold text-sm font-mono"
              :class="item.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
            >
              {{ item.type === 'DEPOSIT' ? '+' : '-' }} {{ formatRupiah(item.nominal) }}
            </span>
            <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold" @click="openTxDetail(item)">
              Detail
            </el-button>
          </div>
        </div>

        <div v-if="!transactions.length && !loading" class="text-center py-8 text-xs text-slate-400">
          Belum ada riwayat mutasi tabungan
        </div>
      </div>
    </div>

    <!-- Mobile Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Mutasi Tabungan"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedTx" class="space-y-4">
        <div class="p-3.5 rounded-xl border flex items-center justify-between"
             :class="selectedTx.type === 'DEPOSIT' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'">
          <div>
            <span class="text-[11px] font-semibold uppercase tracking-wider block"
                  :class="selectedTx.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
              {{ selectedTx.type === 'DEPOSIT' ? 'Pemasukan Tabungan' : 'Pengembalian Dana' }}
            </span>
            <span class="text-xl font-black font-mono"
                  :class="selectedTx.type === 'DEPOSIT' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'">
              {{ selectedTx.type === 'DEPOSIT' ? '+' : '-' }} {{ formatRupiah(selectedTx.nominal) }}
            </span>
          </div>
          <el-tag :type="selectedTx.type === 'DEPOSIT' ? 'success' : 'warning'" size="small" class="!font-bold">
            {{ selectedTx.type }}
          </el-tag>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Waktu Transaksi</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDateTime(selectedTx.createdAt) }}</span>
          </div>
          <div class="pt-1">
            <span class="text-slate-400 block mb-1">Keterangan / Alasan:</span>
            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              {{ selectedTx.deskripsi || 'Tidak ada catatan keterangan' }}
            </div>
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
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { savingsService } from '../../services/savingsService.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDateTime } from '../../utils/date.js';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const loading = ref(false);
const transactions = ref([]);

const detailDialogVisible = ref(false);
const selectedTx = ref(null);

function openTxDetail(item) {
  selectedTx.value = item;
  detailDialogVisible.value = true;
}

onMounted(async () => {
  const userId = authStore.user?.uid;
  if (!userId) return;

  loading.value = true;
  try {
    transactions.value = await savingsService.getTransactionsByUser(userId);
  } catch (err) {
    ElMessage.error('Gagal memuat histori tabungan: ' + err.message);
  } finally {
    loading.value = false;
  }
});
</script>

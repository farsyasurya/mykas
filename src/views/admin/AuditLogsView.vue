<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Audit Trail & Log Aktivitas</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Catatan riwayat transaksi keuangan dan perubahan hak akses yang tidak dapat diubah (immutable).
        </p>
      </div>

      <el-button class="!rounded-xl dark:!border-slate-700 text-slate-700 dark:text-slate-300" :loading="loading" @click="loadLogs">
        <el-icon class="mr-1"><Refresh /></el-icon> Segarkan Log
      </el-button>
    </div>

    <!-- Table of Audit Logs -->
    <!-- Table & Mobile Cards of Audit Logs -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table -->
      <div class="hidden md:block">
        <el-table :data="logsList" v-loading="loading" style="width: 100%" empty-text="Belum ada catatan audit">
          <el-table-column label="Waktu" width="170">
            <template #default="{ row }">
              <span class="font-mono text-xs text-slate-800 dark:text-slate-200">{{ formatIndonesianDateTime(row.createdAt || row.timestamp) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="action" label="Aksi Sistem" width="180">
            <template #default="{ row }">
              <el-tag :type="getActionTagType(row.action)" size="small" class="!font-bold">
                {{ row.action }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Rincian / Parameter" min-width="260">
            <template #default="{ row }">
              <div class="text-xs text-slate-700 dark:text-slate-300">
                <span v-if="row.details">{{ row.details }}</span>
                <span v-else-if="row.action === 'PAYMENT_RECORDED'">
                  Pembayaran kas: {{ formatRupiah(row.nominal) }} (Kas: {{ formatRupiah(row.masukKas) }}, Tabungan: {{ formatRupiah(row.masukTabungan) }})
                </span>
                <span v-else-if="row.action === 'SAVINGS_REFUNDED'">
                  Pengembalian tabungan mahasiswa sebesar {{ formatRupiah(row.nominal) }}
                </span>
                <span v-else-if="row.action === 'EXPENSE_RECORDED'">
                  Pencatatan pengeluaran "{{ row.judul }}" sebesar {{ formatRupiah(row.nominal) }}
                </span>
                <span v-else-if="row.action === 'OTHER_INCOME_RECORDED'">
                  Pemasukan lain "{{ row.judul }}" sebesar {{ formatRupiah(row.nominal) }}
                </span>
                <span v-else-if="row.action === 'CANCEL_MEETING'">
                  Pembatalan Pertemuan: "{{ row.reason }}"
                </span>
                <span v-else-if="row.action === 'USER_REGISTERED'">
                  Pendaftaran mahasiswa: {{ row.namaLengkap }} (NIM: {{ row.nim }})
                </span>
                <span v-else>
                  {{ JSON.stringify(row) }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Pelaku" width="160">
            <template #default="{ row }">
              <span class="font-mono text-xs text-slate-500 truncate block">
                UID: {{ (row.performedBy || row.userId || 'system')?.substring(0, 10) }}...
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards -->
      <div class="block md:hidden space-y-3">
        <div
          v-for="item in logsList"
          :key="item.id || item.timestamp"
          class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <el-tag :type="getActionTagType(item.action)" size="small" class="!font-bold">
              {{ item.action }}
            </el-tag>
            <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {{ formatIndonesianDateTime(item.createdAt || item.timestamp) }}
            </span>
          </div>

          <div class="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
            <span v-if="item.details">{{ item.details }}</span>
            <span v-else-if="item.action === 'PAYMENT_RECORDED'">
              Pembayaran kas: {{ formatRupiah(item.nominal) }} (Kas: {{ formatRupiah(item.masukKas) }}, Tabungan: {{ formatRupiah(item.masukTabungan) }})
            </span>
            <span v-else-if="item.action === 'SAVINGS_REFUNDED'">
              Pengembalian tabungan: {{ formatRupiah(item.nominal) }}
            </span>
            <span v-else-if="item.action === 'EXPENSE_RECORDED'">
              Pengeluaran: "{{ item.judul }}" {{ formatRupiah(item.nominal) }}
            </span>
            <span v-else-if="item.action === 'OTHER_INCOME_RECORDED'">
              Pemasukan lain: "{{ item.judul }}" {{ formatRupiah(item.nominal) }}
            </span>
            <span v-else-if="item.action === 'CANCEL_MEETING'">
              Batal: "{{ item.reason }}"
            </span>
            <span v-else-if="item.action === 'USER_REGISTERED'">
              Daftar: {{ item.namaLengkap }} ({{ item.nim }})
            </span>
            <span v-else>
              {{ JSON.stringify(item) }}
            </span>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <span class="text-slate-400 font-mono text-[11px] truncate max-w-[170px]">
              By: {{ (item.performedBy || item.userId || 'system')?.substring(0, 10) }}...
            </span>
            <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold" @click="openLogDetail(item)">
              Detail
            </el-button>
          </div>
        </div>

        <div v-if="!logsList.length && !loading" class="text-center py-8 text-xs text-slate-400">
          Belum ada catatan audit
        </div>
      </div>
    </div>

    <!-- Mobile Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Audit Log"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedLog" class="space-y-4">
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <el-tag :type="getActionTagType(selectedLog.action)" size="small" class="!font-bold">
            {{ selectedLog.action }}
          </el-tag>
          <span class="text-xs font-mono text-slate-500">{{ formatIndonesianDateTime(selectedLog.createdAt || selectedLog.timestamp) }}</span>
        </div>

        <div class="space-y-2 text-xs">
          <div>
            <span class="text-slate-400 block mb-1">Rincian Peristiwa:</span>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 leading-relaxed break-words font-mono text-[11px]">
              <span v-if="selectedLog.details">{{ selectedLog.details }}</span>
              <span v-else-if="selectedLog.action === 'PAYMENT_RECORDED'">
                Pembayaran kas: {{ formatRupiah(selectedLog.nominal) }} (Kas: {{ formatRupiah(selectedLog.masukKas) }}, Tabungan: {{ formatRupiah(selectedLog.masukTabungan) }})
              </span>
              <span v-else-if="selectedLog.action === 'SAVINGS_REFUNDED'">
                Pengembalian tabungan mahasiswa sebesar {{ formatRupiah(selectedLog.nominal) }}
              </span>
              <span v-else-if="selectedLog.action === 'EXPENSE_RECORDED'">
                Pencatatan pengeluaran "{{ selectedLog.judul }}" sebesar {{ formatRupiah(selectedLog.nominal) }}
              </span>
              <span v-else-if="selectedLog.action === 'OTHER_INCOME_RECORDED'">
                Pemasukan lain "{{ selectedLog.judul }}" sebesar {{ formatRupiah(selectedLog.nominal) }}
              </span>
              <span v-else-if="selectedLog.action === 'CANCEL_MEETING'">
                Pembatalan Pertemuan: "{{ selectedLog.reason }}"
              </span>
              <span v-else-if="selectedLog.action === 'USER_REGISTERED'">
                Pendaftaran mahasiswa: {{ selectedLog.namaLengkap }} (NIM: {{ selectedLog.nim }})
              </span>
              <span v-else>
                {{ JSON.stringify(selectedLog, null, 2) }}
              </span>
            </div>
          </div>

          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">ID Pelaku</span>
            <span class="font-mono text-slate-700 dark:text-slate-300 break-all text-right">{{ selectedLog.performedBy || selectedLog.userId || 'system' }}</span>
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
import { auditService } from '../../services/auditService.js';
import { formatIndonesianDateTime } from '../../utils/date.js';
import { formatRupiah } from '../../utils/currency.js';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const logsList = ref([]);

const detailDialogVisible = ref(false);
const selectedLog = ref(null);

function openLogDetail(item) {
  selectedLog.value = item;
  detailDialogVisible.value = true;
}

onMounted(async () => {
  await loadLogs();
});

async function loadLogs() {
  loading.value = true;
  try {
    const classId = authStore.isSuperAdmin ? null : authStore.userClassId;
    logsList.value = await auditService.getAuditLogs(classId);
  } catch (err) {
    ElMessage.error('Gagal memuat audit log: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function getActionTagType(action) {
  if (!action) return 'info';
  if (action.includes('PAYMENT') || action.includes('INCOME')) return 'success';
  if (action.includes('EXPENSE') || action.includes('REFUND')) return 'warning';
  if (action.includes('CANCEL') || action.includes('DELETE')) return 'danger';
  if (action.includes('BOOTSTRAP') || action.includes('ADMIN')) return 'primary';
  return 'info';
}
</script>

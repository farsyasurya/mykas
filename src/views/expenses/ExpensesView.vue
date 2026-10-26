<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Catatan Pengeluaran Kas</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Pengeluaran operasional kelas untuk konsumsi, perlengkapan, dan kegiatan.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="Filter Bulan"
          format="MM-YYYY"
          value-format="MM-YYYY"
          :clearable="true"
          class="!w-40"
        />

        <el-button
          type="primary"
          class="!rounded-xl !bg-rose-600 hover:!bg-rose-700 !border-none !font-semibold shadow-sm shadow-rose-600/20"
          @click="openAddDialog"
        >
          <el-icon class="mr-1"><Plus /></el-icon> Catat Pengeluaran
        </el-button>
      </div>
    </div>

    <!-- Total In Period Card -->
    <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-5 flex items-center justify-between transition-colors">
      <div>
        <span class="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Total Pengeluaran (Tercatat)</span>
        <h2 class="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5">{{ formatRupiah(totalFilteredExpense) }}</h2>
      </div>
      <div class="text-xs text-rose-600 dark:text-rose-400 font-medium">
        {{ filteredExpenses.length }} Transaksi
      </div>
    </div>

    <!-- Expenses Table & Mobile Cards -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table -->
      <div class="hidden md:block">
        <el-table :data="paginatedExpenses" v-loading="loading" style="width: 100%">
          <el-table-column prop="tanggalPengeluaran" label="Tanggal" width="150">
            <template #default="{ row }">
              <span class="font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(row.tanggalPengeluaran) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="kategori" label="Kategori" width="160">
            <template #default="{ row }">
              <el-tag size="small" type="danger" effect="light" class="!font-semibold">
                {{ row.kategori }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="judul" label="Keperluan / Judul" min-width="180">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.judul }}</div>
              <div v-if="row.deskripsi" class="text-xs text-slate-400 mt-0.5">{{ row.deskripsi }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="nominal" label="Nominal" width="140" align="right">
            <template #default="{ row }">
              <span class="font-extrabold text-rose-600">{{ formatRupiah(row.nominal) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Aksi" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="danger" plain @click="handleDeleteExpense(row)">
                Hapus
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards -->
      <div class="block md:hidden space-y-3">
        <div
          v-for="item in paginatedExpenses"
          :key="item.id"
          class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <el-tag size="small" type="danger" effect="light" class="!font-semibold">
              {{ item.kategori }}
            </el-tag>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {{ formatIndonesianDate(item.tanggalPengeluaran) }}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{{ item.judul }}</h4>
            <p v-if="item.deskripsi" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{{ item.deskripsi }}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span class="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-sm">
              {{ formatRupiah(item.nominal) }}
            </span>
            <div class="flex items-center gap-1.5">
              <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold" @click="openExpenseDetail(item)">
                Detail
              </el-button>
              <el-button size="small" type="danger" plain class="!rounded-lg !text-xs" @click="handleDeleteExpense(item)">
                Hapus
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="!paginatedExpenses.length && !loading" class="text-center py-8 text-xs text-slate-400">
          Belum ada catatan pengeluaran
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span class="text-xs text-slate-500">
          Menampilkan {{ paginatedExpenses.length }} dari {{ filteredExpenses.length }} pengeluaran
        </span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredExpenses.length"
          layout="prev, pager, next"
          background
          class="!flex-wrap"
        />
      </div>
    </div>

    <!-- Mobile Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Pengeluaran"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedExpense" class="space-y-4">
        <div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div>
            <span class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider block">Nominal</span>
            <span class="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">{{ formatRupiah(selectedExpense.nominal) }}</span>
          </div>
          <el-tag size="small" type="danger" effect="light" class="!font-bold">
            {{ selectedExpense.kategori }}
          </el-tag>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Keperluan / Judul</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 text-right">{{ selectedExpense.judul }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Tanggal Pengeluaran</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(selectedExpense.tanggalPengeluaran) }}</span>
          </div>
          <div v-if="selectedExpense.deskripsi" class="pt-1">
            <span class="text-slate-400 block mb-1">Keterangan / Catatan:</span>
            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              {{ selectedExpense.deskripsi }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center gap-2">
          <el-button
            type="danger"
            plain
            class="!rounded-xl !text-xs !font-semibold"
            @click="detailDialogVisible = false; handleDeleteExpense(selectedExpense)"
          >
            Hapus Pengeluaran
          </el-button>
          <el-button @click="detailDialogVisible = false" class="!flex-1 !rounded-xl !font-semibold">Tutup</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog Add Expense -->
    <el-dialog
      v-model="addDialogVisible"
      title="Catat Pengeluaran Operasional Kas"
      width="92%"
      class="!max-w-lg !rounded-2xl"
      destroy-on-close
    >
      <el-form :model="addForm" label-position="top">
        <el-form-item label="Judul / Keperluan" required>
          <el-input v-model="addForm.judul" placeholder="Contoh: Beli Spidol & Penghapus Whiteboard" />
        </el-form-item>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <el-form-item label="Kategori" required>
            <el-select v-model="addForm.kategori" class="w-full">
              <el-option label="Konsumsi" value="Konsumsi" />
              <el-option label="Perlengkapan kelas" value="Perlengkapan kelas" />
              <el-option label="Kegiatan mahasiswa" value="Kegiatan mahasiswa" />
              <el-option label="Administrasi" value="Administrasi" />
              <el-option label="Lainnya" value="Lainnya" />
            </el-select>
          </el-form-item>

          <el-form-item label="Tanggal Pengeluaran" required>
            <el-date-picker
              v-model="addForm.tanggalPengeluaran"
              type="date"
              format="DD MMMM YYYY"
              value-format="YYYY-MM-DD"
              class="!w-full"
            />
          </el-form-item>
        </div>

        <el-form-item label="Nominal Pengeluaran (Rp)" required>
          <el-input-number
            v-model="addForm.nominal"
            :min="1000"
            :step="5000"
            :formatter="rupiahInputFormatter"
            :parser="rupiahInputParser"
            class="!w-full"
          />
          <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Nominal terbaca: <strong class="text-rose-600 dark:text-rose-400 font-mono">{{ formatRupiah(addForm.nominal || 0) }}</strong>
          </span>
        </el-form-item>

        <el-form-item label="Deskripsi Tambahan">
          <el-input v-model="addForm.deskripsi" type="textarea" rows="2" placeholder="Keterangan rincian nota..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="handleCreateExpense" class="!bg-rose-600 !border-none">
            Simpan Pengeluaran
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { expenseService } from '../../services/expenseService.js';
import { formatRupiah, rupiahInputFormatter, rupiahInputParser } from '../../utils/currency.js';
import { formatIndonesianDate } from '../../utils/date.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const expensesList = ref([]);
const selectedMonth = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const detailDialogVisible = ref(false);
const selectedExpense = ref(null);

function openExpenseDetail(item) {
  selectedExpense.value = item;
  detailDialogVisible.value = true;
}

const addDialogVisible = ref(false);
const addForm = reactive({
  judul: '',
  kategori: 'Perlengkapan kelas',
  tanggalPengeluaran: new Date().toISOString().split('T')[0],
  nominal: 20000,
  deskripsi: '',
  buktiUrl: ''
});

onMounted(async () => {
  await loadExpenses();
});

async function loadExpenses() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    expensesList.value = await expenseService.getExpensesByClass(classId);
  } catch (err) {
    ElMessage.error('Gagal memuat catatan pengeluaran: ' + err.message);
  } finally {
    loading.value = false;
  }
}

const filteredExpenses = computed(() => {
  if (!selectedMonth.value) return expensesList.value;
  const [m, y] = selectedMonth.value.split('-');
  return expensesList.value.filter(exp => {
    if (!exp.tanggalPengeluaran) return false;
    const parts = exp.tanggalPengeluaran.split('-');
    return parts[0] === y && parts[1] === m;
  });
});

const totalFilteredExpense = computed(() => {
  return filteredExpenses.value.reduce((acc, exp) => acc + (Number(exp.nominal) || 0), 0);
});

const paginatedExpenses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredExpenses.value.slice(start, start + pageSize.value);
});

function openAddDialog() {
  addForm.judul = '';
  addForm.kategori = 'Perlengkapan kelas';
  addForm.tanggalPengeluaran = new Date().toISOString().split('T')[0];
  addForm.nominal = 25000;
  addForm.deskripsi = '';
  addDialogVisible.value = true;
}

async function handleCreateExpense() {
  if (!addForm.judul.trim() || !addForm.tanggalPengeluaran || addForm.nominal <= 0) {
    ElMessage.warning('Lengkapi data pengeluaran dengan benar');
    return;
  }

  saving.value = true;
  try {
    await expenseService.createExpense({
      kelasId: authStore.userClassId,
      judul: addForm.judul,
      kategori: addForm.kategori,
      deskripsi: addForm.deskripsi,
      nominal: addForm.nominal,
      tanggalPengeluaran: addForm.tanggalPengeluaran,
      createdBy: authStore.user?.uid
    });
    ElMessage.success('Pengeluaran berhasil dicatat!');
    addDialogVisible.value = false;
    await loadExpenses();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal menyimpan pengeluaran');
  } finally {
    saving.value = false;
  }
}

async function handleDeleteExpense(expense) {
  try {
    await ElMessageBox.confirm(
      `Apakah Anda yakin ingin menghapus pengeluaran "${expense.judul}" sebesar ${formatRupiah(expense.nominal)}? Saldo kas kelas akan dikembalikan secara otomatis.`,
      'Konfirmasi Hapus Pengeluaran',
      { confirmButtonText: 'Hapus', cancelButtonText: 'Batal', type: 'warning' }
    );

    await expenseService.deleteExpense(expense.id, authStore.user?.uid);
    ElMessage.success('Pengeluaran berhasil dihapus dan saldo kelas dipulihkan!');
    await loadExpenses();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal menghapus pengeluaran');
    }
  }
}
</script>

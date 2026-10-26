<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Pemasukan Kas Non-Rutin</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Pemasukan lain seperti sumbangan sukarela, hasil jualan dana usaha, atau sponsor.</p>
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
          class="!rounded-xl !bg-blue-600 hover:!bg-blue-700 !border-none !font-semibold shadow-sm shadow-blue-600/20"
          @click="openAddDialog"
        >
          <el-icon class="mr-1"><Plus /></el-icon> Catat Pemasukan Lain
        </el-button>
      </div>
    </div>

    <!-- Total Banner -->
    <div class="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-3xl p-5 flex items-center justify-between transition-colors">
      <div>
        <span class="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Total Pemasukan Non-Rutin</span>
        <h2 class="text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5">{{ formatRupiah(totalFilteredIncome) }}</h2>
      </div>
      <div class="text-xs text-blue-600 dark:text-blue-400 font-medium">
        {{ filteredIncomes.length }} Transaksi
      </div>
    </div>

    <!-- Incomes Table & Mobile Cards -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 transition-colors">
      <!-- Desktop Table -->
      <div class="hidden md:block">
        <el-table :data="paginatedIncomes" v-loading="loading" style="width: 100%">
          <el-table-column prop="tanggalPemasukan" label="Tanggal" width="150">
            <template #default="{ row }">
              <span class="font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(row.tanggalPemasukan) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="sumberPemasukan" label="Sumber / Pihak" width="160">
            <template #default="{ row }">
              <el-tag size="small" type="primary" effect="light" class="!font-semibold">
                {{ row.sumberPemasukan || 'Donasi' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="judul" label="Judul / Keterangan" min-width="180">
            <template #default="{ row }">
              <div class="font-bold text-slate-900 dark:text-slate-100">{{ row.judul }}</div>
              <div v-if="row.deskripsi" class="text-xs text-slate-400 mt-0.5">{{ row.deskripsi }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="nominal" label="Nominal" width="140" align="right">
            <template #default="{ row }">
              <span class="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{{ formatRupiah(row.nominal) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Aksi" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="danger" plain @click="handleDeleteIncome(row)">
                Hapus
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards -->
      <div class="block md:hidden space-y-3">
        <div
          v-for="item in paginatedIncomes"
          :key="item.id"
          class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <el-tag size="small" type="primary" effect="light" class="!font-semibold">
              {{ item.sumberPemasukan || 'Donasi' }}
            </el-tag>
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {{ formatIndonesianDate(item.tanggalPemasukan) }}
            </span>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{{ item.judul }}</h4>
            <p v-if="item.deskripsi" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{{ item.deskripsi }}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span class="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
              {{ formatRupiah(item.nominal) }}
            </span>
            <div class="flex items-center gap-1.5">
              <el-button size="small" plain class="!rounded-lg !text-xs !font-semibold" @click="openIncomeDetail(item)">
                Detail
              </el-button>
              <el-button size="small" type="danger" plain class="!rounded-lg !text-xs" @click="handleDeleteIncome(item)">
                Hapus
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="!paginatedIncomes.length && !loading" class="text-center py-8 text-xs text-slate-400">
          Belum ada catatan pemasukan non-rutin
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span class="text-xs text-slate-500">
          Menampilkan {{ paginatedIncomes.length }} dari {{ filteredIncomes.length }} pemasukan
        </span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredIncomes.length"
          layout="prev, pager, next"
          background
          class="!flex-wrap"
        />
      </div>
    </div>

    <!-- Mobile Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="Rincian Pemasukan Non-Rutin"
      width="92%"
      class="!max-w-md !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedIncome" class="space-y-4">
        <div class="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
          <div>
            <span class="text-[11px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider block">Nominal</span>
            <span class="text-xl font-black text-blue-700 dark:text-blue-300 font-mono">{{ formatRupiah(selectedIncome.nominal) }}</span>
          </div>
          <el-tag size="small" type="primary" effect="light" class="!font-bold">
            {{ selectedIncome.sumberPemasukan || 'Donasi' }}
          </el-tag>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Judul / Keterangan</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 text-right">{{ selectedIncome.judul }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span class="text-slate-400">Tanggal Pemasukan</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(selectedIncome.tanggalPemasukan) }}</span>
          </div>
          <div v-if="selectedIncome.deskripsi" class="pt-1">
            <span class="text-slate-400 block mb-1">Catatan Tambahan:</span>
            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              {{ selectedIncome.deskripsi }}
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
            @click="detailDialogVisible = false; handleDeleteIncome(selectedIncome)"
          >
            Hapus Pemasukan
          </el-button>
          <el-button @click="detailDialogVisible = false" class="!flex-1 !rounded-xl !font-semibold">Tutup</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Dialog Add Income -->
    <el-dialog
      v-model="addDialogVisible"
      title="Catat Pemasukan Kas Lain"
      width="92%"
      class="!max-w-lg !rounded-2xl"
      destroy-on-close
    >
      <el-form :model="addForm" label-position="top">
        <el-form-item label="Judul Pemasukan" required>
          <el-input v-model="addForm.judul" placeholder="Contoh: Keuntungan Penjualan Merchandise Kelas" />
        </el-form-item>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <el-form-item label="Sumber Pemasukan" required>
            <el-input v-model="addForm.sumberPemasukan" placeholder="Contoh: Dana Usaha / Donatur" />
          </el-form-item>

          <el-form-item label="Tanggal Pemasukan" required>
            <el-date-picker
              v-model="addForm.tanggalPemasukan"
              type="date"
              format="DD MMMM YYYY"
              value-format="YYYY-MM-DD"
              class="!w-full"
            />
          </el-form-item>
        </div>

        <el-form-item label="Nominal Pemasukan (Rp)" required>
          <el-input-number
            v-model="addForm.nominal"
            :min="1000"
            :step="10000"
            :formatter="rupiahInputFormatter"
            :parser="rupiahInputParser"
            class="!w-full"
          />
          <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Nominal terbaca: <strong class="text-blue-600 dark:text-blue-400 font-mono">{{ formatRupiah(addForm.nominal || 0) }}</strong>
          </span>
        </el-form-item>

        <el-form-item label="Deskripsi Tambahan">
          <el-input v-model="addForm.deskripsi" type="textarea" rows="2" placeholder="Catatan bukti transfer / donatur..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">Batal</el-button>
          <el-button type="primary" :loading="saving" @click="handleCreateIncome" class="!bg-blue-600 !border-none">
            Simpan Pemasukan
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { incomeService } from '../../services/incomeService.js';
import { formatRupiah, rupiahInputFormatter, rupiahInputParser } from '../../utils/currency.js';
import { formatIndonesianDate } from '../../utils/date.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const incomesList = ref([]);
const selectedMonth = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const detailDialogVisible = ref(false);
const selectedIncome = ref(null);

function openIncomeDetail(item) {
  selectedIncome.value = item;
  detailDialogVisible.value = true;
}

const addDialogVisible = ref(false);
const addForm = reactive({
  judul: '',
  sumberPemasukan: 'Dana Usaha',
  tanggalPemasukan: new Date().toISOString().split('T')[0],
  nominal: 50000,
  deskripsi: ''
});

onMounted(async () => {
  await loadIncomes();
});

async function loadIncomes() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    incomesList.value = await incomeService.getOtherIncomesByClass(classId);
  } catch (err) {
    ElMessage.error('Gagal memuat pemasukan lain: ' + err.message);
  } finally {
    loading.value = false;
  }
}

const filteredIncomes = computed(() => {
  if (!selectedMonth.value) return incomesList.value;
  const [m, y] = selectedMonth.value.split('-');
  return incomesList.value.filter(inc => {
    if (!inc.tanggalPemasukan) return false;
    const parts = inc.tanggalPemasukan.split('-');
    return parts[0] === y && parts[1] === m;
  });
});

const totalFilteredIncome = computed(() => {
  return filteredIncomes.value.reduce((acc, inc) => acc + (Number(inc.nominal) || 0), 0);
});

const paginatedIncomes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredIncomes.value.slice(start, start + pageSize.value);
});

function openAddDialog() {
  addForm.judul = '';
  addForm.sumberPemasukan = 'Donasi / Dana Usaha';
  addForm.tanggalPemasukan = new Date().toISOString().split('T')[0],
  addForm.nominal = 50000;
  addForm.deskripsi = '';
  addDialogVisible.value = true;
}

async function handleCreateIncome() {
  if (!addForm.judul.trim() || !addForm.tanggalPemasukan || addForm.nominal <= 0) {
    ElMessage.warning('Lengkapi data pemasukan');
    return;
  }

  saving.value = true;
  try {
    await incomeService.createOtherIncome({
      kelasId: authStore.userClassId,
      judul: addForm.judul,
      sumberPemasukan: addForm.sumberPemasukan,
      tanggalPemasukan: addForm.tanggalPemasukan,
      nominal: addForm.nominal,
      deskripsi: addForm.deskripsi,
      createdBy: authStore.user?.uid
    });
    ElMessage.success('Pemasukan non-rutin berhasil dicatat!');
    addDialogVisible.value = false;
    await loadIncomes();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal menyimpan pemasukan');
  } finally {
    saving.value = false;
  }
}

async function handleDeleteIncome(income) {
  try {
    await ElMessageBox.confirm(
      `Apakah Anda yakin ingin menghapus pemasukan "${income.judul}" sebesar ${formatRupiah(income.nominal)}? Saldo kas kelas akan disesuaikan kembali.`,
      'Konfirmasi Hapus Pemasukan',
      { confirmButtonText: 'Hapus', cancelButtonText: 'Batal', type: 'warning' }
    );

    await incomeService.deleteOtherIncome(income.id, authStore.user?.uid);
    ElMessage.success('Pemasukan berhasil dihapus dan saldo kas kelas diperbarui!');
    await loadIncomes();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal menghapus pemasukan');
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header & Filter -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Keuangan & Transaksi Kas</h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola mutasi pemasukan non-rutin, pengeluaran kelas, dan tabungan mahasiswa dalam satu tempat.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="Filter Bulan"
          format="MM-YYYY"
          value-format="MM-YYYY"
          :clearable="true"
          @change="loadAllFinancialData"
          class="w-full sm:!w-36"
        />

        <el-button
          type="primary"
          class="w-full sm:w-auto !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold shadow-sm shadow-emerald-600/20"
          @click="openAddTransactionDialog"
        >
          <el-icon class="mr-1"><Plus /></el-icon> Tambah Transaksi
        </el-button>
      </div>
    </div>

    <!-- 4 Balances Overview Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Saldo Kas Kelas -->
      <StatCard
        title="Saldo Kas Kelas"
        :value="formatRupiah(classSaldo)"
        subtitle="Saldo bersih siap digunakan"
        icon-bg-class="bg-emerald-600 shadow-emerald-500/20"
      >
        <template #icon><el-icon :size="22"><Wallet /></el-icon></template>
      </StatCard>

      <!-- 2. Total Tabungan Mahasiswa -->
      <StatCard
        title="Total Tabungan Mahasiswa"
        :value="formatRupiah(totalSavingsBalance)"
        subtitle="Dana titipan (Bukan kas kelas)"
        icon-bg-class="bg-amber-600 shadow-amber-500/20"
      >
        <template #icon><el-icon :size="22"><Coin /></el-icon></template>
      </StatCard>

      <!-- 3. Pemasukan Lain Periode Ini -->
      <StatCard
        title="Pemasukan Non-Rutin"
        :value="formatRupiah(totalPeriodIncome)"
        :subtitle="`${filteredIncomes.length} transaksi pemasukan`"
        icon-bg-class="bg-blue-600 shadow-blue-500/20"
      >
        <template #icon><el-icon :size="22"><Sell /></el-icon></template>
      </StatCard>

      <!-- 4. Pengeluaran Periode Ini -->
      <StatCard
        title="Pengeluaran Kelas"
        :value="formatRupiah(totalPeriodExpense)"
        :subtitle="`${filteredExpenses.length} transaksi pengeluaran`"
        icon-bg-class="bg-rose-600 shadow-rose-500/20"
      >
        <template #icon><el-icon :size="22"><SoldOut /></el-icon></template>
      </StatCard>
    </div>

    <!-- Main Navigation Tabs: Mutasi Transaksi & Tabungan Mahasiswa -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4 transition-colors">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <!-- Tab selector -->
        <el-radio-group v-model="activeTab" size="default">
          <el-radio-button value="transactions">
            <span class="flex items-center gap-1.5">
              <el-icon><Tickets /></el-icon> Mutasi Kas ({{ filteredCombinedTransactions.length }})
            </span>
          </el-radio-button>
          <el-radio-button value="savings">
            <span class="flex items-center gap-1.5">
              <el-icon><Coin /></el-icon> Tabungan Mahasiswa ({{ studentsWithSavings.length }})
            </span>
          </el-radio-button>
        </el-radio-group>

        <!-- Right Side Filter/Search depending on active tab -->
        <div class="flex items-center gap-2.5">
          <!-- Filter type for transactions tab -->
          <el-radio-group v-if="activeTab === 'transactions'" v-model="transactionFilterType" size="small">
            <el-radio-button value="ALL">Semua</el-radio-button>
            <el-radio-button value="EXPENSE">Pengeluaran</el-radio-button>
            <el-radio-button value="INCOME">Pemasukan Lain</el-radio-button>
          </el-radio-group>

          <!-- Search student for savings tab -->
          <el-input
            v-else
            v-model="searchStudentQuery"
            placeholder="Cari mahasiswa / NIM..."
            clearable
            size="small"
            class="!w-56"
            :prefix-icon="Search"
          />
        </div>
      </div>

      <!-- TAB 1: MUTASI TRANSAKSI (Pemasukan Non-Rutin & Pengeluaran) -->
      <div v-if="activeTab === 'transactions'">
        <!-- Desktop Table (md and above) -->
        <div class="hidden md:block">
          <el-table
            :data="filteredCombinedTransactions"
            v-loading="loading"
            style="width: 100%"
            empty-text="Belum ada transaksi pada periode ini"
          >
            <el-table-column label="Tanggal" width="130">
              <template #default="{ row }">
                <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs">{{ formatIndonesianDate(row.tanggal) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Tipe" width="140" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.type === 'EXPENSE' ? 'danger' : 'primary'"
                  effect="light"
                  class="!font-bold !rounded-md text-xs"
                >
                  {{ row.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan Lain' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Kategori / Sumber" width="150">
              <template #default="{ row }">
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">{{ row.kategori || row.sumberPemasukan || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Keperluan / Keterangan" min-width="200">
              <template #default="{ row }">
                <div class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{{ row.judul }}</div>
                <div v-if="row.deskripsi" class="text-[11px] text-slate-400 mt-0.5">{{ row.deskripsi }}</div>
              </template>
            </el-table-column>

            <el-table-column label="Nominal" width="140" align="right">
              <template #default="{ row }">
                <span
                  class="font-extrabold text-sm font-mono"
                  :class="row.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
                >
                  {{ row.type === 'EXPENSE' ? '-' : '+' }}{{ formatRupiah(row.nominal) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="Aksi" width="90" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="danger"
                  link
                  class="!text-xs !font-bold"
                  @click="handleDeleteTransaction(row)"
                >
                  Hapus
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile Cards (< md) -->
        <div class="block md:hidden space-y-3" v-loading="loading">
          <div v-if="filteredCombinedTransactions.length === 0" class="text-center py-8 text-xs text-slate-400">
            Belum ada transaksi pada periode ini
          </div>

          <div
            v-for="tx in filteredCombinedTransactions"
            :key="tx.id"
            class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shadow-xs space-y-2.5 transition-colors"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{{ tx.judul }}</h4>
                <p class="text-[11px] text-slate-400">{{ formatIndonesianDate(tx.tanggal) }} • {{ tx.kategori || tx.sumberPemasukan || '-' }}</p>
              </div>
              <el-tag
                :type="tx.type === 'EXPENSE' ? 'danger' : 'primary'"
                size="small"
                class="!font-bold shrink-0 text-[10px]"
              >
                {{ tx.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan' }}
              </el-tag>
            </div>

            <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span
                class="font-extrabold text-sm font-mono"
                :class="tx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
              >
                {{ tx.type === 'EXPENSE' ? '-' : '+' }}{{ formatRupiah(tx.nominal) }}
              </span>

              <div class="flex items-center gap-1.5">
                <el-button size="small" type="primary" plain class="!rounded-xl !text-xs !font-semibold" @click="openTxDetail(tx)">
                  Detail
                </el-button>
                <el-button size="small" type="danger" plain class="!rounded-xl !text-xs" @click="handleDeleteTransaction(tx)">
                  Hapus
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: TABUNGAN MAHASISWA -->
      <div v-else class="space-y-6">
        <!-- Desktop Table (md and above) -->
        <div class="hidden md:block">
          <el-table
            :data="filteredStudents"
            v-loading="loading"
            style="width: 100%"
            empty-text="Tidak ada mahasiswa yang memiliki saldo tabungan"
          >
            <el-table-column label="Mahasiswa" min-width="180">
              <template #default="{ row }">
                <div class="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{{ row.namaLengkap }}</div>
                <div class="text-[11px] text-slate-400">Panggilan: {{ row.namaPanggilan || '-' }}</div>
              </template>
            </el-table-column>

            <el-table-column prop="nim" label="NIM" width="130">
              <template #default="{ row }">
                <span class="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">{{ row.nim }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Saldo Tabungan" width="160" align="right">
              <template #default="{ row }">
                <span class="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm">
                  {{ formatRupiah(row.tabungan || 0) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="Aksi" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="warning"
                  plain
                  class="!rounded-lg !text-xs !font-semibold"
                  :disabled="!row.tabungan || row.tabungan <= 0"
                  @click="openRefundDialog(row)"
                >
                  Kembalikan Uang
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile Cards (< md) -->
        <div class="block md:hidden space-y-3" v-loading="loading">
          <div v-if="filteredStudents.length === 0" class="text-center py-8 text-xs text-slate-400">
            Tidak ada mahasiswa yang memiliki saldo tabungan
          </div>

          <div
            v-for="st in filteredStudents"
            :key="st.id"
            class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shadow-xs space-y-2.5 transition-colors"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{{ st.namaLengkap }}</h4>
                <p class="text-[11px] text-slate-400 font-mono">NIM: {{ st.nim }}</p>
              </div>
              <span class="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm shrink-0">
                {{ formatRupiah(st.tabungan || 0) }}
              </span>
            </div>

            <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
              <el-button
                size="small"
                type="warning"
                plain
                class="w-full !rounded-xl !text-xs !font-semibold"
                :disabled="!st.tabungan || st.tabungan <= 0"
                @click="openRefundDialog(st)"
              >
                Kembalikan Uang Tabungan
              </el-button>
            </div>
          </div>
        </div>

        <!-- Riwayat Penarikan Tabungan -->
        <div v-if="refundHistory.length > 0" class="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Riwayat Pengembalian Tabungan</h4>
          <div class="hidden sm:block">
            <el-table :data="refundHistory.slice(0, 10)" size="small" style="width: 100%">
              <el-table-column label="Waktu" width="130">
                <template #default="{ row }">
                  <span class="text-xs text-slate-600 dark:text-slate-400">{{ formatIndonesianDate(row.createdAt?.toDate ? row.createdAt.toDate() : row.createdAt) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Mahasiswa" min-width="160">
                <template #default="{ row }">
                  <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">{{ row.namaLengkap }}</div>
                  <div v-if="row.nim && row.nim !== '-'" class="text-[11px] font-mono text-slate-400">NIM: {{ row.nim }}</div>
                </template>
              </el-table-column>
              <el-table-column label="Keterangan" min-width="180">
                <template #default="{ row }">
                  <span class="text-xs text-slate-800 dark:text-slate-200">{{ row.deskripsi }}</span>
                </template>
              </el-table-column>
              <el-table-column label="Nominal Dikembalikan" width="160" align="right">
                <template #default="{ row }">
                  <span class="font-bold text-amber-600 font-mono text-xs">{{ formatRupiah(row.nominal) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="block sm:hidden space-y-2">
            <div
              v-for="rf in refundHistory.slice(0, 10)"
              :key="rf.id"
              class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
            >
              <div class="min-w-0">
                <p class="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {{ rf.namaLengkap }}
                  <span v-if="rf.nim && rf.nim !== '-'" class="text-[10px] text-slate-400 font-normal font-mono">({{ rf.nim }})</span>
                </p>
                <p class="text-slate-600 dark:text-slate-300 truncate mt-0.5">{{ rf.deskripsi }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{{ formatIndonesianDate(rf.createdAt?.toDate ? rf.createdAt.toDate() : rf.createdAt) }}</p>
              </div>
              <span class="font-bold text-amber-600 font-mono text-xs shrink-0 ml-2">{{ formatRupiah(rf.nominal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DIALOG: TAMBAH TRANSAKSI (Pengeluaran vs Pemasukan Lain vs Kembalikan Tabungan) -->
    <el-dialog
      v-model="addDialogVisible"
      title="Tambah Transaksi Keuangan"
      width="92%"
      class="!max-w-[540px] !rounded-2xl"
      destroy-on-close
    >
      <el-form label-position="top">
        <!-- Tipe Transaksi Switcher -->
        <el-form-item label="Pilih Tipe Transaksi" required>
          <div class="grid grid-cols-2 gap-3 w-full">
            <div
              @click="txForm.type = 'EXPENSE'"
              class="cursor-pointer p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all"
              :class="txForm.type === 'EXPENSE' ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'"
            >
              <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <el-icon><SoldOut /></el-icon>
              </div>
              <div>
                <div class="text-xs font-bold leading-tight">Pengeluaran Kelas</div>
                <div class="text-[10px] text-slate-400 font-normal">Kurangi saldo kas</div>
              </div>
            </div>

            <div
              @click="txForm.type = 'INCOME'"
              class="cursor-pointer p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all"
              :class="txForm.type === 'INCOME' ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'"
            >
              <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <el-icon><Sell /></el-icon>
              </div>
              <div>
                <div class="text-xs font-bold leading-tight">Pemasukan Lain</div>
                <div class="text-[10px] text-slate-400 font-normal">Tambah saldo kas</div>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- Form fields jika PENGELUARAN -->
        <template v-if="txForm.type === 'EXPENSE'">
          <el-form-item label="Kategori Pengeluaran" required>
            <el-select v-model="txForm.kategori" placeholder="Pilih kategori pengeluaran" class="w-full">
              <el-option label="Konsumsi & Makanan" value="Konsumsi & Makanan" />
              <el-option label="Perlengkapan & ATK" value="Perlengkapan & ATK" />
              <el-option label="Fotocopy / Print Materi" value="Fotocopy / Print Materi" />
              <el-option label="Acara / Kegiatan Kelas" value="Acara / Kegiatan Kelas" />
              <el-option label="Lainnya" value="Lainnya" />
            </el-select>
          </el-form-item>

          <el-form-item label="Keperluan / Judul" required>
            <el-input v-model="txForm.judul" placeholder="Contoh: Beli Spidol & Penghapus Whiteboard" />
          </el-form-item>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <el-form-item label="Nominal Pengeluaran (Rp)" required>
              <el-input-number v-model="txForm.nominal" :min="1000" :step="5000" class="!w-full" />
            </el-form-item>

            <el-form-item label="Tanggal Pengeluaran" required>
              <el-date-picker
                v-model="txForm.tanggal"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="!w-full"
              />
            </el-form-item>
          </div>

          <el-form-item label="Catatan / Deskripsi Tambahan">
            <el-input v-model="txForm.deskripsi" type="textarea" :rows="2" placeholder="Catatan opsional..." />
          </el-form-item>
        </template>

        <!-- Form fields jika PEMASUKAN LAIN -->
        <template v-else>
          <el-form-item label="Sumber Pemasukan" required>
            <el-select v-model="txForm.sumberPemasukan" placeholder="Pilih sumber pemasukan" class="w-full">
              <el-option label="Donasi / Sumbangan Sukarela" value="Donasi / Sumbangan Sukarela" />
              <el-option label="Dana Usaha Kelas" value="Dana Usaha Kelas" />
              <el-option label="Sponsor" value="Sponsor" />
              <el-option label="Sisa Anggaran Kegiatan" value="Sisa Anggaran Kegiatan" />
              <el-option label="Lainnya" value="Lainnya" />
            </el-select>
          </el-form-item>

          <el-form-item label="Judul / Keterangan" required>
            <el-input v-model="txForm.judul" placeholder="" />
          </el-form-item>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <el-form-item label="Nominal Pemasukan (Rp)" required>
              <el-input-number v-model="txForm.nominal" :min="1000" :step="10000" class="!w-full" />
            </el-form-item>

            <el-form-item label="Tanggal Pemasukan" required>
              <el-date-picker
                v-model="txForm.tanggal"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="!w-full"
              />
            </el-form-item>
          </div>

          <el-form-item label="Catatan Tambahan">
            <el-input v-model="txForm.deskripsi" type="textarea" :rows="2" placeholder="Catatan donatur / keterangan..." />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <el-button @click="addDialogVisible = false">Batal</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            :class="txForm.type === 'EXPENSE' ? '!bg-rose-600 hover:!bg-rose-700' : '!bg-blue-600 hover:!bg-blue-700'"
            class="!border-none !font-semibold !rounded-xl"
            @click="handleSaveTransaction"
          >
            Simpan Transaksi
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- DIALOG: REFUND TABUNGAN MAHASISWA -->
    <el-dialog
      v-model="refundDialogVisible"
      title="Pengembalian Uang Tabungan"
      width="92%"
      class="!max-w-[460px] !rounded-2xl"
      destroy-on-close
    >
      <div v-if="selectedStudentForRefund" class="space-y-4">
        <div class="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
          <p class="text-xs text-amber-800 dark:text-amber-300 font-medium">Mahasiswa:</p>
          <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ selectedStudentForRefund.namaLengkap }} ({{ selectedStudentForRefund.nim }})</p>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Saldo Tabungan Tersedia: <strong class="text-amber-700 dark:text-amber-400 font-mono">{{ formatRupiah(selectedStudentForRefund.tabungan || 0) }}</strong>
          </p>
        </div>

        <el-form label-position="top">
          <el-form-item label="Nominal Dikembalikan (Rp)" required>
            <el-input-number
              v-model="refundAmount"
              :min="1000"
              :max="selectedStudentForRefund.tabungan || 0"
              :step="5000"
              class="!w-full"
            />
          </el-form-item>

          <el-form-item label="Keterangan Pengembalian">
            <el-input v-model="refundNote" placeholder="Contoh: Pengembalian sisa tabungan kas" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <el-button @click="refundDialogVisible = false" class="!rounded-xl">Batal</el-button>
          <el-button
            type="warning"
            :loading="submitting"
            class="!font-semibold !rounded-xl"
            @click="handleConfirmRefund"
          >
            Kembalikan Saldo
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- DIALOG: DETAIL TRANSAKSI MUTASI (Mobile Detail Modal) -->
    <el-dialog
      v-model="txDetailDialogVisible"
      title="Rincian Transaksi Mutasi"
      width="92%"
      class="!max-w-[440px] !rounded-2xl"
    >
      <div v-if="selectedTx" class="space-y-3.5 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
          <div class="flex items-center justify-between gap-2">
            <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">{{ selectedTx.judul }}</h4>
            <el-tag
              :type="selectedTx.type === 'EXPENSE' ? 'danger' : 'primary'"
              size="small"
              class="!font-bold shrink-0"
            >
              {{ selectedTx.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan Lain' }}
            </el-tag>
          </div>
          <p class="text-slate-400 mt-1">{{ formatIndonesianDate(selectedTx.tanggal) }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500 dark:text-slate-400">Kategori / Sumber</span>
            <strong class="text-slate-800 dark:text-slate-200">{{ selectedTx.kategori || selectedTx.sumberPemasukan || '-' }}</strong>
          </div>
          <div v-if="selectedTx.deskripsi" class="p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500 dark:text-slate-400 block mb-0.5">Keterangan:</span>
            <p class="text-slate-800 dark:text-slate-200">{{ selectedTx.deskripsi }}</p>
          </div>
          <div class="flex justify-between p-2.5 rounded-xl border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
            <span class="text-slate-900 dark:text-slate-100">Nominal Transaksi</span>
            <span
              class="font-mono font-extrabold"
              :class="selectedTx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
            >
              {{ selectedTx.type === 'EXPENSE' ? '-' : '+' }}{{ formatRupiah(selectedTx.nominal) }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <el-button @click="txDetailDialogVisible = false" class="!rounded-xl">Tutup</el-button>
          <el-button
            type="danger"
            plain
            class="!rounded-xl"
            @click="txDetailDialogVisible = false; handleDeleteTransaction(selectedTx)"
          >
            Hapus Transaksi
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { classService } from '../../services/classService.js';
import { expenseService } from '../../services/expenseService.js';
import { incomeService } from '../../services/incomeService.js';
import { savingsService } from '../../services/savingsService.js';
import { userService } from '../../services/userService.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate, getCurrentMonthYear } from '../../utils/date.js';
import StatCard from '../../components/dashboard/StatCard.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Wallet,
  Coin,
  Sell,
  SoldOut,
  Tickets,
  Search
} from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const submitting = ref(false);

const txDetailDialogVisible = ref(false);
const selectedTx = ref(null);
function openTxDetail(tx) {
  selectedTx.value = tx;
  txDetailDialogVisible.value = true;
}

const activeTab = ref('transactions');
const transactionFilterType = ref('ALL');
const searchStudentQuery = ref('');
const selectedMonth = ref(getCurrentMonthYear());

const currentClass = ref(null);
const classSaldo = ref(0);

// Data lists
const expensesList = ref([]);
const incomesList = ref([]);
const studentsList = ref([]);
const refundHistory = ref([]);

// Add transaction dialog
const addDialogVisible = ref(false);
const txForm = ref({
  type: 'EXPENSE',
  kategori: 'Konsumsi & Makanan',
  sumberPemasukan: 'Donasi / Sumbangan Sukarela',
  judul: '',
  nominal: 10000,
  tanggal: new Date().toISOString().split('T')[0],
  deskripsi: ''
});

// Refund dialog
const refundDialogVisible = ref(false);
const selectedStudentForRefund = ref(null);
const refundAmount = ref(0);
const refundNote = ref('Pengembalian tabungan ke mahasiswa');

onMounted(async () => {
  await loadAllFinancialData();
});

async function loadAllFinancialData() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    const [cls, expenses, incomes, users, refunds] = await Promise.all([
      classService.getClassById(classId),
      expenseService.getExpensesByClass(classId),
      incomeService.getIncomesByClass(classId),
      userService.getUsersByClass(classId),
      savingsService.getTransactionsByClass(classId)
    ]);

    currentClass.value = cls;
    classSaldo.value = cls?.saldo || 0;
    expensesList.value = expenses || [];
    incomesList.value = incomes || [];
    // Filter student role only
    studentsList.value = (users || []).filter(u => u.role === 'USER');

    const userMap = new Map((users || []).map(u => [u.id, u]));
    refundHistory.value = (refunds || [])
      .filter(r => r.type === 'WITHDRAWAL')
      .map(r => {
        const student = userMap.get(r.userId);
        return {
          ...r,
          namaLengkap: r.namaLengkap || student?.namaLengkap || 'Mahasiswa',
          nim: r.nim || student?.nim || '-'
        };
      });
  } catch (err) {
    ElMessage.error('Gagal memuat data keuangan: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// Filtered lists by selectedMonth
const filteredExpenses = computed(() => {
  if (!selectedMonth.value) return expensesList.value;
  const [mm, yyyy] = selectedMonth.value.split('-');
  return expensesList.value.filter(e => {
    if (!e.tanggalPengeluaran) return false;
    const [y, m] = e.tanggalPengeluaran.split('-');
    return y === yyyy && m === mm;
  });
});

const filteredIncomes = computed(() => {
  if (!selectedMonth.value) return incomesList.value;
  const [mm, yyyy] = selectedMonth.value.split('-');
  return incomesList.value.filter(i => {
    if (!i.tanggalPemasukan) return false;
    const [y, m] = i.tanggalPemasukan.split('-');
    return y === yyyy && m === mm;
  });
});

const totalPeriodExpense = computed(() => {
  return filteredExpenses.value.reduce((acc, e) => acc + (Number(e.nominal) || 0), 0);
});

const totalPeriodIncome = computed(() => {
  return filteredIncomes.value.reduce((acc, i) => acc + (Number(i.nominal) || 0), 0);
});

const totalSavingsBalance = computed(() => {
  return studentsList.value.reduce((acc, s) => acc + (Number(s.tabungan) || 0), 0);
});

// Combined transactions list for Table Tab 1
const combinedTransactions = computed(() => {
  const exps = filteredExpenses.value.map(e => ({
    ...e,
    type: 'EXPENSE',
    tanggal: e.tanggalPengeluaran
  }));
  const incs = filteredIncomes.value.map(i => ({
    ...i,
    type: 'INCOME',
    tanggal: i.tanggalPemasukan
  }));
  const merged = [...exps, ...incs];
  return merged.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
});

const filteredCombinedTransactions = computed(() => {
  if (transactionFilterType.value === 'EXPENSE') {
    return combinedTransactions.value.filter(t => t.type === 'EXPENSE');
  }
  if (transactionFilterType.value === 'INCOME') {
    return combinedTransactions.value.filter(t => t.type === 'INCOME');
  }
  return combinedTransactions.value;
});

// Mahasiswa yang memiliki saldo tabungan > 0
const studentsWithSavings = computed(() => {
  return studentsList.value.filter(s => (Number(s.tabungan) || 0) > 0);
});

// Filtered students for Tab 2 (hanya tampilkan mahasiswa dengan saldo tabungan > 0)
const filteredStudents = computed(() => {
  const list = studentsWithSavings.value;
  if (!searchStudentQuery.value.trim()) return list;
  const q = searchStudentQuery.value.toLowerCase();
  return list.filter(s =>
    (s.namaLengkap || '').toLowerCase().includes(q) ||
    (s.nim || '').toLowerCase().includes(q)
  );
});

// Open Add Transaction
function openAddTransactionDialog() {
  txForm.value = {
    type: 'EXPENSE',
    kategori: 'Konsumsi & Makanan',
    sumberPemasukan: 'Donasi / Sumbangan Sukarela',
    judul: '',
    nominal: 10000,
    tanggal: new Date().toISOString().split('T')[0],
    deskripsi: ''
  };
  addDialogVisible.value = true;
}

async function handleSaveTransaction() {
  if (!txForm.value.judul.trim()) {
    return ElMessage.warning('Judul / keperluan transaksi wajib diisi.');
  }
  if (!txForm.value.nominal || txForm.value.nominal <= 0) {
    return ElMessage.warning('Nominal transaksi harus berupa angka positif.');
  }

  const classId = authStore.userClassId;
  const adminName = authStore.userProfile?.namaLengkap || authStore.user?.email || 'admin';

  submitting.value = true;
  try {
    if (txForm.value.type === 'EXPENSE') {
      await expenseService.createExpense({
        kelasId: classId,
        judul: txForm.value.judul.trim(),
        kategori: txForm.value.kategori,
        nominal: txForm.value.nominal,
        tanggalPengeluaran: txForm.value.tanggal,
        deskripsi: txForm.value.deskripsi,
        createdBy: adminName
      });
      ElMessage.success('Pengeluaran kelas berhasil dicatat & saldo diperbarui.');
    } else {
      await incomeService.createIncome({
        kelasId: classId,
        judul: txForm.value.judul.trim(),
        sumberPemasukan: txForm.value.sumberPemasukan,
        nominal: txForm.value.nominal,
        tanggalPemasukan: txForm.value.tanggal,
        deskripsi: txForm.value.deskripsi,
        createdBy: adminName
      });
      ElMessage.success('Pemasukan non-rutin berhasil dicatat & saldo diperbarui.');
    }

    addDialogVisible.value = false;
    await loadAllFinancialData();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal menyimpan transaksi');
  } finally {
    submitting.value = false;
  }
}

async function handleDeleteTransaction(row) {
  try {
    const isExpense = row.type === 'EXPENSE';
    await ElMessageBox.confirm(
      `Apakah Anda yakin ingin menghapus data ${isExpense ? 'pengeluaran' : 'pemasukan'} "${row.judul}" sebesar ${formatRupiah(row.nominal)}? Saldo kas akan disesuaikan otomatis.`,
      'Konfirmasi Hapus Transaksi',
      {
        confirmButtonText: 'Hapus Transaksi',
        cancelButtonText: 'Batal',
        type: 'warning'
      }
    );

    const classId = authStore.userClassId;
    const adminName = authStore.userProfile?.namaLengkap || 'admin';

    if (isExpense) {
      await expenseService.deleteExpense(row.id, adminName);
      ElMessage.success('Pengeluaran berhasil dihapus dan saldo kas dikembalikan.');
    } else {
      await incomeService.deleteIncome(row.id, adminName);
      ElMessage.success('Pemasukan berhasil dihapus dan saldo kas dikurangi.');
    }

    await loadAllFinancialData();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal menghapus transaksi');
    }
  }
}

// Open Refund Dialog
function openRefundDialog(student) {
  selectedStudentForRefund.value = student;
  refundAmount.value = student.tabungan || 0;
  refundNote.value = `Pengembalian tabungan ke ${student.namaLengkap}`;
  refundDialogVisible.value = true;
}

async function handleConfirmRefund() {
  if (!selectedStudentForRefund.value) return;
  const student = selectedStudentForRefund.value;

  if (refundAmount.value <= 0 || refundAmount.value > (student.tabungan || 0)) {
    return ElMessage.warning('Nominal pengembalian tidak valid.');
  }

  submitting.value = true;
  try {
    await savingsService.refundSavings({
      kelasId: authStore.userClassId,
      userId: student.id,
      namaLengkap: student.namaLengkap,
      nim: student.nim,
      nominal: refundAmount.value,
      deskripsi: refundNote.value || 'Pengembalian tabungan ke mahasiswa',
      createdBy: authStore.userProfile?.namaLengkap || 'admin'
    });

    ElMessage.success(`Berhasil mengembalikan ${formatRupiah(refundAmount.value)} ke ${student.namaLengkap}.`);
    refundDialogVisible.value = false;
    await loadAllFinancialData();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal mengembalikan tabungan');
  } finally {
    submitting.value = false;
  }
}
</script>

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
        <el-button
          type="success"
          class="!bg-emerald-600 hover:!bg-emerald-700 !border-none !text-white !font-bold !rounded-xl flex items-center justify-center gap-2 h-9 px-4 shrink-0 shadow-sm transition-all"
          @click="openWhatsappModal"
        >
          <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Rekap WhatsApp</span>
        </el-button>

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
        <el-table :data="paginatedStudents" v-loading="loading" style="width: 100%">
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
          v-for="st in paginatedStudents"
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

      <!-- Pagination -->
      <div v-if="filteredStudents.length > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span class="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          Menampilkan {{ paginatedStudents.length }} dari {{ filteredStudents.length }} mahasiswa
        </span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredStudents.length"
          layout="prev, pager, next"
          background
        />
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

    <!-- DIALOG: Preview Rekap WhatsApp & Kirim ke Group -->
    <el-dialog
      v-model="whatsappDialogVisible"
      width="94%"
      class="!max-w-2xl !rounded-3xl !p-5 sm:!p-6"
      destroy-on-close
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Rekap WhatsApp Kas & Tunggakan</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Preview & sesuaikan pesan sebelum dikirim langsung ke grup kelas</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Quick Stat Pills -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div>
            <span class="text-[11px] text-slate-400 block font-medium">Kelas & Semester</span>
            <strong class="text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate block font-bold">
              {{ className || 'Kelas' }}
            </strong>
          </div>
          <div>
            <span class="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Mahasiswa Lunas</span>
            <strong class="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-extrabold block">
              {{ lunasCount }} Orang
            </strong>
          </div>
          <div>
            <span class="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">Ada Tunggakan</span>
            <strong class="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-extrabold block">
              {{ belumLunasCount + belumAdaPembayaranCount }} Orang
            </strong>
          </div>
          <div>
            <span class="text-[11px] text-rose-600 dark:text-rose-400 block font-medium">Total Tunggakan</span>
            <strong class="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-mono font-extrabold block">
              {{ formatRupiah(totalTunggakanSum) }}
            </strong>
          </div>
        </div>

        <!-- Customization Options -->
        <div class="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Format Konten Rekap:</span>
            <el-radio-group v-model="whatsappRekapMode" size="small" @change="generateWhatsappMessage">
              <el-radio-button label="all">Lengkap (Semua)</el-radio-button>
              <el-radio-button label="unpaid_only">Hanya Tunggakan</el-radio-button>
              <el-radio-button label="summary">Ringkasan Saja</el-radio-button>
            </el-radio-group>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs">
            <el-checkbox
              v-if="whatsappRekapMode === 'all'"
              v-model="includeLunasList"
              @change="generateWhatsappMessage"
            >
              Cantumkan daftar mahasiswa lunas
            </el-checkbox>

            <el-checkbox
              v-if="whatsappRekapMode !== 'summary'"
              v-model="includeUnpaidDetail"
              @change="generateWhatsappMessage"
            >
              Sertakan rincian nominal & ptm
            </el-checkbox>

            <el-checkbox
              v-model="includeCustomNotes"
              @change="generateWhatsappMessage"
            >
              Sertakan rekening / info pembayaran
            </el-checkbox>
          </div>

          <div v-if="includeCustomNotes" class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Catatan Pembayaran / Nomor Rekening Bendahara:
            </label>
            <el-input
              v-model="customNotes"
              size="small"
              placeholder="Contoh: Transfer ke BCA 123456789 a.n Bendahara atau Dana 0812xxxx"
              clearable
              @input="generateWhatsappMessage"
            />
          </div>
        </div>

        <!-- Preview & Editor Area -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Preview Teks WhatsApp</span>
              <span class="text-[10px] text-slate-400 font-normal">(Bisa diedit langsung sebelum dikirim)</span>
            </label>
            <el-button
              size="small"
              type="info"
              link
              class="!text-xs !font-semibold flex items-center gap-1"
              @click="generateWhatsappMessage"
            >
              <el-icon><RefreshRight /></el-icon>
              Reset ke Template
            </el-button>
          </div>

          <div class="relative">
            <el-input
              v-model="whatsappMessage"
              type="textarea"
              :rows="12"
              class="!font-mono !text-xs !leading-relaxed rounded-xl shadow-xs"
              placeholder="Teks rekap WhatsApp akan tampil di sini..."
              resize="vertical"
            />
          </div>
          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            💡 Menggunakan format teks WhatsApp (*tebal*, _miring_). Teks siap dikirim langsung ke grup obrolan.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
          <el-button @click="whatsappDialogVisible = false" class="!rounded-xl">
            Tutup
          </el-button>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <el-button
              type="info"
              plain
              class="flex-1 sm:flex-none !rounded-xl !font-bold flex items-center justify-center gap-1.5"
              @click="copyWhatsappMessage"
            >
              <el-icon><DocumentCopy /></el-icon>
              Salin Pesan
            </el-button>

            <el-button
              type="success"
              class="flex-1 sm:flex-none !bg-emerald-600 hover:!bg-emerald-700 !border-none !text-white !rounded-xl !font-bold flex items-center justify-center gap-2 shadow-sm"
              @click="sendToWhatsappGroup"
            >
              <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Kirim ke Group</span>
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { reportService } from '../../services/reportService.js';
import { formatRupiah } from '../../utils/currency.js';
import { getCurrentMonthYear } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Search, Check, Warning, Close, InfoFilled, DocumentCopy, RefreshRight } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const students = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const currentSemester = ref('Semester 1 2026/2027');
const className = ref('');

// Pagination state
const currentPage = ref(1);
const pageSize = ref(7);

const detailDialogVisible = ref(false);
const selectedStudent = ref(null);

// State WhatsApp Recap
const whatsappDialogVisible = ref(false);
const whatsappMessage = ref('');
const whatsappRekapMode = ref('all'); // 'all', 'unpaid_only', 'summary'
const includeLunasList = ref(true);
const includeUnpaidDetail = ref(true);
const includeCustomNotes = ref(true);
const customNotes = ref('Pembayaran kas dapat dilakukan tunai ke Bendahara atau transfer.');

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
    className.value = report.classData?.namaKelas || authStore.userClassName || 'Kelas';
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

const totalTunggakanSum = computed(() => {
  return students.value
    .filter(s => s.status !== 'TIDAK AKTIF')
    .reduce((sum, s) => sum + (Number(s.tunggakan) || 0), 0);
});

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

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredStudents.value.slice(start, start + pageSize.value);
});

watch([statusFilter, searchQuery], () => {
  currentPage.value = 1;
});

function openWhatsappModal() {
  if (students.value.length === 0) {
    ElMessage.warning('Belum ada data mahasiswa untuk direkap.');
    return;
  }
  generateWhatsappMessage();
  whatsappDialogVisible.value = true;
}

function generateWhatsappMessage() {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const activeStudents = students.value.filter(s => s.status !== 'TIDAK AKTIF');
  const lunasList = activeStudents.filter(s => s.status === 'LUNAS');
  const nunggakList = activeStudents.filter(s => s.status === 'BELUM LUNAS' || s.status === 'BELUM ADA PEMBAYARAN');

  const totalTunggakanNominal = nunggakList.reduce((sum, s) => sum + (Number(s.tunggakan) || 0), 0);
  const totalKasTerkumpul = activeStudents.reduce((sum, s) => sum + (Number(s.totalKasPaid) || 0), 0);

  let text = `📢 *REKAP STATUS KAS & TUNGGAKAN*\n`;
  if (className.value) {
    text += `🏛 *Kelas:* ${className.value}\n`;
  }
  text += `📚 *Semester:* ${currentSemester.value}\n`;
  text += `📅 *Per Tanggal:* ${dateStr}\n\n`;

  text += `📊 *RINGKASAN STATUS KAS:*\n`;
  text += `• Total Mahasiswa Aktif: ${activeStudents.length} Orang\n`;
  text += `• ✅ Lunas: ${lunasList.length} Orang\n`;
  text += `• ⚠️ Ada Tunggakan: ${belumLunasCount.value} Orang\n`;
  if (belumAdaPembayaranCount.value > 0) {
    text += `• ❌ Belum Bayar Sama Sekali: ${belumAdaPembayaranCount.value} Orang\n`;
  }
  text += `• 💰 Kas Terkumpul: ${formatRupiah(totalKasTerkumpul)}\n`;
  text += `• ⏳ Total Sisa Tunggakan: ${formatRupiah(totalTunggakanNominal)}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (whatsappRekapMode.value !== 'summary') {
    // Mahasiswa Menunggak
    if (nunggakList.length > 0) {
      text += `\n⚠️ *DAFTAR MAHASISWA MENUNGGAK (${nunggakList.length} Orang):*\n`;
      nunggakList.forEach((s, idx) => {
        const panggilan = s.namaPanggilan ? ` (${s.namaPanggilan})` : '';
        let detailInfo = '';
        if (includeUnpaidDetail.value) {
          const nominal = formatRupiah(s.tunggakan);
          const ptm = s.pertemuanBelumLunas ? ` • ${s.pertemuanBelumLunas} ptm` : '';
          detailInfo = ` : ${nominal}${ptm}`;
        }
        text += `${idx + 1}. *${s.namaLengkap}*${panggilan}${detailInfo}\n`;
      });
      text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    } else {
      text += `\n🎉 *Alhamdulillah! Semua mahasiswa telah lunas kas untuk pertemuan saat ini.*\n\n━━━━━━━━━━━━━━━━━━━━\n`;
    }

    // Mahasiswa Lunas
    if (whatsappRekapMode.value === 'all' && includeLunasList.value && lunasList.length > 0) {
      text += `\n✅ *DAFTAR MAHASISWA LUNAS (${lunasList.length} Orang):*\n`;
      lunasList.forEach((s, idx) => {
        const panggilan = s.namaPanggilan ? ` (${s.namaPanggilan})` : '';
        text += `${idx + 1}. ${s.namaLengkap}${panggilan}\n`;
      });
      text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    }
  }

  if (includeCustomNotes.value && customNotes.value?.trim()) {
    text += `\n📝 *CATATAN / PEMBAYARAN:*\n${customNotes.value.trim()}\n\n`;
  } else {
    text += `\n💡 *Catatan:* Bagi rekan-rekan yang masih memiliki tunggakan, mohon segera menyelesaikan pembayaran kas. Terima kasih atas perhatian dan kerja samanya! 🙏✨\n\n`;
  }

  text += `_Pesan rekap resmi via MyKas App_`;

  whatsappMessage.value = text;
}

async function copyWhatsappMessage() {
  if (!whatsappMessage.value.trim()) {
    ElMessage.warning('Teks rekap WhatsApp kosong.');
    return;
  }
  try {
    if (navigator?.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(whatsappMessage.value);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = whatsappMessage.value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    ElMessage.success('Teks rekap WhatsApp berhasil disalin ke clipboard! Siap dikirim ke grup.');
  } catch (err) {
    ElMessage.error('Gagal menyalin teks: ' + err.message);
  }
}

function sendToWhatsappGroup() {
  if (!whatsappMessage.value.trim()) {
    ElMessage.warning('Teks rekap WhatsApp tidak boleh kosong.');
    return;
  }
  const text = encodeURIComponent(whatsappMessage.value);
  const waUrl = `https://api.whatsapp.com/send?text=${text}`;
  window.open(waUrl, '_blank');
}
</script>

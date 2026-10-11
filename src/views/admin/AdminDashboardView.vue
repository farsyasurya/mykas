<template>
  <div class="space-y-6">
    <!-- Top Welcome & Filter Header -->
    <div class="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Dashboard Kas Kelas</h1>
          <el-tag type="success" effect="plain" class="!font-semibold !rounded-lg">
            {{ currentClass?.namaKelas || authStore.userProfile?.kelasNama || 'Kelas' }}
          </el-tag>
          <el-tag v-if="currentClass?.semesterAktif" size="small" type="info" effect="plain" class="!font-semibold !rounded-lg">
            {{ currentClass.semesterAktif }}
          </el-tag>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Selamat datang, <strong class="text-slate-800 dark:text-slate-200">{{ authStore.userProfile?.namaPanggilan || authStore.userProfile?.namaLengkap }}</strong>. Kelola kas pertemuan dengan rapi dan transparan.
        </p>
      </div>

      <!-- Quick Action Buttons & Month Filter -->
      <div class="flex flex-wrap items-center gap-2.5">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="Filter Bulan"
          format="MM-YYYY"
          value-format="MM-YYYY"
          :clearable="false"
          @change="loadDashboardData"
          class="!w-36"
        />

        <router-link to="/admin/payments/create">
          <el-button type="primary" class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold shadow-sm shadow-emerald-600/20">
            <el-icon class="mr-1"><Plus /></el-icon> Bayar Kas
          </el-button>
        </router-link>

        <router-link to="/admin/meetings">
          <el-button class="!rounded-xl !border-slate-200 dark:!border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-700">
            <el-icon class="mr-1"><Calendar /></el-icon> Jadwal
          </el-button>
        </router-link>
      </div>
    </div>

    <!-- 4 Essential Stat Cards (1 Balanced Row) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Saldo Kas Kelas -->
      <StatCard
        title="Saldo Kas Kelas"
        :value="formatRupiah(classSaldo)"
        icon-bg-class="bg-emerald-600 shadow-emerald-500/20"
      >
        <template #icon><el-icon :size="22"><Wallet /></el-icon></template>
        <template #footer>
          <div class="w-full flex items-center justify-between text-[11px] text-slate-500">
            <span>Bulan Ini:</span>
            <span class="font-medium text-emerald-600">+{{ formatRupiah(monthlyKasIn) }}</span>
            <span class="font-medium text-rose-500">-{{ formatRupiah(monthlyExpenseOut) }}</span>
          </div>
        </template>
      </StatCard>

      <!-- Card 2: Tabungan Mahasiswa -->
      <StatCard
        title="Tabungan Mahasiswa"
        :value="formatRupiah(totalTabungan)"
        subtitle="Dana titipan terpisah dari kas kelas"
        icon-bg-class="bg-amber-600 shadow-amber-500/20"
      >
        <template #icon><el-icon :size="22"><Coin /></el-icon></template>
      </StatCard>

      <!-- Card 3: Status Lunas Kas -->
      <StatCard
        title="Kepatuhan Kas Mahasiswa"
        :value="`${lunasStudentsCount} / ${totalStudents} Lunas`"
        icon-bg-class="bg-teal-600 shadow-teal-500/20"
      >
        <template #icon>
          <el-icon :size="22">
            <Check v-if="unpaidStudentsCount === 0" />
            <Warning v-else />
          </el-icon>
        </template>
        <template #footer>
          <div class="w-full flex items-center justify-between text-[11px]">
            <span v-if="unpaidStudentsCount === 0" class="text-emerald-600 font-semibold">
              ✓ Semua anggota lunas
            </span>
            <span v-else class="text-rose-600 font-semibold">
              {{ unpaidStudentsCount }} mahasiswa ada tunggakan
            </span>
            <span class="text-slate-400 font-mono">
              {{ Math.round((lunasStudentsCount / (totalStudents || 1)) * 100) }}%
            </span>
          </div>
        </template>
      </StatCard>

      <!-- Card 4: Agenda Pertemuan Terdekat -->
      <StatCard
        title="Pertemuan Kas"
        :value="nextMeeting ? `Pertemuan Ke-${nextMeeting.nomorPertemuan}` : 'Semua Terlaksana'"
        :subtitle="nextMeeting ? `${formatIndonesianDate(nextMeeting.tanggalPertemuan)} • Rp 7.000` : 'Belum ada jadwal baru'"
        icon-bg-class="bg-blue-600 shadow-blue-500/20"
      >
        <template #icon><el-icon :size="22"><Calendar /></el-icon></template>
      </StatCard>
    </div>

    <!-- Middle Section: Financial Chart & Operations Summary -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: Cashflow Bar Chart -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Arus Kas Masuk & Keluar</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Histori perbandingan pemasukan vs pengeluaran kelas</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              6 Bulan Terakhir
            </span>
          </div>
        </div>

        <FinanceChart
          :incomes="chartIncomes"
          :expenses="chartExpenses"
          :labels="chartLabels"
        />

        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Kas Rutin Bulan Ini: <strong class="text-slate-800 dark:text-slate-200">{{ formatRupiah(monthlyKasIn) }}</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Pengeluaran: <strong class="text-slate-800 dark:text-slate-200">{{ formatRupiah(monthlyExpenseOut) }}</strong>
            </span>
          </div>
          <router-link to="/admin/reports" class="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-xs">
            Laporan Detail →
          </router-link>
        </div>
      </div>

      <!-- Right 1 Col: Agenda Pertemuan & Ringkasan Kolektibilitas -->
      <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Pertemuan Berikutnya</h3>
            <router-link to="/admin/meetings" class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
              Kelola
            </router-link>
          </div>

          <div v-if="nextMeeting" class="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-600 text-white">
                Pertemuan Ke-{{ nextMeeting.nomorPertemuan }}
              </span>
              <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Tarif {{ formatRupiah(nextMeeting.tarifKas || 7000) }}
              </span>
            </div>

            <h4 class="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-2.5">
              {{ formatIndonesianDate(nextMeeting.tanggalPertemuan) }}
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Semester: {{ nextMeeting.semester || currentClass?.semesterAktif || 'Ganjil' }}
            </p>

            <div class="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
              <span class="text-slate-600 dark:text-slate-400">Status Pembayaran:</span>
              <span class="font-bold text-emerald-800 dark:text-emerald-300">{{ nextMeetingPaidCount }} / {{ totalStudents }} Lunas</span>
            </div>

            <div class="mt-3 flex items-center gap-2">
              <router-link to="/admin/payments/create" class="flex-1">
                <el-button size="small" type="primary" class="w-full !rounded-lg !bg-emerald-600 !border-none !font-semibold">
                  Catat Bayar
                </el-button>
              </router-link>
              <router-link to="/admin/meetings">
                <el-button size="small" class="!rounded-lg !border-emerald-200 dark:!border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  Detail
                </el-button>
              </router-link>
            </div>
          </div>

          <div v-else class="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <el-icon :size="24" class="text-slate-400 mb-1"><Calendar /></el-icon>
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Belum Ada Pertemuan Baru</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Jadwalkan pertemuan baru untuk memulai kas</p>
            <router-link to="/admin/meetings">
              <el-button size="small" type="primary" class="mt-2.5 !rounded-lg !bg-emerald-600 !border-none">
                + Tambah Pertemuan
              </el-button>
            </router-link>
          </div>
        </div>

        <!-- Kolektibilitas Kas Box -->
        <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400">Tingkat Penagihan Kas</span>
            <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ collectionPercentage }}%</span>
          </div>

          <el-progress
            :percentage="collectionPercentage"
            :stroke-width="8"
            :show-text="false"
            :color="collectionPercentage === 100 ? '#059669' : '#0d9488'"
          />

          <div class="pt-2 space-y-1 text-xs">
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Total Kewajiban:</span>
              <span class="font-semibold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(totalKewajibanKelas) }}</span>
            </div>
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Kas Tertagih:</span>
              <span class="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(totalKasTertagih) }}</span>
            </div>
            <div class="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Sisa Tunggakan:</span>
              <span class="font-bold text-rose-600 dark:text-rose-400 font-mono">{{ formatRupiah(totalTunggakanKelas) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Actionable Tunggakan & Recent Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 1. Daftar Mahasiswa Menunggak (Prioritas Ditagih) -->
      <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Daftar Tunggakan Mahasiswa</h3>
              <el-tag
                :type="unpaidStudentsList.length > 0 ? 'danger' : 'success'"
                size="small"
                class="!font-bold !rounded-md"
              >
                {{ unpaidStudentsList.length }} Orang
              </el-tag>
            </div>
            <router-link to="/admin/payments/status" class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
              Detail Status →
            </router-link>
          </div>

          <div v-if="unpaidStudentsList.length === 0" class="py-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <el-icon :size="32" class="text-emerald-500 mb-2"><Check /></el-icon>
            <p class="text-sm font-bold text-slate-800 dark:text-slate-200">Semua Mahasiswa Lunas!</p>
            <p class="text-xs text-slate-400 mt-1">Tidak ada tunggakan kas kelas saat ini.</p>
          </div>

          <div v-else>
            <!-- Desktop Table (sm and above) -->
            <div class="hidden sm:block">
              <el-table
                :data="unpaidStudentsList.slice(0, 5)"
                style="width: 100%"
                size="small"
              >
                <el-table-column label="Mahasiswa" min-width="130">
                  <template #default="{ row }">
                    <div class="font-semibold text-slate-900 dark:text-slate-100 truncate">{{ row.namaLengkap }}</div>
                    <div class="text-[11px] text-slate-400 font-mono">{{ row.nim }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="Tunggakan" width="105" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" type="danger" effect="light" class="!font-medium">
                      {{ row.pertemuanBelumLunas }} Pertemuan
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Nominal" width="100" align="right">
                  <template #default="{ row }">
                    <span class="font-bold text-rose-600 dark:text-rose-400 font-mono">{{ formatRupiah(row.tunggakan) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Aksi" width="80" align="center">
                  <template #default="{ row }">
                    <router-link :to="`/admin/payments/create?studentId=${row.userId || row.id}`">
                      <el-button size="small" type="primary" link class="!text-xs !font-bold">
                        Bayar
                      </el-button>
                    </router-link>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- Mobile Cards (< sm) -->
            <div class="block sm:hidden space-y-2.5">
              <div
                v-for="st in unpaidStudentsList.slice(0, 5)"
                :key="st.userId || st.id"
                class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <h5 class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{{ st.namaLengkap }}</h5>
                    <p class="text-[10px] text-slate-400 font-mono">NIM: {{ st.nim }}</p>
                  </div>
                  <el-tag size="small" type="danger" effect="light" class="!font-bold shrink-0 text-[10px]">
                    {{ st.pertemuanBelumLunas }} Ptm Belum
                  </el-tag>
                </div>

                <div class="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span class="text-rose-600 dark:text-rose-400 font-bold font-mono">
                    {{ formatRupiah(st.tunggakan) }}
                  </span>
                  <div class="flex items-center gap-1.5">
                    <el-button size="small" text type="info" class="!text-xs" @click="openUnpaidDetail(st)">
                      Detail
                    </el-button>
                    <router-link :to="`/admin/payments/create?studentId=${st.userId || st.id}`">
                      <el-button size="small" type="primary" class="!text-xs !rounded-lg !bg-emerald-600 !border-none !py-1">
                        Bayar
                      </el-button>
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
          <router-link to="/admin/payments/status" class="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
            Kelola seluruh status tagihan kelas →
          </router-link>
        </div>
      </div>

      <!-- 2. Histori Transaksi Kas Terbaru -->
      <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Histori Transaksi Kas Terbaru</h3>
              <span class="text-xs text-slate-400">Terakhir dicatat</span>
            </div>
            <router-link to="/admin/payments" class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
              Lihat Semua →
            </router-link>
          </div>

          <div v-if="recentPayments.length === 0" class="py-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <el-icon :size="32" class="text-slate-300 dark:text-slate-600 mb-2"><Wallet /></el-icon>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum Ada Pembayaran</p>
            <p class="text-xs text-slate-400 mt-1">Gunakan tombol "Bayar Kas" untuk mencatat setoran.</p>
          </div>

          <div v-else>
            <!-- Desktop Table (sm and above) -->
            <div class="hidden sm:block">
              <el-table
                :data="recentPayments"
                style="width: 100%"
                size="small"
              >
                <el-table-column label="Mahasiswa" min-width="130">
                  <template #default="{ row }">
                    <div class="font-semibold text-slate-900 dark:text-slate-100 truncate">{{ row.namaLengkap }}</div>
                    <div class="text-[11px] text-slate-400 font-mono">{{ row.nim }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="Pertemuan" width="95" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" type="info">{{ row.jumlahPertemuan }} Ptm</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Kas Masuk" width="105" align="right">
                  <template #default="{ row }">
                    <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(row.totalMasukKas) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Tabungan" width="95" align="right">
                  <template #default="{ row }">
                    <span :class="row.totalMasukTabungan > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400 dark:text-slate-500'">
                      {{ formatRupiah(row.totalMasukTabungan) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- Mobile Cards (< sm) -->
            <div class="block sm:hidden space-y-2.5">
              <div
                v-for="p in recentPayments"
                :key="p.id"
                class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <h5 class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{{ p.namaLengkap }}</h5>
                    <p class="text-[10px] text-slate-400 font-mono">NIM: {{ p.nim }} • {{ p.tipePembayaran }}</p>
                  </div>
                  <el-button size="small" text type="primary" class="!text-xs shrink-0" @click="openPaymentDetail(p)">
                    Detail
                  </el-button>
                </div>

                <div class="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span class="text-slate-500 text-[11px]">{{ p.jumlahPertemuan }} Pertemuan</span>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{{ formatRupiah(p.totalMasukKas) }}
                    </span>
                    <span v-if="p.totalMasukTabungan > 0" class="text-amber-600 font-mono text-[11px]">
                      (Tab: +{{ formatRupiah(p.totalMasukTabungan) }})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
          <router-link to="/admin/payments" class="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
            Lihat buku kas lengkap →
          </router-link>
        </div>
      </div>
    </div>

    <!-- DIALOG: Detail Tunggakan Mahasiswa (Mobile Dialog) -->
    <el-dialog
      v-model="unpaidDetailDialog"
      title="Detail Tunggakan Mahasiswa"
      width="92%"
      class="!max-w-[440px] !rounded-2xl"
    >
      <div v-if="selectedUnpaidStudent" class="space-y-3.5 text-xs">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
          <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">{{ selectedUnpaidStudent.namaLengkap }}</h4>
          <p class="text-slate-400 font-mono">NIM: {{ selectedUnpaidStudent.nim }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Pertemuan Belum Lunas</span>
            <strong class="text-rose-600 font-semibold">{{ selectedUnpaidStudent.pertemuanBelumLunas }} Pertemuan</strong>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Total Nominal Tunggakan</span>
            <strong class="text-rose-600 font-bold font-mono">{{ formatRupiah(selectedUnpaidStudent.tunggakan) }}</strong>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Saldo Tabungan Saat Ini</span>
            <strong class="text-amber-600 font-semibold font-mono">{{ formatRupiah(selectedUnpaidStudent.saldoTabungan || 0) }}</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="unpaidDetailDialog = false">Tutup</el-button>
          <router-link
            v-if="selectedUnpaidStudent"
            :to="`/admin/payments/create?studentId=${selectedUnpaidStudent.userId || selectedUnpaidStudent.id}`"
          >
            <el-button type="primary" class="!bg-emerald-600 !border-none" @click="unpaidDetailDialog = false">
              Bayar Sekarang
            </el-button>
          </router-link>
        </div>
      </template>
    </el-dialog>

    <!-- DIALOG: Detail Transaksi Pembayaran (Mobile Dialog) -->
    <el-dialog
      v-model="paymentDetailDialog"
      title="Detail Transaksi Kas"
      width="92%"
      class="!max-w-[440px] !rounded-2xl"
    >
      <div v-if="selectedPayment" class="space-y-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
          <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">{{ selectedPayment.namaLengkap }}</h4>
          <p class="text-slate-400 font-mono">NIM: {{ selectedPayment.nim }}</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Waktu Pembayaran</span>
            <strong>{{ formatIndonesianDate(selectedPayment.createdAt) }}</strong>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Metode Bayar</span>
            <el-tag size="small">{{ selectedPayment.tipePembayaran }}</el-tag>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Jumlah Pertemuan</span>
            <strong>{{ selectedPayment.jumlahPertemuan }} Pertemuan</strong>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Masuk Kas Rutin</span>
            <strong class="text-emerald-600 font-bold font-mono">{{ formatRupiah(selectedPayment.totalMasukKas) }}</strong>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Masuk Tabungan</span>
            <strong class="text-amber-600 font-mono">{{ formatRupiah(selectedPayment.totalMasukTabungan) }}</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="paymentDetailDialog = false">Tutup</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { reportService } from '../../services/reportService.js';
import { meetingService } from '../../services/meetingService.js';
import { classService } from '../../services/classService.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate, getCurrentMonthYear } from '../../utils/date.js';
import StatCard from '../../components/dashboard/StatCard.vue';
import FinanceChart from '../../components/dashboard/FinanceChart.vue';
import { Plus, Wallet, Calendar, Coin, Check, Warning } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const selectedMonth = ref(getCurrentMonthYear());

const currentClass = ref(null);
const classSaldo = ref(0);
const monthlyKasIn = ref(0);
const monthlyOtherIn = ref(0);
const monthlyExpenseOut = ref(0);
const totalTabungan = ref(0);
const totalStudents = ref(0);
const lunasStudentsCount = ref(0);
const unpaidStudentsCount = ref(0);

const totalKewajibanKelas = ref(0);
const totalKasTertagih = ref(0);
const totalTunggakanKelas = ref(0);

const nextMeeting = ref(null);
const nextMeetingPaidCount = ref(0);

const recentPayments = ref([]);
const unpaidStudentsList = ref([]);

const unpaidDetailDialog = ref(false);
const selectedUnpaidStudent = ref(null);
function openUnpaidDetail(student) {
  selectedUnpaidStudent.value = student;
  unpaidDetailDialog.value = true;
}

const paymentDetailDialog = ref(false);
const selectedPayment = ref(null);
function openPaymentDetail(payment) {
  selectedPayment.value = payment;
  paymentDetailDialog.value = true;
}

const chartIncomes = ref([0, 0, 0, 0, 0, 0]);
const chartExpenses = ref([0, 0, 0, 0, 0, 0]);
const chartLabels = ref(['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt']);

const collectionPercentage = computed(() => {
  if (totalKewajibanKelas.value <= 0) return 100;
  return Math.min(100, Math.round((totalKasTertagih.value / totalKewajibanKelas.value) * 100));
});

onMounted(async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  const classId = authStore.userClassId;
  if (!classId) return;

  try {
    currentClass.value = await classService.getClassById(classId);
    classSaldo.value = currentClass.value?.saldo || 0;

    const report = await reportService.getMonthlyReport(classId, selectedMonth.value);

    monthlyKasIn.value = report.totalPemasukanKasRutin;
    monthlyOtherIn.value = report.totalPemasukanLain;
    monthlyExpenseOut.value = report.totalPengeluaranOperasional;
    totalTabungan.value = report.totalTabunganMahasiswa;
    totalStudents.value = report.totalMahasiswa;
    lunasStudentsCount.value = report.mahasiswaLunasCount;
    unpaidStudentsCount.value = report.mahasiswaBelumLunasCount;
    recentPayments.value = (report.monthPayments || []).slice(0, 5);
    unpaidStudentsList.value = report.tunggakanList || [];

    // Financial obligations
    totalKewajibanKelas.value = (report.rekapMahasiswa || []).reduce((acc, s) => acc + s.totalKewajiban, 0);
    totalKasTertagih.value = (report.rekapMahasiswa || []).reduce((acc, s) => acc + s.totalKasPaid, 0);
    totalTunggakanKelas.value = (report.rekapMahasiswa || []).reduce((acc, s) => acc + s.tunggakan, 0);

    // Meetings
    const allMeetings = await meetingService.getMeetingsByClass(classId);
    const today = new Date().toISOString().split('T')[0];
    const activeSem = currentClass.value?.semesterAktif;
    const upcoming = allMeetings.filter(m => m.status === 'UPCOMING' && m.tanggalPertemuan >= today && (!activeSem || m.semester === activeSem));
    if (upcoming.length > 0) {
      nextMeeting.value = upcoming[0];
      const paidMembers = (report.monthPayments || []).filter(p => (p.meetingIds || []).includes(upcoming[0].id));
      nextMeetingPaidCount.value = paidMembers.length;
    } else {
      nextMeeting.value = null;
    }

    // 6-Month Real Trend strictly from Database (Firestore)
    const trend = await reportService.getSixMonthsTrend(classId);
    chartLabels.value = trend.labels;
    chartIncomes.value = trend.incomes;
    chartExpenses.value = trend.expenses;
  } catch (err) {
    console.warn('Dashboard data loading error:', err);
  }
}
</script>

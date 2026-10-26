<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Jadwal & Pertemuan Kas</h1>
          <el-tag v-if="currentClass?.namaKelas" type="success" effect="plain" class="!font-bold !rounded-lg shrink-0">
            {{ currentClass.namaKelas }}
          </el-tag>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 sm:line-clamp-none">
          Daftar pertemuan kas rutin per kelas dan per semester. Tarif: <strong>Rp7.000 / pertemuan</strong>.
        </p>
      </div>

      <!-- Action Buttons -->
      <div v-if="authStore.isAdmin" class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <!-- Button: Reminder WA Pertemuan Berikutnya -->
        <el-button
          type="success"
          class="flex-1 sm:flex-initial !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !text-white !font-bold shadow-sm transition-all !text-xs sm:!text-sm flex items-center justify-center gap-1.5 h-9 px-3.5"
          @click="openNextMeetingWhatsappModal"
        >
          <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span class="ml-1">Reminder WA</span>
        </el-button>

        <!-- Button: Tambah Semester Baru -->
        <el-button
          type="primary"
          plain
          class="flex-1 sm:flex-initial !rounded-xl !border-emerald-600 !text-emerald-700 dark:!text-emerald-400 dark:!border-emerald-700 hover:!bg-emerald-50 dark:hover:!bg-emerald-950/40 !font-semibold transition-all !text-xs sm:!text-sm"
          @click="openAddSemesterDialog"
        >
          <el-icon class="mr-1"><FolderAdd /></el-icon> Semester Baru
        </el-button>

        <!-- Button: Tambah Pertemuan -->
        <el-button
          type="primary"
          class="flex-1 sm:flex-initial !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold shadow-sm shadow-emerald-600/20 transition-all !text-xs sm:!text-sm"
          @click="openAddMeetingDialog"
        >
          <el-icon class="mr-1"><Plus /></el-icon> Tambah Pertemuan
        </el-button>
      </div>
    </div>

    <!-- Semester Tabs Bar -->
    <div class="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 overflow-hidden transition-colors">
      <div class="flex items-center gap-2 overflow-x-auto py-1 max-w-full no-scrollbar">
        <button
          v-for="sem in semesterList"
          :key="sem"
          @click="handleSelectSemester(sem)"
          class="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          :class="activeSemester === sem
            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60'"
        >
          <el-icon :size="16"><Calendar /></el-icon>
          <span>{{ sem }}</span>
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="activeSemester === sem ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
          >
            {{ getMeetingCount(sem) }} Ptm
          </span>
          <span
            v-if="currentClass?.semesterAktif === sem"
            class="hidden sm:inline-block w-2 h-2 rounded-full"
            :class="activeSemester === sem ? 'bg-amber-300' : 'bg-emerald-500'"
            title="Semester Aktif Kelas"
          ></span>
        </button>
      </div>

      <el-button
        v-if="authStore.isAdmin"
        size="small"
        link
        type="primary"
        class="flex-shrink-0 !text-xs !font-bold hidden sm:inline-flex"
        @click="openAddSemesterDialog"
      >
        <el-icon class="mr-1"><Plus /></el-icon> Semester Baru
      </el-button>
    </div>

    <!-- Active Semester Meetings Container -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-5 sm:p-6 transition-colors">
      <!-- Semester Summary Header inside Card -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-slate-900 dark:text-slate-100">
            Daftar Pertemuan: <span class="text-emerald-600 dark:text-emerald-400">{{ activeSemester }}</span>
          </span>
          <el-tag
            v-if="currentClass?.semesterAktif === activeSemester"
            size="small"
            type="success"
            effect="light"
            class="!font-semibold"
          >
            ✓ Semester Berjalan
          </el-tag>
          <el-button
            v-else-if="authStore.isAdmin"
            size="small"
            type="success"
            plain
            class="!rounded-xl !text-xs !font-semibold"
            :loading="activatingSemester"
            @click="handleSetActiveSemester(activeSemester)"
          >
            <el-icon class="mr-1"><Check /></el-icon> Jadikan Semester Berjalan
          </el-button>
        </div>

        <div class="text-xs text-slate-500 dark:text-slate-400">
          Total: <strong>{{ filteredMeetings.length }}</strong> Pertemuan Terjadwal
        </div>
      </div>

      <!-- Empty State for Newly Added Semester -->
      <div v-if="filteredMeetings.length === 0 && !loading" class="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
          <el-icon :size="24"><Calendar /></el-icon>
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
          Belum Ada Pertemuan di {{ activeSemester }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Semester baru ini belum memiliki jadwal pertemuan kas. Klik tombol di bawah untuk membuat Pertemuan ke-1.
        </p>
        <el-button
          v-if="authStore.isAdmin"
          type="primary"
          class="mt-4 !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold"
          @click="openAddMeetingDialog"
        >
          <el-icon class="mr-1.5"><Plus /></el-icon> Tambah Pertemuan di {{ activeSemester }}
        </el-button>
      </div>

      <!-- Meetings Container: Desktop Table vs Mobile Cards -->
      <div v-else>
        <!-- Desktop Table (md and above) -->
        <div class="hidden md:block">
          <el-table
            :data="filteredMeetings"
            v-loading="loading"
            style="width: 100%"
          >
            <el-table-column prop="nomorPertemuan" label="Pertemuan" width="140">
              <template #default="{ row }">
                <span class="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Pertemuan {{ row.nomorPertemuan }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="tanggalPertemuan" label="Tanggal Pelaksanaan" min-width="160">
              <template #default="{ row }">
                <div class="font-semibold text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(row.tanggalPertemuan) }}</div>
                <div class="text-xs text-slate-400">Semester: {{ row.semester }}</div>
              </template>
            </el-table-column>

            <el-table-column prop="tarifKas" label="Tarif Kas" width="130" align="right">
              <template #default="{ row }">
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(row.tarifKas || 7000) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Status" width="140" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'COMPLETED' ? 'success' : (row.status === 'CANCELLED' ? 'danger' : 'warning')"
                  effect="light"
                  size="small"
                  class="!font-bold"
                >
                  {{ row.status === 'UPCOMING' ? 'JADWAL AKTIF' : (row.status === 'COMPLETED' ? 'SELESAI' : 'DIBATALKAN') }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Rincian & Pengingat" width="220" align="center">
              <template #default="{ row }">
                <div class="flex items-center justify-center gap-1.5">
                  <el-button size="small" type="primary" plain @click="openMeetingDetails(row)" class="!rounded-lg">
                    <el-icon class="mr-1"><User /></el-icon> Cek Mahasiswa
                  </el-button>
                  <el-button
                    v-if="row.status !== 'CANCELLED'"
                    size="small"
                    type="success"
                    plain
                    class="!rounded-lg !border-emerald-600/60 !text-emerald-600 hover:!bg-emerald-50 dark:hover:!bg-emerald-950/40"
                    title="Pengingat WhatsApp Pertemuan Ini"
                    @click="openMeetingWhatsappModal(row)"
                  >
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span class="ml-1 text-xs">WA</span>
                  </el-button>
                </div>
              </template>
            </el-table-column>

            <el-table-column v-if="authStore.isAdmin" label="Aksi" width="140" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status !== 'CANCELLED'"
                  size="small"
                  type="danger"
                  plain
                  class="!rounded-lg"
                  @click="openCancelDialog(row)"
                >
                  Batalkan
                </el-button>
                <span v-else class="text-xs text-slate-400 italic">Dibatalkan</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile Cards (< md) -->
        <div class="block md:hidden space-y-3" v-loading="loading">
          <div
            v-for="meeting in filteredMeetings"
            :key="meeting.id"
            class="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3 transition-colors"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                  Pertemuan {{ meeting.nomorPertemuan }}
                </span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 truncate">
                  {{ meeting.semester }}
                </span>
              </div>
              <el-tag
                :type="meeting.status === 'COMPLETED' ? 'success' : (meeting.status === 'CANCELLED' ? 'danger' : 'warning')"
                size="small"
                class="!font-bold shrink-0 text-[10px]"
              >
                {{ meeting.status === 'UPCOMING' ? 'JADWAL AKTIF' : (meeting.status === 'COMPLETED' ? 'SELESAI' : 'BATAL') }}
              </el-tag>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <div class="min-w-0">
                <span class="text-slate-400 text-[11px] block">Pelaksanaan</span>
                <strong class="text-slate-800 dark:text-slate-200 font-semibold truncate block">
                  {{ formatIndonesianDate(meeting.tanggalPertemuan) }}
                </strong>
              </div>
              <div class="text-right">
                <span class="text-slate-400 text-[11px] block">Tarif Kas</span>
                <strong class="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  {{ formatRupiah(meeting.tarifKas || 7000) }}
                </strong>
              </div>
            </div>

            <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <el-button
                size="small"
                type="primary"
                plain
                class="flex-1 !rounded-xl !text-xs !font-semibold"
                @click="openMeetingDetails(meeting)"
              >
                <el-icon class="mr-1"><User /></el-icon> Detail & Mahasiswa
              </el-button>
              <el-button
                v-if="meeting.status !== 'CANCELLED'"
                size="small"
                type="success"
                plain
                class="!rounded-xl !text-xs !border-emerald-600/60 !text-emerald-600 flex items-center gap-1"
                title="Pengingat WhatsApp"
                @click="openMeetingWhatsappModal(meeting)"
              >
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>WA</span>
              </el-button>
              <el-button
                v-if="authStore.isAdmin && meeting.status !== 'CANCELLED'"
                size="small"
                type="danger"
                plain
                class="!rounded-xl !text-xs"
                @click="openCancelDialog(meeting)"
              >
                Batalkan
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- DIALOG: Tambah Semester Baru               -->
    <!-- ========================================== -->
    <el-dialog
      v-model="addSemesterDialogVisible"
      title="Tambah Semester Baru"
      width="92%"
      class="!max-w-[480px] !rounded-2xl"
      destroy-on-close
    >
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Tambahkan semester baru untuk kelas <strong class="text-slate-800 dark:text-slate-200">{{ currentClass?.namaKelas || authStore.userProfile?.kelasNama }}</strong>. Tab semester baru akan langsung muncul di bawah.
      </p>

      <el-form label-position="top">
        <el-form-item label="Nama Semester" required>
          <el-input
            v-model="newSemesterName"
            placeholder="Contoh: Semester 2 2026/2027"
            clearable
          />
        </el-form-item>

        <div class="mb-4">
          <p class="text-[11px] font-semibold text-slate-400 mb-1.5">Saran Cepat:</p>
          <div class="flex flex-wrap gap-1.5">
            <el-tag
              v-for="sug in suggestedSemesters"
              :key="sug"
              class="cursor-pointer hover:!border-emerald-500 hover:!text-emerald-600 transition-colors"
              @click="newSemesterName = sug"
              size="small"
              type="info"
              effect="plain"
            >
              {{ sug }}
            </el-tag>
          </div>
        </div>

        <el-form-item>
          <el-checkbox v-model="setAsActiveClassSemester">
            Jadikan sebagai semester aktif kelas sekarang
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addSemesterDialogVisible = false">Batal</el-button>
          <el-button
            type="primary"
            :loading="savingSemester"
            @click="handleCreateSemester"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold !rounded-xl"
          >
            Simpan & Buka Tab
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- ========================================== -->
    <!-- DIALOG: Tambah Jadwal Pertemuan Kas        -->
    <!-- ========================================== -->
    <el-dialog
      v-model="addDialogVisible"
      title="Tambah Jadwal Pertemuan Kas"
      width="92%"
      class="!max-w-[480px] !rounded-2xl"
      destroy-on-close
    >
      <el-form :model="addForm" label-position="top">
        <!-- Target Semester -->
        <el-form-item label="Semester Target" required>
          <el-select
            v-model="addForm.semester"
            class="!w-full"
            placeholder="Pilih Semester"
            @change="updateNextMeetingNumber"
          >
            <el-option
              v-for="sem in semesterList"
              :key="sem"
              :label="sem"
              :value="sem"
            />
          </el-select>
        </el-form-item>

        <!-- Nomor Pertemuan -->
        <el-form-item label="Nomor Pertemuan (Unik per Semester)" required>
          <el-input-number
            v-model="addForm.nomorPertemuan"
            :min="1"
            :max="100"
            class="!w-full"
          />
          <p class="text-[11px] text-slate-400 mt-1">
            Dihitung otomatis untuk {{ addForm.semester || activeSemester }}.
          </p>
        </el-form-item>

        <!-- Tanggal Pertemuan -->
        <el-form-item label="Tanggal Pertemuan" required>
          <el-date-picker
            v-model="addForm.tanggalPertemuan"
            type="date"
            placeholder="Pilih tanggal pelaksanaan"
            value-format="YYYY-MM-DD"
            format="DD MMMM YYYY"
            class="!w-full"
          />
        </el-form-item>

        <!-- Tarif Kas -->
        <el-form-item label="Tarif Kas (Rp)" required>
          <el-input-number
            v-model="addForm.tarifKas"
            :min="1000"
            :step="1000"
            :formatter="rupiahInputFormatter"
            :parser="rupiahInputParser"
            class="!w-full"
          />
          <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Nominal terbaca: <strong class="text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(addForm.tarifKas || 0) }}</strong> / pertemuan
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">Batal</el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="handleCreateMeeting"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-none !font-semibold !rounded-xl"
          >
            Simpan Jadwal
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- ========================================== -->
    <!-- DIALOG: Batalkan Pertemuan                 -->
    <!-- ========================================== -->
    <el-dialog
      v-model="cancelDialogVisible"
      title="Batalkan Pertemuan"
      width="92%"
      class="!max-w-[460px] !rounded-2xl"
      destroy-on-close
    >
      <p class="text-xs text-slate-600 dark:text-slate-400 mb-3">
        Pembatalan pertemuan <strong>Pertemuan {{ activeMeeting?.nomorPertemuan }} ({{ activeMeeting?.semester }})</strong> tidak akan menghapus transaksi kas yang sudah tercatat sebelumnya.
      </p>

      <el-form label-position="top">
        <el-form-item label="Alasan Pembatalan" required>
          <el-input
            v-model="cancelReason"
            type="textarea"
            rows="3"
            placeholder="Contoh: Dosen berhalangan hadir / Libur perkuliahan nasional"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelDialogVisible = false">Tutup</el-button>
          <el-button
            type="danger"
            :loading="saving"
            @click="handleConfirmCancel"
            class="!rounded-xl"
          >
            Konfirmasi Batalkan
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- ========================================== -->
    <!-- DIALOG: Rincian Pembayaran Mahasiswa       -->
    <!-- ========================================== -->
    <el-dialog
      v-model="detailsDialogVisible"
      :title="`Status Pembayaran Pertemuan ${activeMeeting?.nomorPertemuan} (${activeMeeting?.semester || ''})`"
      width="94%"
      class="!max-w-[680px] !rounded-2xl"
    >
      <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        <span class="truncate">Tanggal: <strong class="text-slate-800 dark:text-slate-200">{{ formatIndonesianDate(activeMeeting?.tanggalPertemuan) }}</strong></span>
        <span>Tarif Kas: <strong class="text-slate-800 dark:text-slate-200">{{ formatRupiah(activeMeeting?.tarifKas || 7000) }}</strong></span>
      </div>

      <!-- Desktop Table -->
      <div class="hidden sm:block">
        <el-table :data="meetingStudentsStatus" size="small" style="width: 100%" height="320">
          <el-table-column label="Nama Mahasiswa" min-width="160">
            <template #default="{ row }">
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ row.namaLengkap }}</span>
              <div class="text-[11px] text-slate-400">NIM: {{ row.nim }}</div>
            </template>
          </el-table-column>

          <el-table-column label="Status Kas" width="130" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isPaid ? 'success' : 'danger'" size="small" class="!font-bold">
                {{ row.isPaid ? 'SUDAH BAYAR' : 'BELUM BAYAR' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Waktu Bayar / Catatan" min-width="150">
            <template #default="{ row }">
              <span class="text-xs text-slate-600 dark:text-slate-400">{{ row.paidTime || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Cards List -->
      <div class="block sm:hidden max-h-72 overflow-y-auto space-y-2 pr-1">
        <div
          v-for="st in meetingStudentsStatus"
          :key="st.userId"
          class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2"
        >
          <div class="min-w-0">
            <p class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{{ st.namaLengkap }}</p>
            <p class="text-[10px] text-slate-400 font-mono">NIM: {{ st.nim }}</p>
          </div>
          <el-tag :type="st.isPaid ? 'success' : 'danger'" size="small" class="!font-bold shrink-0 text-[10px]">
            {{ st.isPaid ? 'LUNAS' : 'BELUM' }}
          </el-tag>
        </div>
      </div>
    </el-dialog>

    <!-- ========================================== -->
    <!-- DIALOG: Pengingat WhatsApp Pertemuan Kas   -->
    <!-- ========================================== -->
    <el-dialog
      v-model="whatsappReminderDialogVisible"
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
            <h3 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Pengingat WhatsApp Pertemuan Kas</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Preview & sesuaikan pesan pengingat jadwal kas sebelum dikirim ke grup kelas</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Target Meeting Selector & Info Card -->
        <div class="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Pertemuan:</span>
            <el-select
              v-model="selectedWhatsappMeetingId"
              placeholder="Pilih pertemuan..."
              size="small"
              class="w-full sm:!w-72"
              @change="handleWhatsappMeetingSelect"
            >
              <el-option
                v-for="m in activeMeetingsList"
                :key="m.id"
                :label="`Pertemuan ${m.nomorPertemuan} (${formatIndonesianDate(m.tanggalPertemuan)})`"
                :value="m.id"
              />
            </el-select>
          </div>

          <div v-if="targetWhatsappMeeting" class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/30 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Jadwal</span>
              <strong class="text-slate-800 dark:text-slate-200 block">Pertemuan Ke-{{ targetWhatsappMeeting.nomorPertemuan }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Hari / Tanggal</span>
              <strong class="text-slate-800 dark:text-slate-200 block truncate">{{ formatIndonesianDate(targetWhatsappMeeting.tanggalPertemuan) }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Tarif Kas</span>
              <strong class="text-emerald-600 dark:text-emerald-400 font-bold block">{{ formatRupiah(targetWhatsappMeeting.tarifKas || 7000) }}</strong>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block font-medium">Semester</span>
              <strong class="text-slate-800 dark:text-slate-200 block truncate">{{ targetWhatsappMeeting.semester || activeSemester }}</strong>
            </div>
          </div>
        </div>

        <!-- Customization Options -->
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <el-checkbox
              v-model="includePaymentNotes"
              @change="generateWhatsappReminderMessage"
            >
              Sertakan info rekening / instruksi transfer
            </el-checkbox>
            <el-checkbox
              v-model="includeMeetingMateri"
              @change="generateWhatsappReminderMessage"
            >
              Sertakan catatan materi / agenda
            </el-checkbox>
          </div>

          <div v-if="includePaymentNotes" class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Catatan Rekening / Pembayaran Bendahara:
            </label>
            <el-input
              v-model="whatsappPaymentNotes"
              size="small"
              placeholder="Contoh: Transfer ke BCA 123456789 a.n Bendahara atau tunai di kelas"
              clearable
              @input="generateWhatsappReminderMessage"
            />
          </div>

          <div v-if="includeMeetingMateri" class="pt-1">
            <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Catatan / Agenda Pertemuan:
            </label>
            <el-input
              v-model="whatsappMeetingMateri"
              size="small"
              placeholder="Contoh: Diskusi materi perkuliahan & pembayaran kas"
              clearable
              @input="generateWhatsappReminderMessage"
            />
          </div>
        </div>

        <!-- Preview & Editor Area -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Preview Pesan WhatsApp</span>
              <span class="text-[10px] text-slate-400 font-normal">(Bisa diedit langsung sebelum dikirim)</span>
            </label>
            <el-button
              size="small"
              type="info"
              link
              class="!text-xs !font-semibold flex items-center gap-1"
              @click="generateWhatsappReminderMessage"
            >
              <el-icon><RefreshRight /></el-icon>
              Reset ke Template
            </el-button>
          </div>

          <div class="relative">
            <el-input
              v-model="whatsappReminderMessage"
              type="textarea"
              :rows="11"
              class="!font-mono !text-xs !leading-relaxed rounded-xl shadow-xs"
              placeholder="Pesan pengingat WhatsApp akan tampil di sini..."
              resize="vertical"
            />
          </div>
          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            💡 Teks menggunakan format WhatsApp (*tebal*, _miring_). Teks siap dikirim langsung ke grup kelas Anda.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
          <el-button @click="whatsappReminderDialogVisible = false" class="!rounded-xl">
            Tutup
          </el-button>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <el-button
              type="info"
              plain
              class="flex-1 sm:flex-none !rounded-xl !font-bold flex items-center justify-center gap-1.5"
              @click="copyWhatsappReminder"
            >
              <el-icon><DocumentCopy /></el-icon>
              Salin Pesan
            </el-button>

            <el-button
              type="success"
              class="flex-1 sm:flex-none !bg-emerald-600 hover:!bg-emerald-700 !border-none !text-white !rounded-xl !font-bold flex items-center justify-center gap-2 shadow-sm"
              @click="sendWhatsappReminderToGroup"
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { meetingService } from '../../services/meetingService.js';
import { classService } from '../../services/classService.js';
import { paymentService } from '../../services/paymentService.js';
import { userService } from '../../services/userService.js';
import { formatRupiah, rupiahInputFormatter, rupiahInputParser } from '../../utils/currency.js';
import { formatIndonesianDate, formatIndonesianDateTime } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Plus, User, Calendar, FolderAdd, Check, DocumentCopy, RefreshRight } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const savingSemester = ref(false);
const activatingSemester = ref(false);

const currentClass = ref(null);
const meetingsList = ref([]);
const semesterList = ref([]);
const activeSemester = ref('');

// Semester Modal State
const addSemesterDialogVisible = ref(false);
const newSemesterName = ref('');
const setAsActiveClassSemester = ref(true);

// Suggestion options for quick semester name fill
const suggestedSemesters = computed(() => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  return [
    `Semester 1 ${currentYear}/${nextYear}`,
    `Semester 2 ${currentYear}/${nextYear}`,
    `Semester 3 ${nextYear}/${nextYear + 1}`,
    `Semester 4 ${nextYear}/${nextYear + 1}`,
    `Semester Ganjil ${currentYear}/${nextYear}`,
    `Semester Genap ${currentYear}/${nextYear}`
  ];
});

// Meetings Modals State
const addDialogVisible = ref(false);
const cancelDialogVisible = ref(false);
const detailsDialogVisible = ref(false);

const activeMeeting = ref(null);
const cancelReason = ref('');
const meetingStudentsStatus = ref([]);

const addForm = reactive({
  semester: '',
  nomorPertemuan: 1,
  tanggalPertemuan: new Date().toISOString().split('T')[0],
  tarifKas: 7000
});

// Filter meetings strictly by the selected active semester tab
const filteredMeetings = computed(() => {
  if (!activeSemester.value) return meetingsList.value;
  return meetingsList.value.filter(m => m.semester === activeSemester.value);
});

onMounted(async () => {
  await loadMeetings();
});

async function loadMeetings() {
  const classId = authStore.userClassId;
  if (!classId) return;

  loading.value = true;
  try {
    const [cls, allMeetings] = await Promise.all([
      classService.getClassById(classId),
      meetingService.getMeetingsByClass(classId)
    ]);

    currentClass.value = cls;
    meetingsList.value = allMeetings || [];

    // Build unique semester list
    const classSemesters = Array.isArray(cls?.semesters) ? cls.semesters : [];
    const meetingSemesters = (allMeetings || []).map(m => m.semester).filter(Boolean);
    const activeSem = cls?.semesterAktif || authStore.userProfile?.kelasSemester || 'Semester 1 2026/2027';

    const merged = Array.from(new Set([
      ...classSemesters,
      ...meetingSemesters,
      activeSem
    ])).filter(Boolean);

    semesterList.value = merged.length > 0 ? merged : ['Semester 1 2026/2027'];

    // Keep active semester or default to active semester of class
    if (!activeSemester.value || !semesterList.value.includes(activeSemester.value)) {
      activeSemester.value = cls?.semesterAktif && semesterList.value.includes(cls.semesterAktif)
        ? cls.semesterAktif
        : semesterList.value[0];
    }
  } catch (err) {
    ElMessage.error('Gagal memuat data jadwal: ' + err.message);
  } finally {
    loading.value = false;
  }
}

function handleSelectSemester(sem) {
  activeSemester.value = sem;
}

function getMeetingCount(sem) {
  return meetingsList.value.filter(m => m.semester === sem).length;
}

// -------------------------------------------------------------
// Tambah Semester Baru Logic
// -------------------------------------------------------------
function openAddSemesterDialog() {
  // Pre-fill next logical semester name suggestion
  const existingCount = semesterList.value.length;
  const nextNum = existingCount + 1;
  const currentYear = new Date().getFullYear();
  newSemesterName.value = `Semester ${nextNum} ${currentYear}/${currentYear + 1}`;
  setAsActiveClassSemester.value = true;
  addSemesterDialogVisible.value = true;
}

async function handleCreateSemester() {
  const semName = newSemesterName.value.trim();
  if (!semName) {
    ElMessage.warning('Masukkan nama semester baru');
    return;
  }

  if (semesterList.value.includes(semName)) {
    ElMessage.warning(`Semester "${semName}" sudah ada!`);
    activeSemester.value = semName;
    addSemesterDialogVisible.value = false;
    return;
  }

  savingSemester.value = true;
  try {
    const classId = authStore.userClassId;
    const updatedSemesters = [...semesterList.value, semName];

    // Persist new semester into class record in Firestore
    const updatePayload = {
      semesters: updatedSemesters
    };

    if (setAsActiveClassSemester.value) {
      updatePayload.semesterAktif = semName;
    }

    if (classId) {
      await classService.updateClass(classId, updatePayload);
      if (currentClass.value) {
        currentClass.value.semesters = updatedSemesters;
        if (setAsActiveClassSemester.value) {
          currentClass.value.semesterAktif = semName;
        }
      }
    }

    semesterList.value = updatedSemesters;
    activeSemester.value = semName; // Immediately switch to the new tab!
    addSemesterDialogVisible.value = false;

    ElMessage.success(`Semester "${semName}" berhasil dibuat! Tab baru telah aktif.`);
  } catch (err) {
    ElMessage.error('Gagal menambahkan semester: ' + err.message);
  } finally {
    savingSemester.value = false;
  }
}

async function handleSetActiveSemester(sem) {
  const classId = authStore.userClassId;
  if (!classId || !sem) return;

  activatingSemester.value = true;
  try {
    await classService.updateClass(classId, { semesterAktif: sem });
    if (currentClass.value) {
      currentClass.value.semesterAktif = sem;
    }
    ElMessage.success(`"${sem}" sekarang menjadi semester yang sedang berjalan! Pembayaran kas dan halaman tunggakan otomatis difokuskan ke semester ini.`);
  } catch (err) {
    ElMessage.error('Gagal mengaktifkan semester: ' + err.message);
  } finally {
    activatingSemester.value = false;
  }
}

// -------------------------------------------------------------
// Tambah Pertemuan Baru Logic
// -------------------------------------------------------------
function openAddMeetingDialog() {
  addForm.semester = activeSemester.value || semesterList.value[0] || 'Semester 1 2026/2027';
  addForm.tanggalPertemuan = new Date().toISOString().split('T')[0];
  addForm.tarifKas = currentClass.value?.tarifKas || 7000;
  updateNextMeetingNumber();
  addDialogVisible.value = true;
}

function updateNextMeetingNumber() {
  const targetSem = addForm.semester || activeSemester.value;
  const meetingsInSem = meetingsList.value.filter(m => m.semester === targetSem);
  if (meetingsInSem.length > 0) {
    addForm.nomorPertemuan = Math.max(...meetingsInSem.map(m => m.nomorPertemuan || 0)) + 1;
  } else {
    addForm.nomorPertemuan = 1;
  }
}

async function handleCreateMeeting() {
  if (!addForm.tanggalPertemuan) {
    ElMessage.warning('Pilih tanggal pertemuan');
    return;
  }

  const targetSemester = addForm.semester || activeSemester.value;
  if (!targetSemester) {
    ElMessage.warning('Pilih semester untuk pertemuan ini');
    return;
  }

  saving.value = true;
  try {
    await meetingService.createMeeting({
      kelasId: authStore.userClassId,
      semester: targetSemester,
      nomorPertemuan: addForm.nomorPertemuan,
      tanggalPertemuan: addForm.tanggalPertemuan,
      tarifKas: addForm.tarifKas,
      createdBy: authStore.user?.uid
    });

    ElMessage.success(`Pertemuan ke-${addForm.nomorPertemuan} (${targetSemester}) berhasil dibuat!`);
    addDialogVisible.value = false;
    
    // Switch to that semester tab so the user sees their new meeting immediately
    activeSemester.value = targetSemester;
    await loadMeetings();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal membuat pertemuan');
  } finally {
    saving.value = false;
  }
}

// -------------------------------------------------------------
// Pembatalan & Rincian Pertemuan
// -------------------------------------------------------------
function openCancelDialog(meeting) {
  activeMeeting.value = meeting;
  cancelReason.value = '';
  cancelDialogVisible.value = true;
}

async function handleConfirmCancel() {
  if (!cancelReason.value.trim()) {
    ElMessage.warning('Masukkan alasan pembatalan pertemuan');
    return;
  }

  saving.value = true;
  try {
    await meetingService.cancelMeeting(activeMeeting.value.id, cancelReason.value, authStore.user?.uid);
    ElMessage.success('Pertemuan berhasil dibatalkan');
    cancelDialogVisible.value = false;
    await loadMeetings();
  } catch (err) {
    ElMessage.error(err.message || 'Gagal membatalkan pertemuan');
  } finally {
    saving.value = false;
  }
}

async function openMeetingDetails(meeting) {
  activeMeeting.value = meeting;
  detailsDialogVisible.value = true;

  try {
    const [students, payments] = await Promise.all([
      userService.getUsersByClass(authStore.userClassId),
      paymentService.getPaymentsByClass(authStore.userClassId)
    ]);

    const paidPaymentMap = new Map();
    payments.forEach(p => {
      if (Array.isArray(p.meetingIds) && p.meetingIds.includes(meeting.id)) {
        paidPaymentMap.set(p.userId, p);
      }
    });

    const onlyStudents = (students || []).filter(st => st.role === 'USER' && st.isActive !== false);

    meetingStudentsStatus.value = onlyStudents.map(st => {
      const p = paidPaymentMap.get(st.id);
      return {
        namaLengkap: st.namaLengkap,
        nim: st.nim,
        isPaid: !!p,
        paidTime: p ? formatIndonesianDateTime(p.createdAt) : null
      };
    });
  } catch (err) {
    ElMessage.error('Gagal memuat status mahasiswa: ' + err.message);
  }
}

// -------------------------------------------------------------
// Fitur Pengingat WhatsApp Pertemuan Kas
// -------------------------------------------------------------
const whatsappReminderDialogVisible = ref(false);
const selectedWhatsappMeetingId = ref('');
const whatsappReminderMessage = ref('');
const includePaymentNotes = ref(true);
const whatsappPaymentNotes = ref('Pembayaran kas dapat disetor tunai saat perkuliahan atau transfer ke rekening/Dana Bendahara.');
const includeMeetingMateri = ref(true);
const whatsappMeetingMateri = ref('');

const activeMeetingsList = computed(() => {
  return meetingsList.value.filter(m => m.status !== 'CANCELLED');
});

const nextUpcomingMeeting = computed(() => {
  if (meetingsList.value.length === 0) return null;

  const candidateList = meetingsList.value.filter(m => m.status !== 'CANCELLED');
  if (candidateList.length === 0) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Cari pertemuan yang tanggalnya >= hari ini di semester aktif
  const activeSemUpcoming = candidateList
    .filter(m => m.semester === activeSemester.value && (m.tanggalPertemuan >= todayStr || m.status === 'UPCOMING'))
    .sort((a, b) => (a.tanggalPertemuan || '').localeCompare(b.tanggalPertemuan || ''));

  if (activeSemUpcoming.length > 0) return activeSemUpcoming[0];

  // 2. Cari di seluruh semester
  const allUpcoming = candidateList
    .filter(m => m.tanggalPertemuan >= todayStr || m.status === 'UPCOMING')
    .sort((a, b) => (a.tanggalPertemuan || '').localeCompare(b.tanggalPertemuan || ''));

  if (allUpcoming.length > 0) return allUpcoming[0];

  // 3. Fallback ke pertemuan paling akhir di semester aktif
  const activeSemMeetings = candidateList.filter(m => m.semester === activeSemester.value);
  if (activeSemMeetings.length > 0) {
    return activeSemMeetings[activeSemMeetings.length - 1];
  }

  return candidateList[candidateList.length - 1];
});

const targetWhatsappMeeting = computed(() => {
  if (!selectedWhatsappMeetingId.value) return null;
  return meetingsList.value.find(m => m.id === selectedWhatsappMeetingId.value) || null;
});

function formatFullDateWithDay(dateInput) {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return formatIndonesianDate(dateInput);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return formatIndonesianDate(dateInput);
  }
}

function openNextMeetingWhatsappModal() {
  const next = nextUpcomingMeeting.value;
  if (!next) {
    ElMessage.warning('Belum ada jadwal pertemuan kas yang tersedia.');
    return;
  }
  selectedWhatsappMeetingId.value = next.id;
  whatsappMeetingMateri.value = next.materi || next.keterangan || '';
  generateWhatsappReminderMessage();
  whatsappReminderDialogVisible.value = true;
}

function openMeetingWhatsappModal(meeting) {
  if (!meeting) return;
  selectedWhatsappMeetingId.value = meeting.id;
  whatsappMeetingMateri.value = meeting.materi || meeting.keterangan || '';
  generateWhatsappReminderMessage();
  whatsappReminderDialogVisible.value = true;
}

function handleWhatsappMeetingSelect() {
  if (targetWhatsappMeeting.value) {
    whatsappMeetingMateri.value = targetWhatsappMeeting.value.materi || targetWhatsappMeeting.value.keterangan || '';
  }
  generateWhatsappReminderMessage();
}

function generateWhatsappReminderMessage() {
  if (!targetWhatsappMeeting.value) return;

  const m = targetWhatsappMeeting.value;
  const className = currentClass.value?.namaKelas || authStore.userClassName || 'Kelas';
  const semesterName = m.semester || activeSemester.value || 'Semester Berjalan';
  const meetingDateFormatted = formatFullDateWithDay(m.tanggalPertemuan);
  const tarifFormatted = formatRupiah(m.tarifKas || 7000);

  let text = `🔔 *PENGINGAT KAS PERTEMUAN BERIKUTNYA*\n`;
  if (className) {
    text += `🏛 *Kelas:* ${className}\n`;
  }
  text += `📚 *Semester:* ${semesterName}\n\n`;

  text += `Halo rekan-rekan mahasiswa! 👋\n`;
  text += `Mengingatkan kembali bahwa jadwal kas perkuliahan berikutnya akan dilaksanakan pada:\n\n`;
  text += `📌 *Pertemuan:* Ke-${m.nomorPertemuan}\n`;
  text += `📅 *Hari/Tanggal:* ${meetingDateFormatted}\n`;
  text += `💰 *Tarif Kas:* ${tarifFormatted} / Mahasiswa\n`;

  const agenda = whatsappMeetingMateri.value?.trim() || m.materi || m.keterangan;
  if (includeMeetingMateri.value && agenda) {
    text += `📋 *Agenda/Materi:* ${agenda}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (includePaymentNotes.value && whatsappPaymentNotes.value?.trim()) {
    text += `\n📝 *INFO PEMBAYARAN:*\n${whatsappPaymentNotes.value.trim()}\n\n`;
  } else {
    text += `\n💡 *Catatan:* Mohon dapat mempersiapkan uang pas saat perkuliahan berlangsung atau setor melalui bendahara kelas. Terima kasih atas kerja samanya! 🙏✨\n\n`;
  }

  text += `_Pesan pengingat resmi via MyKas_`;

  whatsappReminderMessage.value = text;
}

async function copyWhatsappReminder() {
  if (!whatsappReminderMessage.value.trim()) {
    ElMessage.warning('Pesan WhatsApp kosong.');
    return;
  }
  try {
    if (navigator?.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(whatsappReminderMessage.value);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = whatsappReminderMessage.value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    ElMessage.success('Pesan pengingat WhatsApp berhasil disalin!');
  } catch (err) {
    ElMessage.error('Gagal menyalin: ' + err.message);
  }
}

function sendWhatsappReminderToGroup() {
  if (!whatsappReminderMessage.value.trim()) {
    ElMessage.warning('Pesan WhatsApp tidak boleh kosong.');
    return;
  }
  const text = encodeURIComponent(whatsappReminderMessage.value);
  const waUrl = `https://api.whatsapp.com/send?text=${text}`;
  window.open(waUrl, '_blank');
}
</script>

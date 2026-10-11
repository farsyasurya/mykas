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
      <div v-if="authStore.isAdmin" class="flex items-center gap-2 w-full sm:w-auto">
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

            <el-table-column label="Rincian Pembayaran" width="180" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" plain @click="openMeetingDetails(row)" class="!rounded-lg">
                  <el-icon class="mr-1"><User /></el-icon> Cek Mahasiswa
                </el-button>
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
            class="!w-full"
          />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { meetingService } from '../../services/meetingService.js';
import { classService } from '../../services/classService.js';
import { paymentService } from '../../services/paymentService.js';
import { userService } from '../../services/userService.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate, formatIndonesianDateTime } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Plus, User, Calendar, FolderAdd, Check } from '@element-plus/icons-vue';

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

    const onlyStudents = (students || []).filter(st => st.role === 'USER');

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
</script>

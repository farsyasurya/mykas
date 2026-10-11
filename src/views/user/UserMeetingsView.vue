<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Jadwal Kas Pertemuan Kelas</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pantau seluruh agenda pertemuan perkuliahan dan status pembayaran kas masing-masing pertemuan.
        </p>
      </div>

      <div class="bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
        Tarif Kas: Rp7.000 / Pertemuan
      </div>
    </div>

    <!-- Semester Tabs for Students if Multiple Semesters Exist -->
    <div v-if="semesterList.length > 1" class="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar transition-colors">
      <button
        v-for="sem in semesterList"
        :key="sem"
        @click="activeSemester = sem"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
        :class="activeSemester === sem
          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'"
      >
        <el-icon><Calendar /></el-icon>
        <span>{{ sem }}</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="filteredMeetings.length === 0 && !loading" class="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <el-icon :size="36" class="text-slate-300 dark:text-slate-600 mb-2"><Calendar /></el-icon>
      <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Belum Ada Pertemuan di {{ activeSemester || 'Semester Ini' }}</h3>
      <p class="text-xs text-slate-400 mt-1">Admin kelas belum menambahkan jadwal pertemuan kas pada semester ini.</p>
    </div>

    <!-- Meetings Schedule Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" v-loading="loading">
      <div
        v-for="m in filteredMeetings"
        :key="m.id"
        class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border shadow-sm transition-all flex flex-col justify-between"
        :class="isMeetingPaid(m.id) ? 'border-emerald-200 dark:border-emerald-800/80 shadow-emerald-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="px-3 py-1 rounded-xl text-xs font-bold" :class="isMeetingPaid(m.id) ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'">
              Pertemuan Ke-{{ m.nomorPertemuan }}
            </span>

            <el-tag :type="isMeetingPaid(m.id) ? 'success' : 'danger'" size="small" class="!font-bold">
              {{ isMeetingPaid(m.id) ? 'SUDAH LUNAS' : 'BELUM DIBAYAR' }}
            </el-tag>
          </div>

          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
            {{ formatIndonesianDate(m.tanggalPertemuan) }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Semester: {{ m.semester }}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-slate-400">Tarif Wajib:</span>
          <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(m.tarifKas || 7000) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { meetingService } from '../../services/meetingService.js';
import { paymentService } from '../../services/paymentService.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { Calendar } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);
const meetingsList = ref([]);
const paidMeetingIds = ref(new Set());
const semesterList = ref([]);
const activeSemester = ref('');

const filteredMeetings = computed(() => {
  if (!activeSemester.value) return meetingsList.value;
  return meetingsList.value.filter(m => m.semester === activeSemester.value);
});

onMounted(async () => {
  const classId = authStore.userClassId;
  const userId = authStore.user?.uid;
  if (!classId || !userId) return;

  loading.value = true;
  try {
    const [meetings, paidIds] = await Promise.all([
      meetingService.getMeetingsByClass(classId),
      paymentService.getPaidMeetingIdsForUser(userId)
    ]);
    meetingsList.value = meetings;
    paidMeetingIds.value = paidIds;

    const semesters = Array.from(new Set(meetings.map(m => m.semester).filter(Boolean)));
    semesterList.value = semesters;
    if (semesters.length > 0) {
      activeSemester.value = semesters[semesters.length - 1];
    }
  } catch (err) {
    ElMessage.error('Gagal memuat jadwal pertemuan: ' + err.message);
  } finally {
    loading.value = false;
  }
});

function isMeetingPaid(meetingId) {
  return paidMeetingIds.value.has(meetingId);
}
</script>

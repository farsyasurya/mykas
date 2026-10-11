<template>
  <div class="space-y-6">
    <!-- Student Profile Greeting Banner -->
    <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/15 relative overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black border border-white/30 shadow-inner">
            {{ userInitial }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Halo, {{ authStore.userProfile?.namaPanggilan || authStore.userProfile?.namaLengkap }}!
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                Mahasiswa
              </span>
            </div>
            <p class="text-emerald-100 text-xs sm:text-sm mt-1">
              NIM: <span class="font-mono font-bold">{{ authStore.userProfile?.nim }}</span> • Kelas: <strong>{{ authStore.userProfile?.kelasNama }}</strong>
            </p>
          </div>
        </div>

        <!-- Telegram status pill -->
        <router-link to="/user/telegram" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors border border-white/20 text-xs text-white">
          <span class="w-2 h-2 rounded-full" :class="authStore.userProfile?.telegramConnected ? 'bg-emerald-400' : 'bg-amber-300'"></span>
          <span>Telegram: {{ authStore.userProfile?.telegramConnected ? 'Terhubung' : 'Belum Terhubung' }}</span>
        </router-link>
      </div>
    </div>

    <!-- 4 Key Personal Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Status Pembayaran Saya"
        :value="myPaymentStatus"
        :subtitle="myPaymentStatus === 'LUNAS' ? (totalDueMeetingsCount > 0 ? `Lunas sampai saat ini (${paidMeetingsCount} terbayar)` : 'Belum ada kewajiban kas') : `${unpaidDueCount} pertemuan belum lunas`"
        :icon-bg-class="myPaymentStatus === 'LUNAS' ? 'bg-emerald-600 shadow-emerald-500/25' : 'bg-rose-600 shadow-rose-500/25'"
      >
        <template #icon>
          <el-icon :size="22">
            <Check v-if="myPaymentStatus === 'LUNAS'" />
            <Warning v-else />
          </el-icon>
        </template>
      </StatCard>

      <StatCard
        title="Total Kas Dibayar"
        :value="formatRupiah(myTotalKasPaid)"
        :subtitle="`Kewajiban saat ini: ${formatRupiah(myTotalObligation)}`"
        icon-bg-class="bg-teal-600 shadow-teal-500/25"
      >
        <template #icon><el-icon :size="22"><Calendar /></el-icon></template>
      </StatCard>

      <StatCard
        title="Sisa Tunggakan Kas"
        :value="formatRupiah(myRemainingDebt)"
        :subtitle="unpaidDueCount === 0 ? 'Tidak ada tunggakan jatuh tempo' : `${unpaidDueCount} pertemuan belum dibayar`"
        :icon-bg-class="myRemainingDebt > 0 ? 'bg-rose-600 shadow-rose-500/25' : 'bg-slate-700 shadow-slate-600/25'"
      >
        <template #icon><el-icon :size="22"><SoldOut /></el-icon></template>
      </StatCard>

      <StatCard
        title="Saldo Tabungan Saya"
        :value="formatRupiah(authStore.userProfile?.tabungan || 0)"
        subtitle="Dapat digunakan atau dikembalikan"
        icon-bg-class="bg-amber-600 shadow-amber-500/25"
      >
        <template #icon><el-icon :size="22"><Coin /></el-icon></template>
      </StatCard>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: My Recent Payments History -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 transition-colors">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Riwayat Pembayaran Kas Saya</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Histori setoran kas dan alokasi tabungan</p>
          </div>
          <router-link to="/user/savings" class="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold">
            Cek Tabungan →
          </router-link>
        </div>

        <!-- Desktop Table (sm and above) -->
        <div class="hidden sm:block">
          <el-table :data="myPayments" v-loading="loading" size="small" style="width: 100%" empty-text="Belum ada transaksi pembayaran kas">
            <el-table-column label="Waktu Setoran" min-width="150">
              <template #default="{ row }">
                <div class="font-semibold text-slate-800 dark:text-slate-200 text-xs">{{ formatIndonesianDateTime(row.createdAt) }}</div>
              </template>
            </el-table-column>

            <el-table-column label="Pertemuan" width="110" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.jumlahPertemuan }} Pertemuan</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Metode" width="90" align="center">
              <template #default="{ row }">
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">{{ row.tipePembayaran }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Masuk Kas" width="120" align="right">
              <template #default="{ row }">
                <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(row.totalMasukKas) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Masuk Tabungan" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.totalMasukTabungan > 0 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'">
                  {{ formatRupiah(row.totalMasukTabungan) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile Cards (< sm) -->
        <div class="block sm:hidden space-y-2.5" v-loading="loading">
          <div v-if="myPayments.length === 0" class="text-center py-6 text-xs text-slate-400">
            Belum ada transaksi pembayaran kas
          </div>

          <div
            v-for="p in myPayments"
            :key="p.id"
            class="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{{ formatIndonesianDateTime(p.createdAt) }}</p>
                <p class="text-[10px] text-slate-400 font-medium">{{ p.jumlahPertemuan }} Pertemuan • {{ p.tipePembayaran }}</p>
              </div>
              <el-button size="small" text type="primary" class="!text-xs shrink-0 !font-semibold" @click="openPaymentDetail(p)">
                Detail
              </el-button>
            </div>

            <div class="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
              <span class="text-slate-500 text-[11px]">Kas: <strong class="text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(p.totalMasukKas) }}</strong></span>
              <span v-if="p.totalMasukTabungan > 0" class="text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                Tabungan: +{{ formatRupiah(p.totalMasukTabungan) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right 1 Col: Next Meeting & Transparency Snippet -->
      <div class="space-y-6">
        <!-- Next Meeting Card -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 transition-colors">
          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Pertemuan Terdekat</h3>

          <div v-if="nextMeeting" class="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-600 text-white">
                Pertemuan Ke-{{ nextMeeting.nomorPertemuan }}
              </span>
              <el-tag :type="isNextMeetingPaid ? 'success' : 'danger'" size="small" class="!font-bold">
                {{ isNextMeetingPaid ? 'SUDAH LUNAS' : 'BELUM DIBAYAR' }}
              </el-tag>
            </div>

            <h4 class="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-3">
              {{ formatIndonesianDate(nextMeeting.tanggalPertemuan) }}
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Tarif Kas: <strong class="text-slate-800 dark:text-slate-200">{{ formatRupiah(nextMeeting.tarifKas || 7000) }}</strong>
            </p>
          </div>

          <div v-else class="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Tidak ada pertemuan terdekat yang dijadwalkan
          </div>
        </div>

        <!-- Class Financial Transparency Banner -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Transparansi Kas Kelas</h3>
            <router-link to="/user/reports" class="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold">
              Lihat Laporan →
            </router-link>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Laporan bulanan kas kelas dan audit pengeluaran terbuka untuk seluruh anggota kelas.
          </p>

          <router-link to="/user/reports">
            <el-button class="w-full !rounded-xl !border-slate-200 dark:!border-slate-700 text-slate-700 dark:text-slate-300">
              <el-icon class="mr-1"><Document /></el-icon> Buka Laporan Kas Kelas
            </el-button>
          </router-link>
        </div>
    </div>

    <!-- Detail Transaksi Modal (Mobile Dialog) -->
    <el-dialog
      v-model="paymentDetailDialogVisible"
      title="Rincian Pembayaran Saya"
      width="92%"
      class="!max-w-[440px] !rounded-2xl"
    >
      <div v-if="selectedPayment" class="space-y-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
          <p class="text-slate-400">Waktu Pembayaran</p>
          <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">{{ formatIndonesianDateTime(selectedPayment.createdAt) }}</h4>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Metode Bayar</span>
            <el-tag size="small">{{ selectedPayment.tipePembayaran }}</el-tag>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Jumlah Pertemuan</span>
            <strong class="text-slate-800 dark:text-slate-200">{{ selectedPayment.jumlahPertemuan }} Pertemuan</strong>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Masuk Kas Rutin</span>
            <strong class="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{{ formatRupiah(selectedPayment.totalMasukKas) }}</strong>
          </div>
          <div class="flex justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
            <span class="text-slate-500">Masuk Tabungan</span>
            <strong class="text-amber-600 dark:text-amber-400 font-mono">{{ formatRupiah(selectedPayment.totalMasukTabungan) }}</strong>
          </div>
          <div class="flex justify-between p-2.5 rounded-xl border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
            <span class="text-slate-900 dark:text-slate-100">Total Nominal</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(selectedPayment.nominalPembayaran) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="paymentDetailDialogVisible = false" class="!rounded-xl">Tutup</el-button>
      </template>
    </el-dialog>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { paymentService } from '../../services/paymentService.js';
import { meetingService } from '../../services/meetingService.js';
import { classService } from '../../services/classService.js';
import { formatRupiah } from '../../utils/currency.js';
import { formatIndonesianDate, formatIndonesianDateTime } from '../../utils/date.js';
import StatCard from '../../components/dashboard/StatCard.vue';
import { ElMessage } from 'element-plus';
import { Check, Warning, Calendar, SoldOut, Coin, Document } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const loading = ref(false);

const currentClass = ref(null);
const myPayments = ref([]);
const classMeetings = ref([]);
const nextMeeting = ref(null);

const paymentDetailDialogVisible = ref(false);
const selectedPayment = ref(null);
function openPaymentDetail(p) {
  selectedPayment.value = p;
  paymentDetailDialogVisible.value = true;
}

const userInitial = computed(() => {
  const name = authStore.userProfile?.namaPanggilan || authStore.userProfile?.namaLengkap || 'U';
  return name.charAt(0).toUpperCase();
});

const runningSemester = computed(() => {
  return currentClass.value?.semesterAktif || authStore.userProfile?.kelasSemester || 'Semester 1 2026/2027';
});

const paidMeetingIdsSet = computed(() => {
  const set = new Set();
  myPayments.value.forEach(p => {
    if (Array.isArray(p.meetingIds)) {
      p.meetingIds.forEach(id => set.add(id));
    }
  });
  return set;
});

// Tanggal hari ini dalam format lokal YYYY-MM-DD
const todayStr = computed(() => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// Hanya evaluasi pertemuan khusus semester yang sedang berjalan
const activeMeetings = computed(() => {
  const sem = runningSemester.value;
  return classMeetings.value.filter(m => m.status !== 'CANCELLED' && (!sem || m.semester === sem));
});

// Pertemuan yang wajib dibayar (sudah selesai atau tanggalnya <= hari ini)
const dueMeetings = computed(() => {
  return activeMeetings.value.filter(m => 
    m.status === 'COMPLETED' || (m.tanggalPertemuan && m.tanggalPertemuan <= todayStr.value)
  );
});

const totalMeetingsCount = computed(() => activeMeetings.value.length);
const totalDueMeetingsCount = computed(() => dueMeetings.value.length);

const paidMeetingsCount = computed(() => {
  return activeMeetings.value.filter(m => paidMeetingIdsSet.value.has(m.id)).length;
});

const duePaidMeetingsCount = computed(() => {
  return dueMeetings.value.filter(m => paidMeetingIdsSet.value.has(m.id)).length;
});

// Efektif pembayaran untuk pertemuan wajib
const effectivePaidDueCount = computed(() => {
  return Math.max(duePaidMeetingsCount.value, Math.min(paidMeetingsCount.value, totalDueMeetingsCount.value));
});

const unpaidDueCount = computed(() => {
  return Math.max(0, totalDueMeetingsCount.value - effectivePaidDueCount.value);
});

const myTotalKasPaid = computed(() => {
  return activeMeetings.value
    .filter(m => paidMeetingIdsSet.value.has(m.id))
    .reduce((sum, m) => sum + (Number(m.tarifKas) || 7000), 0);
});

const myTotalObligation = computed(() => {
  return dueMeetings.value
    .reduce((sum, m) => sum + (Number(m.tarifKas) || 7000), 0);
});

const myRemainingDebt = computed(() => {
  return dueMeetings.value
    .filter(m => !paidMeetingIdsSet.value.has(m.id))
    .reduce((sum, m) => sum + (Number(m.tarifKas) || 7000), 0);
});

const myPaymentStatus = computed(() => {
  if (totalDueMeetingsCount.value === 0 || unpaidDueCount.value === 0) return 'LUNAS';
  if (paidMeetingsCount.value > 0) return 'BELUM LUNAS';
  return 'BELUM ADA PEMBAYARAN';
});

const isNextMeetingPaid = computed(() => {
  if (!nextMeeting.value) return false;
  return paidMeetingIdsSet.value.has(nextMeeting.value.id);
});

onMounted(async () => {
  const userId = authStore.user?.uid;
  const classId = authStore.userClassId;
  if (!userId || !classId) return;

  loading.value = true;
  try {
    const [payments, meetings, cls] = await Promise.all([
      paymentService.getPaymentsByUser(userId),
      meetingService.getMeetingsByClass(classId),
      classService.getClassById(classId)
    ]);
    myPayments.value = payments;
    classMeetings.value = meetings;
    currentClass.value = cls;

    const today = new Date().toISOString().split('T')[0];
    const sem = cls?.semesterAktif || authStore.userProfile?.kelasSemester;
    const upcoming = meetings.filter(m => m.status === 'UPCOMING' && m.tanggalPertemuan >= today && (!sem || m.semester === sem));
    nextMeeting.value = upcoming.length > 0 ? upcoming[0] : null;
  } catch (err) {
    ElMessage.error('Gagal memuat dashboard mahasiswa: ' + err.message);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-4 w-full min-w-0 overflow-hidden">
    <!-- Top Compact Header -->
    <div class="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors w-full min-w-0">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
          <el-icon :size="20"><CirclePlus /></el-icon>
        </div>
        <div class="min-w-0 flex-1">
          <h1 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">Input Bayar Kas Kelas</h1>
          <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight truncate">
            Tarif dihitung otomatis sesuai pertemuan • Kelebihan dialokasikan ke tabungan
          </p>
        </div>
      </div>

      <router-link to="/admin/payments" class="w-full sm:w-auto shrink-0">
        <el-button size="small" class="w-full sm:w-auto !rounded-xl text-xs dark:!border-slate-700">
          ← Kembali ke Histori
        </el-button>
      </router-link>
    </div>

    <!-- 2-Column Side-by-Side Layout (No Page Scroll) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full min-w-0">
      <!-- LEFT COLUMN (7 Cols): Mahasiswa & Pilihan Pertemuan -->
      <div class="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-3.5 sm:p-5 space-y-4 transition-colors w-full min-w-0">
        <!-- 1. Searchable Student Select -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Pilih Mahasiswa
          </label>
          <el-select
            v-model="selectedStudentId"
            placeholder="Ketik nama atau NIM mahasiswa..."
            filterable
            class="w-full"
            @change="handleStudentSelect"
          >
            <el-option
              v-for="s in studentsList"
              :key="s.id"
              :label="`${s.namaLengkap} (${s.nim})`"
              :value="s.id"
            />
          </el-select>
        </div>

        <!-- 2. Student Badge / Savings Banner (Compact) -->
        <div
          v-if="selectedStudent"
          class="p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-blue-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs w-full min-w-0"
        >
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <el-avatar :size="30" class="!bg-emerald-600 text-white font-bold text-xs shrink-0">
              {{ (selectedStudent.namaPanggilan || selectedStudent.namaLengkap || 'M').charAt(0) }}
            </el-avatar>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-slate-900 dark:text-slate-100 truncate block">{{ selectedStudent.namaLengkap }}</span>
              <span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">NIM: {{ selectedStudent.nim }}</span>
            </div>
          </div>
          <div class="text-left sm:text-right pt-1.5 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mr-1.5">Tabungan:</span>
            <span class="font-bold text-amber-700 dark:text-amber-400 font-mono">{{ formatRupiah(selectedStudent.tabungan || 0) }}</span>
          </div>
        </div>

        <!-- 3. Pertemuan Selection Grid (Compact & Scrollable container if many) -->
        <div class="w-full min-w-0">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 w-full min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Pilih Pertemuan
              </span>
              <el-tag size="small" type="success" effect="plain" class="!font-bold !rounded-lg text-[10px]">
                {{ runningSemester }}
              </el-tag>
              <span class="text-emerald-700 dark:text-emerald-400 font-semibold text-xs ml-0.5">
                ({{ selectedMeetingIds.length }} dipilih)
              </span>
            </div>

            <div class="flex items-center gap-2 text-xs shrink-0">
              <el-button
                size="small"
                type="primary"
                link
                class="!text-xs !p-0"
                @click="selectAllUnpaidMeetings"
                :disabled="!selectedStudent || availableUnpaidMeetings.length === 0"
              >
                Pilih Semua Belum Lunas
              </el-button>
              <span class="text-slate-300 dark:text-slate-600">|</span>
              <el-button
                size="small"
                link
                class="!text-xs text-slate-500 dark:text-slate-400 !p-0"
                @click="selectedMeetingIds = []"
                :disabled="selectedMeetingIds.length === 0"
              >
                Reset
              </el-button>
            </div>
          </div>

          <!-- Empty States -->
          <div
            v-if="!selectedStudent"
            class="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400"
          >
            Pilih mahasiswa di atas untuk menampilkan pertemuan yang belum dibayar di semester yang sedang berjalan.
          </div>

          <div
            v-else-if="activeSemesterMeetings.length === 0"
            class="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400"
          >
            Belum ada jadwal pertemuan yang dibuat untuk semester yang sedang berjalan ({{ runningSemester }}).
          </div>

          <div
            v-else-if="availableUnpaidMeetings.length === 0"
            class="py-6 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300"
          >
            <el-icon class="mr-1 text-emerald-600"><Check /></el-icon>
            Mahasiswa ini sudah <strong>LUNAS</strong> untuk seluruh pertemuan di semester yang sedang berjalan ({{ runningSemester }}).
          </div>

          <!-- Scrollable meetings grid with fixed max-height -->
          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1"
          >
            <div
              v-for="m in activeSemesterMeetings"
              :key="m.id"
              class="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs"
              :class="[
                isMeetingAlreadyPaid(m.id)
                  ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                  : selectedMeetingIds.includes(m.id)
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              ]"
              @click="toggleMeetingSelection(m.id)"
            >
              <div class="flex items-center gap-2">
                <el-checkbox
                  :model-value="selectedMeetingIds.includes(m.id)"
                  :disabled="isMeetingAlreadyPaid(m.id)"
                  @change="() => toggleMeetingSelection(m.id)"
                  @click.stop
                />
                <div>
                  <div class="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    Pertemuan {{ m.nomorPertemuan }}
                  </div>
                  <div class="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {{ formatIndonesianDate(m.tanggalPertemuan) }}
                  </div>
                </div>
              </div>

              <div>
                <el-tag
                  v-if="isMeetingAlreadyPaid(m.id)"
                  size="small"
                  type="success"
                  effect="light"
                  class="!font-semibold !text-[10px]"
                >
                  LUNAS
                </el-tag>
                <span v-else class="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                  {{ formatRupiah(m.tarifKas || 7000) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN (5 Cols): Nominal, Kalkulasi & Tombol Simpan -->
      <div class="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-3.5 sm:p-5 space-y-4 flex flex-col justify-between transition-colors w-full min-w-0">
        <div class="space-y-4 w-full min-w-0">
          <div class="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Rincian Pembayaran</h3>
            <p class="text-[11px] text-slate-400">Tentukan nominal setoran dan metode transaksi</p>
          </div>

          <!-- 1. Opsi Bayar Pakai Tabungan Mahasiswa (Muncul jika punya saldo) -->
          <div
            v-if="selectedStudent && (selectedStudent.tabungan || 0) > 0"
            class="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 space-y-2.5 transition-all w-full min-w-0"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <el-icon :size="16"><Coin /></el-icon>
                </div>
                <div class="min-w-0">
                  <span class="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">Pakai Saldo Tabungan</span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">
                    Tersedia: <strong class="text-amber-700 dark:text-amber-300 font-mono">{{ formatRupiah(selectedStudent.tabungan) }}</strong>
                  </span>
                </div>
              </div>
              <el-switch
                v-model="useTabungan"
                active-text="Pakai"
                inactive-text="Tidak"
                inline-prompt
                @change="handleTabunganToggle"
              />
            </div>

            <!-- Rincian Pemotongan Saldo Tabungan -->
            <div v-if="useTabungan" class="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-600 dark:text-slate-300">Tabungan Dipotong:</span>
                <span class="font-bold text-amber-700 dark:text-amber-300 font-mono">{{ formatRupiah(effectiveTabunganUsed) }}</span>
              </div>

              <div class="flex items-center gap-2">
                <el-input-number
                  v-model="nominalTabunganDipakai"
                  :min="0"
                  :max="maxTabunganUsable"
                  :step="1000"
                  :formatter="rupiahInputFormatter"
                  :parser="rupiahInputParser"
                  class="!w-full"
                  @change="handleNominalTabunganChange"
                />
              </div>
              <span class="text-[10px] text-slate-400 block mt-0.5">
                Nominal tabungan: <strong class="text-amber-600 dark:text-amber-400 font-mono">{{ formatRupiah(nominalTabunganDipakai || 0) }}</strong>
              </span>

              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  @click="setTabunganMax"
                  class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 hover:bg-amber-200"
                >
                  Gunakan Maksimal ({{ formatRupiah(maxTabunganUsable) }})
                </button>
                <span v-if="sisaKasWajib === 0" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  ✓ Lunas via Tabungan
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Nominal Uang yang Disetor -->
          <div class="w-full min-w-0">
            <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {{ useTabungan && sisaKasWajib === 0 ? 'Uang Tambahan Disetor (Rp)' : 'Uang Disetor Tunai / Transfer (Rp)' }}
              </label>
              <button
                type="button"
                @click="inputNominal = minRequiredNominal"
                class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                {{ sisaKasWajib === 0 ? 'Rp 0 (Lunas Tabungan)' : `Pas Sisa: ${formatRupiah(minRequiredNominal)}` }}
              </button>
            </div>

            <el-input-number
              v-model="inputNominal"
              :min="minRequiredNominal"
              :step="1000"
              :formatter="rupiahInputFormatter"
              :parser="rupiahInputParser"
              class="!w-full"
            />
            <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>Nominal disetor: <strong class="text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(inputNominal || 0) }}</strong></span>
            </div>

            <!-- Quick Chips / Shortcuts for Nominal -->
            <div class="flex items-center gap-1.5 mt-2 flex-wrap">
              <button
                type="button"
                @click="inputNominal = minRequiredNominal"
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {{ sisaKasWajib === 0 ? 'Pas 0' : 'Pas Sisa' }}
              </button>
              <button
                type="button"
                @click="inputNominal = minRequiredNominal + 5000"
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                +5rb
              </button>
              <button
                type="button"
                @click="inputNominal = minRequiredNominal + 10000"
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                +10rb
              </button>
              <button
                type="button"
                @click="inputNominal = 50000"
                class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                50rb
              </button>
            </div>
          </div>

          <!-- 3. Metode Pembayaran -->
          <div class="w-full min-w-0">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Metode Transaksi
            </label>
            <div v-if="useTabungan && (inputNominal || 0) === 0" class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <el-icon><Check /></el-icon>
              <span>Pembayaran Penuh Menggunakan Saldo Tabungan</span>
            </div>
            <el-radio-group v-else v-model="tipePembayaran" size="default" class="!w-full grid grid-cols-2">
              <el-radio-button value="TRANSFER" class="w-full text-center">Transfer / QRIS</el-radio-button>
              <el-radio-button value="CASH" class="w-full text-center">Tunai (Cash)</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 4. Tanggal Pembayaran (Date only - Hide jam) -->
          <div class="w-full min-w-0">
            <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Tanggal Pembayaran
              </label>
              <button
                type="button"
                @click="paymentDate = getTodayDateString()"
                class="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                Set Hari Ini
              </button>
            </div>
            <el-date-picker
              v-model="paymentDate"
              type="date"
              placeholder="Pilih tanggal transaksi"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="!w-full"
            />
          </div>

          <!-- 5. Real-Time Allocation Display Box (Compact) -->
          <div class="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 w-full min-w-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Alokasi Keuangan Otomatis
            </span>

            <div class="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span class="text-slate-600 dark:text-slate-300">Kebutuhan Kas Kelas ({{ selectedMeetingIds.length }} Ptm):</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(calculatedKasIn) }}</span>
            </div>

            <div v-if="effectiveTabunganUsed > 0" class="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-700/60 text-amber-700 dark:text-amber-400">
              <span>Dipotong dari Tabungan:</span>
              <span class="font-bold font-mono">- {{ formatRupiah(effectiveTabunganUsed) }}</span>
            </div>

            <div class="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span class="text-slate-600 dark:text-slate-300">Setoran Tunai / Transfer:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200 font-mono">{{ formatRupiah(inputNominal || 0) }}</span>
            </div>

            <div class="flex items-center justify-between text-xs py-1">
              <span class="text-slate-600 dark:text-slate-300">Sisa Saldo Tabungan Mahasiswa:</span>
              <span class="font-bold text-amber-600 dark:text-amber-400 font-mono">
                {{ formatRupiah(remainingStudentTabungan) }}
              </span>
            </div>

            <div v-if="calculatedTabunganIn > 0" class="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60 flex items-center gap-1.5 mt-1">
              <el-icon><InfoFilled /></el-icon>
              <span>Kelebihan setoran <strong>{{ formatRupiah(calculatedTabunganIn) }}</strong> otomatis ditambahkan ke tabungan.</span>
            </div>
          </div>
        </div>

        <!-- Tombol Simpan Aksi -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <el-button
            type="primary"
            class="w-full !h-11 !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-bold shadow-md shadow-emerald-600/20"
            :loading="submitting"
            @click="openConfirmationDialog"
          >
            Simpan Transaksi Kas
          </el-button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="Konfirmasi Pembayaran Kas"
      width="460px"
      destroy-on-close
    >
      <div class="space-y-3">
        <p class="text-xs text-slate-600">
          Harap pastikan data transaksi kas berikut sudah benar:
        </p>

        <div class="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs border border-slate-200">
          <div class="flex justify-between">
            <span class="text-slate-500">Mahasiswa:</span>
            <span class="font-bold text-slate-900">{{ selectedStudent?.namaLengkap }} ({{ selectedStudent?.nim }})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Jumlah Pertemuan:</span>
            <span class="font-semibold text-slate-800">{{ selectedMeetingIds.length }} Pertemuan</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Kebutuhan Kas:</span>
            <span class="font-bold text-emerald-600">{{ formatRupiah(calculatedKasIn) }}</span>
          </div>
          <div v-if="effectiveTabunganUsed > 0" class="flex justify-between text-amber-700">
            <span>Pakai Tabungan:</span>
            <span class="font-bold font-mono">- {{ formatRupiah(effectiveTabunganUsed) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Uang Disetor (Tunai/Transfer):</span>
            <span class="font-bold text-slate-900">{{ formatRupiah(inputNominal || 0) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Metode Pembayaran:</span>
            <el-tag size="small" type="info">{{ (inputNominal || 0) === 0 && effectiveTabunganUsed > 0 ? 'TABUNGAN' : tipePembayaran }}</el-tag>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Tanggal Pembayaran:</span>
            <span class="font-semibold text-slate-800">{{ formatIndonesianDate(paymentDate) }}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-slate-200">
            <span class="text-slate-600">Sisa Akhir Tabungan Mahasiswa:</span>
            <span class="font-bold text-amber-600 font-mono">{{ formatRupiah(remainingStudentTabungan) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <el-button @click="confirmDialogVisible = false">Batal</el-button>
          <el-button
            type="primary"
            class="!bg-emerald-600 hover:!bg-emerald-700 !border-none !font-bold !rounded-xl"
            :loading="submitting"
            @click="handleSavePayment"
          >
            Konfirmasi & Simpan
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { userService } from '../../services/userService.js';
import { meetingService } from '../../services/meetingService.js';
import { classService } from '../../services/classService.js';
import { paymentService } from '../../services/paymentService.js';
import { formatRupiah, rupiahInputFormatter, rupiahInputParser } from '../../utils/currency.js';
import { formatIndonesianDate } from '../../utils/date.js';
import { ElMessage } from 'element-plus';
import { CirclePlus, InfoFilled, Check, Coin } from '@element-plus/icons-vue';
import confetti from 'canvas-confetti';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const submitting = ref(false);
const confirmDialogVisible = ref(false);

const currentClass = ref(null);
const studentsList = ref([]);
const meetingsList = ref([]);
const paidMeetingIdsSet = ref(new Set());

const selectedStudentId = ref('');
const selectedMeetingIds = ref([]);
const inputNominal = ref(0);
const tipePembayaran = ref('TRANSFER');

function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const paymentDate = ref(getTodayDateString());
const useTabungan = ref(false);
const nominalTabunganDipakai = ref(0);

const runningSemester = computed(() => {
  return currentClass.value?.semesterAktif || authStore.userProfile?.kelasSemester || 'Semester 1 2026/2027';
});

const selectedStudent = computed(() => {
  return studentsList.value.find(s => s.id === selectedStudentId.value) || null;
});

const studentTabungan = computed(() => {
  return Number(selectedStudent.value?.tabungan) || 0;
});

// Pertemuan khusus semester yang sedang berjalan
const activeSemesterMeetings = computed(() => {
  const sem = runningSemester.value;
  return meetingsList.value.filter(m => (!sem || m.semester === sem) && m.status !== 'CANCELLED');
});

// Pertemuan belum lunas di semester yang sedang berjalan
const availableUnpaidMeetings = computed(() => {
  return activeSemesterMeetings.value.filter(m => !paidMeetingIdsSet.value.has(m.id));
});

const calculatedKasIn = computed(() => {
  return selectedMeetingIds.value.reduce((total, id) => {
    const meeting = meetingsList.value.find(m => m.id === id);
    const tarif = meeting ? (Number(meeting.tarifKas) || 0) : 0;
    return total + tarif;
  }, 0);
});

const maxTabunganUsable = computed(() => {
  return Math.min(studentTabungan.value, calculatedKasIn.value);
});

const effectiveTabunganUsed = computed(() => {
  if (!useTabungan.value) return 0;
  return Math.min(Math.max(0, nominalTabunganDipakai.value), maxTabunganUsable.value);
});

const sisaKasWajib = computed(() => {
  return Math.max(0, calculatedKasIn.value - effectiveTabunganUsed.value);
});

const minRequiredNominal = computed(() => {
  return sisaKasWajib.value;
});

const calculatedTabunganIn = computed(() => {
  const totalResources = (inputNominal.value || 0) + effectiveTabunganUsed.value;
  const diff = totalResources - calculatedKasIn.value;
  return Math.max(0, diff);
});

const remainingStudentTabungan = computed(() => {
  return studentTabungan.value - effectiveTabunganUsed.value + calculatedTabunganIn.value;
});

function handleTabunganToggle(val) {
  if (val) {
    nominalTabunganDipakai.value = maxTabunganUsable.value;
    inputNominal.value = sisaKasWajib.value;
  } else {
    nominalTabunganDipakai.value = 0;
    inputNominal.value = calculatedKasIn.value;
  }
}

function setTabunganMax() {
  nominalTabunganDipakai.value = maxTabunganUsable.value;
  inputNominal.value = sisaKasWajib.value;
}

function handleNominalTabunganChange() {
  if (nominalTabunganDipakai.value > maxTabunganUsable.value) {
    nominalTabunganDipakai.value = maxTabunganUsable.value;
  }
  inputNominal.value = sisaKasWajib.value;
}

function syncNominalWithSelection() {
  if (useTabungan.value) {
    if (nominalTabunganDipakai.value > maxTabunganUsable.value) {
      nominalTabunganDipakai.value = maxTabunganUsable.value;
    }
    inputNominal.value = sisaKasWajib.value;
  } else {
    inputNominal.value = calculatedKasIn.value;
  }
}

onMounted(async () => {
  const classId = authStore.userClassId;
  if (!classId) return;

  try {
    const [students, meetings, cls] = await Promise.all([
      userService.getUsersByClass(classId),
      meetingService.getMeetingsByClass(classId),
      classService.getClassById(classId)
    ]);
    // Hanya tampilkan mahasiswa aktif dengan role USER (admin & super admin serta user nonaktif tidak dikenakan kas)
    studentsList.value = (students || []).filter(s => s.role === 'USER' && s.isActive !== false);
    meetingsList.value = meetings;
    currentClass.value = cls;

    if (route.query.studentId) {
      selectedStudentId.value = route.query.studentId;
      await handleStudentSelect(route.query.studentId);
    }
  } catch (err) {
    ElMessage.error('Gagal memuat data kelas: ' + err.message);
  }
});

async function handleStudentSelect(studentId) {
  selectedMeetingIds.value = [];
  inputNominal.value = 0;
  useTabungan.value = false;
  nominalTabunganDipakai.value = 0;
  if (!studentId) {
    paidMeetingIdsSet.value = new Set();
    return;
  }

  try {
    paidMeetingIdsSet.value = await paymentService.getPaidMeetingIdsForUser(studentId);
  } catch (err) {
    console.error('Error fetching paid meetings:', err);
  }
}

function isMeetingAlreadyPaid(meetingId) {
  return paidMeetingIdsSet.value.has(meetingId);
}

function toggleMeetingSelection(meetingId) {
  if (isMeetingAlreadyPaid(meetingId)) return;

  const idx = selectedMeetingIds.value.indexOf(meetingId);
  if (idx > -1) {
    selectedMeetingIds.value.splice(idx, 1);
  } else {
    selectedMeetingIds.value.push(meetingId);
  }

  syncNominalWithSelection();
}

function selectAllUnpaidMeetings() {
  selectedMeetingIds.value = availableUnpaidMeetings.value.map(m => m.id);
  syncNominalWithSelection();
}

function openConfirmationDialog() {
  if (!selectedStudent.value) {
    ElMessage.warning('Pilih mahasiswa terlebih dahulu');
    return;
  }
  if (selectedMeetingIds.value.length === 0) {
    ElMessage.warning('Pilih minimal satu pertemuan kas yang dibayar');
    return;
  }
  const totalPaid = (inputNominal.value || 0) + effectiveTabunganUsed.value;
  if (totalPaid < calculatedKasIn.value) {
    ElMessage.warning(`Total dana (setoran + tabungan) kurang dari total kas untuk ${selectedMeetingIds.value.length} pertemuan`);
    return;
  }

  confirmDialogVisible.value = true;
}

async function handleSavePayment() {
  submitting.value = true;
  try {
    await paymentService.processPayment({
      kelasId: authStore.userClassId,
      semester: authStore.userProfile?.kelasSemester || 'Ganjil 2026/2027',
      userId: selectedStudent.value.id,
      namaLengkap: selectedStudent.value.namaLengkap,
      namaPanggilan: selectedStudent.value.namaPanggilan,
      nim: selectedStudent.value.nim,
      nominalPembayaran: inputNominal.value || 0,
      nominalDariTabungan: effectiveTabunganUsed.value,
      meetingIds: selectedMeetingIds.value,
      tarifKas: calculatedKasIn.value,
      tipePembayaran: (inputNominal.value || 0) === 0 && effectiveTabunganUsed.value > 0 ? 'TABUNGAN' : tipePembayaran.value,
      createdAt: paymentDate.value ? new Date(paymentDate.value + 'T12:00:00') : new Date(),
      createdBy: authStore.user?.uid
    });

    confirmDialogVisible.value = false;
    ElMessage.success('Transaksi kas berhasil disimpan ke database!');

    // Trigger celebration confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    router.push('/admin/payments');
  } catch (err) {
    ElMessage.error(err.message || 'Gagal menyimpan transaksi kas');
  } finally {
    submitting.value = false;
  }
}
</script>

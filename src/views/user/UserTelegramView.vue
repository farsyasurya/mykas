<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
          <el-icon :size="26"><Bell /></el-icon>
        </div>
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Integrasi Notifikasi Telegram</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Terima pengingat pertemuan H-1, notifikasi konfirmasi pembayaran kas, dan ringkasan tunggakan via Telegram.
          </p>
        </div>
      </div>
    </div>

    <!-- Connection Status Banner -->
    <div
      class="rounded-2xl sm:rounded-3xl p-6 sm:p-8 border transition-all"
      :class="authStore.userProfile?.telegramConnected
        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/15'
        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span
              class="w-3 h-3 rounded-full animate-pulse"
              :class="authStore.userProfile?.telegramConnected ? 'bg-white' : 'bg-amber-400'"
            ></span>
            <span
              class="text-xs font-bold uppercase tracking-wider"
              :class="authStore.userProfile?.telegramConnected ? 'text-emerald-100' : 'text-slate-500'"
            >
              Status Notifikasi
            </span>
          </div>

          <h2
            class="text-2xl font-black tracking-tight"
            :class="authStore.userProfile?.telegramConnected ? 'text-white' : 'text-slate-900'"
          >
            {{ authStore.userProfile?.telegramConnected ? 'Akun Telegram Terhubung' : 'Belum Terhubung ke Telegram' }}
          </h2>

          <p
            class="text-xs sm:text-sm mt-1"
            :class="authStore.userProfile?.telegramConnected ? 'text-emerald-100/90' : 'text-slate-500'"
          >
            {{ authStore.userProfile?.telegramConnected
                ? `Notifikasi aktif ke Chat ID: ${authStore.userProfile?.telegramChatId}`
                : 'Hubungkan bot Telegram MyKas untuk mendapatkan update keuangan kas secara instan.' }}
          </p>
        </div>

        <!-- Action Button depending on connection status -->
        <div class="flex flex-wrap items-center gap-3">
          <template v-if="authStore.userProfile?.telegramConnected">
            <el-button
              type="primary"
              class="!rounded-xl !bg-white !text-emerald-700 hover:!bg-emerald-50 !border-none !font-bold"
              :loading="testingNotif"
              @click="handleTestNotification"
            >
              Tes Notifikasi
            </el-button>

            <el-button
              type="danger"
              class="!rounded-xl !bg-rose-500 hover:!bg-rose-600 !border-none !font-semibold"
              :loading="disconnecting"
              @click="handleDisconnectTelegram"
            >
              Putuskan Koneksi
            </el-button>
          </template>

          <template v-else>
            <el-button
              type="primary"
              class="!rounded-xl !bg-sky-500 hover:!bg-sky-600 !border-none !font-bold"
              :loading="generatingCode"
              @click="handleGeneratePairing"
            >
              Hubungkan Telegram
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- Pairing Code Card (Displayed when user clicks connect) -->
    <div v-if="pairingCode && !authStore.userProfile?.telegramConnected" class="bg-sky-50 border border-sky-200 rounded-3xl p-6 sm:p-8 space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sky-700">Langkah Verifikasi Bot</span>
          <h3 class="text-lg font-bold text-slate-900 mt-1">Kode Pengaitan Sementara Anda</h3>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-200/80 text-sky-800">
          Berlaku 15 Menit
        </span>
      </div>

      <div class="p-4 bg-white rounded-2xl border border-sky-200 text-center space-y-2">
        <p class="text-xs text-slate-500">Kirim perintah berikut ke bot Telegram resmi MyKas:</p>
        <div class="inline-block px-5 py-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-lg font-bold tracking-widest select-all">
          /start {{ pairingCode }}
        </div>
      </div>

      <!-- Quick Deep Link Button -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
        <a
          :href="pairingDeepLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20"
        >
          <el-icon><Promotion /></el-icon> Buka Bot Telegram Otomatis
        </a>

        <!-- Manual Chat ID binding option if webhook/bot is in manual mode -->
        <el-button size="small" text type="primary" @click="manualBindVisible = !manualBindVisible">
          Input Chat ID Manual (Pengujian Dev)
        </el-button>
      </div>

      <!-- Manual Input Option -->
      <div v-if="manualBindVisible" class="pt-4 border-t border-sky-200 flex gap-2">
        <el-input v-model="manualChatId" placeholder="Masukkan Telegram Chat ID Anda" class="!w-64" />
        <el-button type="primary" :loading="bindingManual" @click="handleManualBind" class="!rounded-xl !bg-sky-600 !border-none">
          Simpan Chat ID
        </el-button>
      </div>
    </div>

    <!-- Bot Usage Instructions & Features -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
      <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Jenis Notifikasi Otomatis yang Akan Diterima</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <div class="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <el-icon><Calendar /></el-icon> Pengingat Pertemuan H-1
          </div>
          <p class="text-xs text-slate-600">
            Kirim pemberitahuan otomatis H-1 sebelum tanggal pertemuan kelas berlangsung beserta informasi tarif kas dan status pembayaran Anda.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div class="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
            <el-icon><Warning /></el-icon> Pengingat Tunggakan Kas
          </div>
          <p class="text-xs text-slate-600">
            Kirim pengingat ramah jika ada pertemuan kas yang telah lewat namun belum diselesaikan kewajibannya.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div class="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
            <el-icon><Check /></el-icon> Bukti Penerimaan Setoran
          </div>
          <p class="text-xs text-slate-600">
            Konfirmasi instan saat bendahara/admin kelas mencatat pembayaran Anda lengkap dengan alokasi kas dan tabungan.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div class="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
            <el-icon><Coin /></el-icon> Rekap Bulanan
          </div>
          <p class="text-xs text-slate-600">
            Rangkuman bulanan jumlah pertemuan lunas, saldo tabungan mahasiswa, dan status keuangan kelas.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { userService } from '../../services/userService.js';
import { telegramService } from '../../services/telegramService.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Bell, Promotion, Calendar, Warning, Check, Coin } from '@element-plus/icons-vue';

const authStore = useAuthStore();

const generatingCode = ref(false);
const testingNotif = ref(false);
const disconnecting = ref(false);
const bindingManual = ref(false);

const pairingCode = ref('');
const manualBindVisible = ref(false);
const manualChatId = ref('');

const pairingDeepLink = computed(() => {
  return telegramService.getPairingLink(pairingCode.value);
});

async function handleGeneratePairing() {
  generatingCode.value = true;
  try {
    pairingCode.value = await userService.generateTelegramPairingCode(authStore.user?.uid);
    ElMessage.success('Kode pengaitan berhasil dibuat!');
  } catch (err) {
    ElMessage.error('Gagal membuat kode: ' + err.message);
  } finally {
    generatingCode.value = false;
  }
}

async function handleTestNotification() {
  const chatId = authStore.userProfile?.telegramChatId;
  if (!chatId) {
    ElMessage.warning('Chat ID belum tersedia');
    return;
  }

  testingNotif.value = true;
  try {
    await telegramService.sendTestNotification(chatId);
    ElMessage.success('Pesan tes berhasil dikirim ke Telegram Anda!');
  } catch (err) {
    ElMessage.error(err.message || 'Gagal mengirim pesan tes.');
  } finally {
    testingNotif.value = false;
  }
}

async function handleDisconnectTelegram() {
  try {
    await ElMessageBox.confirm(
      'Apakah Anda yakin ingin memutuskan notifikasi Telegram?',
      'Putuskan Koneksi Telegram',
      { confirmButtonText: 'Putuskan', cancelButtonText: 'Batal', type: 'warning' }
    );

    disconnecting.value = true;
    await userService.disconnectTelegram(authStore.user?.uid);
    await authStore.refreshProfile();
    pairingCode.value = '';
    ElMessage.success('Koneksi Telegram berhasil diputus');
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Gagal memutuskan Telegram');
    }
  } finally {
    disconnecting.value = false;
  }
}

async function handleManualBind() {
  if (!manualChatId.value.trim()) {
    ElMessage.warning('Masukkan Chat ID Telegram');
    return;
  }

  bindingManual.value = true;
  try {
    await userService.bindTelegramChatId(authStore.user?.uid, manualChatId.value);
    await authStore.refreshProfile();
    ElMessage.success('Telegram Chat ID berhasil dihubungkan!');
    manualBindVisible.value = false;
  } catch (err) {
    ElMessage.error(err.message || 'Gagal menghubungkan Chat ID');
  } finally {
    bindingManual.value = false;
  }
}
</script>

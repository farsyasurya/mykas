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

    <!-- Pairing & Connection Options (Displayed when not connected) -->
    <div v-if="!authStore.userProfile?.telegramConnected" class="space-y-4">
      <!-- Option 1: Manual Chat ID (Recommended & Direct) -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4 transition-colors">
        <div class="flex items-center gap-2.5">
          <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">1</span>
          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Hubungkan Langsung dengan Chat ID Telegram (Paling Cepat)</h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Anda dapat langsung memasukkan Telegram Chat ID Anda di bawah ini tanpa harus menunggu respon bot.
        </p>

        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <p class="font-semibold text-slate-800 dark:text-slate-200">💡 Cara mengetahui Chat ID Anda:</p>
          <ol class="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
            <li>Buka Telegram dan cari bot: <a href="https://t.me/userinfobot" target="_blank" class="text-sky-600 font-semibold underline">@userinfobot</a> atau <a href="https://t.me/raw_data_bot" target="_blank" class="text-sky-600 font-semibold underline">@raw_data_bot</a></li>
            <li>Klik <strong>Start</strong> / kirim pesan apa saja.</li>
            <li>Bot akan membalas angka <strong>Id</strong> Anda (contoh: <code>1234567890</code>).</li>
            <li>Salin angka tersebut dan tempelkan ke kolom input di bawah ini.</li>
          </ol>
        </div>

        <div class="flex flex-col sm:flex-row gap-2.5 pt-1">
          <el-input
            v-model="manualChatId"
            placeholder="Masukkan angka Telegram Chat ID Anda (contoh: 123456789)"
            class="flex-1"
            size="large"
          />
          <el-button
            type="primary"
            size="large"
            :loading="bindingManual"
            @click="handleManualBind"
            class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-bold"
          >
            Simpan & Hubungkan
          </el-button>
        </div>
      </div>

      <!-- Option 2: Automated Pairing Code via Bot -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4 transition-colors">
        <div class="flex items-center gap-2.5">
          <span class="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">2</span>
          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Hubungkan via Kode Pengaitan Bot</h3>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Jika bot Telegram lokal sedang aktif dijalankan via terminal, Anda dapat menggunakan tautan otomatis.
        </p>

        <div v-if="!pairingCode">
          <el-button
            type="primary"
            plain
            class="!rounded-xl !text-xs !font-bold"
            :loading="generatingCode"
            @click="handleGeneratePairing"
          >
            Buat Kode Pengaitan Bot
          </el-button>
        </div>

        <div v-else class="space-y-3 p-4 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-800">
          <p class="text-xs text-slate-600 dark:text-slate-300">Kirim perintah berikut ke bot Telegram resmi MyKas:</p>
          <div class="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-base font-bold tracking-widest text-center select-all">
            /start {{ pairingCode }}
          </div>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <a
              :href="pairingDeepLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs"
            >
              <el-icon><Promotion /></el-icon> Buka Bot Telegram
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- GitHub Actions Automation Info Card -->
    <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white space-y-2.5 shadow-md">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <h3 class="text-sm font-bold text-white tracking-tight">Otomasi Pengiriman Notifikasi via GitHub Actions</h3>
      </div>
      <p class="text-xs text-slate-300 leading-relaxed">
        Sistem pengingat kas MyKas beroperasi otomatis melalui <strong>GitHub Actions</strong> setiap hari pukul <strong>07:00 WIB</strong> tanpa biaya hosting. Notifikasi pertemuan H-1 dan konfirmasi pembayaran akan otomatis masuk ke Telegram Anda.
      </p>
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

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <h1 class="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Profil Mahasiswa</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Perbarui nama lengkap dan nama panggilan akun Anda.</p>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
      <el-form label-position="top" size="large" @submit.prevent="handleSaveProfile">
        <!-- Avatar and Identity Header -->
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div class="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold">
            {{ (form.namaPanggilan || form.namaLengkap || 'U').charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ form.namaLengkap }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Email: {{ authStore.user?.email }}</p>
            <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Role: {{ authStore.userProfile?.role }}
            </span>
          </div>
        </div>

        <!-- Editable fields -->
        <el-form-item label="Nama Lengkap" required>
          <el-input v-model="form.namaLengkap" placeholder="Masukkan nama lengkap" />
        </el-form-item>

        <el-form-item label="Nama Panggilan" required>
          <el-input v-model="form.namaPanggilan" placeholder="Masukkan nama panggilan" />
        </el-form-item>

        <!-- Read-only verified fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <el-form-item label="NIM (Terkunci)">
            <el-input :model-value="authStore.userProfile?.nim" disabled placeholder="NIM" />
          </el-form-item>

          <el-form-item label="Kelas (Terkunci)">
            <el-input :model-value="authStore.userProfile?.kelasNama" disabled placeholder="Kelas" />
          </el-form-item>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 mb-6 flex items-start gap-2">
          <el-icon class="mt-0.5 text-slate-400"><InfoFilled /></el-icon>
          <span>NIM, Kelas, dan Role dilindungi oleh aturan keamanan database dan hanya dapat diubah oleh administrator resmi.</span>
        </div>

        <div class="flex justify-end">
          <el-button
            type="primary"
            class="!h-11 !px-6 !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none !font-bold"
            :loading="saving"
            native-type="submit"
          >
            Simpan Perubahan
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- Card Ganti Kata Sandi -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors">
      <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <el-icon :size="20"><Lock /></el-icon>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">Ganti Kata Sandi Akun</h3>
          <p class="text-xs text-slate-400">Pastikan menggunakan kata sandi yang aman dan mudah Anda ingat.</p>
        </div>
      </div>

      <el-form label-position="top" size="large" @submit.prevent="handleChangePassword">
        <el-form-item label="Kata Sandi Saat Ini" required>
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            show-password
            placeholder="Masukkan kata sandi saat ini"
            autocomplete="current-password"
          />
        </el-form-item>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <el-form-item label="Kata Sandi Baru" required>
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              show-password
              placeholder="Minimal 6 karakter"
              autocomplete="new-password"
            />
          </el-form-item>

          <el-form-item label="Ulangi Kata Sandi Baru" required>
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              show-password
              placeholder="Ketik ulang kata sandi baru"
              autocomplete="new-password"
            />
          </el-form-item>
        </div>

        <div class="flex justify-end pt-2">
          <el-button
            type="primary"
            class="!h-11 !px-6 !rounded-xl !bg-amber-600 hover:!bg-amber-700 !border-none !font-bold"
            :loading="changingPassword"
            native-type="submit"
          >
            Perbarui Kata Sandi
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { userService } from '../../services/userService.js';
import { ElMessage } from 'element-plus';
import { InfoFilled, Lock } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const saving = ref(false);
const changingPassword = ref(false);

const form = reactive({
  namaLengkap: '',
  namaPanggilan: ''
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

onMounted(() => {
  if (authStore.userProfile) {
    form.namaLengkap = authStore.userProfile.namaLengkap || '';
    form.namaPanggilan = authStore.userProfile.namaPanggilan || '';
  }
});

async function handleSaveProfile() {
  if (!form.namaLengkap.trim() || !form.namaPanggilan.trim()) {
    ElMessage.warning('Nama lengkap dan nama panggilan wajib diisi');
    return;
  }

  saving.value = true;
  try {
    await userService.updateProfile(authStore.user.uid, {
      namaLengkap: form.namaLengkap,
      namaPanggilan: form.namaPanggilan
    });
    await authStore.refreshProfile();
    ElMessage.success('Profil berhasil diperbarui!');
  } catch (err) {
    ElMessage.error(err.message || 'Gagal memperbarui profil');
  } finally {
    saving.value = false;
  }
}

async function handleChangePassword() {
  if (!passwordForm.currentPassword) {
    ElMessage.warning('Silakan masukkan kata sandi Anda saat ini');
    return;
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    ElMessage.warning('Kata sandi baru minimal harus 6 karakter');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('Konfirmasi kata sandi baru tidak cocok');
    return;
  }
  if (passwordForm.currentPassword === passwordForm.newPassword) {
    ElMessage.warning('Kata sandi baru tidak boleh sama dengan kata sandi saat ini');
    return;
  }

  changingPassword.value = true;
  try {
    await authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    ElMessage.success('Kata sandi akun Anda berhasil diperbarui!');
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch (err) {
    let msg = err.message || 'Gagal memperbarui kata sandi';
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'Kata sandi saat ini yang Anda masukkan salah.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi.';
    } else if (err.code === 'auth/requires-recent-login') {
      msg = 'Sesi keamanan kedaluwarsa. Silakan logout dan login kembali untuk mengubah kata sandi.';
    }
    ElMessage.error(msg);
  } finally {
    changingPassword.value = false;
  }
}
</script>

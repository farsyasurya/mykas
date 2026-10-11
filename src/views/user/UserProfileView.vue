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
          <el-form-item label="NIM Mahasiswa (Terkunci)">
            <el-input :model-value="authStore.userProfile?.nim" disabled placeholder="NIM" />
          </el-form-item>

          <el-form-item label="Kelas Perkuliahan (Terkunci)">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { userService } from '../../services/userService.js';
import { ElMessage } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const saving = ref(false);

const form = reactive({
  namaLengkap: '',
  namaPanggilan: ''
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
</script>

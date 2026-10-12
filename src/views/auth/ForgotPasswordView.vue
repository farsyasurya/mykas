<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 items-center justify-center mb-4">
          <el-icon :size="28"><Key /></el-icon>
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Atur Ulang Sandi</h1>
        <p class="text-slate-500 text-sm mt-1">Kami akan mengirimkan tautan reset kata sandi ke email Anda</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleReset"
        size="large"
      >
        <el-form-item label="NIM Mahasiswa atau Email Terdaftar" prop="identifier">
          <el-input
            v-model="form.identifier"
            placeholder="Masukkan NIM Anda atau Email"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="w-full !h-12 !text-base !font-semibold !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none shadow-md"
          :loading="isLoading"
          native-type="submit"
        >
          Kirim Tautan Reset
        </el-button>
      </el-form>

      <div class="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
        Ingat kata sandi Anda?
        <router-link to="/login" class="text-emerald-600 hover:text-emerald-700 font-semibold ml-1">
          Kembali ke Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { authService } from '../../services/authService.js';
import { ElMessage } from 'element-plus';
import { User, Key } from '@element-plus/icons-vue';

const formRef = ref(null);
const isLoading = ref(false);

const form = reactive({
  identifier: ''
});

const rules = {
  identifier: [
    { required: true, message: 'NIM atau Email wajib diisi', trigger: 'blur' }
  ]
};

async function handleReset() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    isLoading.value = true;
    try {
      await authService.resetPassword(form.identifier);
      ElMessage.success('Tautan reset kata sandi telah dikirim ke email akun terdaftar.');
    } catch (err) {
      ElMessage.error(err.message || 'Gagal mengirim email reset.');
    } finally {
      isLoading.value = false;
    }
  });
}
</script>

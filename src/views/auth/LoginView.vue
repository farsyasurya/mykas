<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
      <!-- Brand Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-4">
          <el-icon :size="30"><Wallet /></el-icon>
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Masuk ke MyKas</h1>
        <p class="text-slate-500 text-sm mt-1">Aplikasi Manajemen Kas Mahasiswa Kelas</p>
      </div>

      <!-- Login Form -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
        size="large"
      >
        <el-form-item label="Email Mahasiswa / Akun" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="nama@kampus.ac.id"
            :prefix-icon="Message"
            autocomplete="email"
          />
        </el-form-item>

        <el-form-item label="Kata Sandi" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="Masukkan kata sandi"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>

        <div class="flex items-center justify-between mb-6 text-sm">
          <router-link to="/forgot-password" class="text-emerald-600 hover:text-emerald-700 font-medium">
            Lupa kata sandi?
          </router-link>
        </div>

        <el-button
          type="primary"
          class="w-full !h-12 !text-base !font-semibold !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none shadow-md shadow-emerald-600/20"
          :loading="isLoading"
          native-type="submit"
        >
          Masuk Sekarang
        </el-button>
      </el-form>

      <!-- Bottom link to register -->
      <div class="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
        Belum punya akun mahasiswa?
        <router-link to="/register" class="text-emerald-600 hover:text-emerald-700 font-semibold ml-1">
          Daftar Akun Baru
        </router-link>
      </div>

      <!-- Super Admin bootstrap link -->
      <div class="mt-4 text-center">
        <router-link to="/bootstrap-super-admin" class="text-xs text-slate-400 hover:text-slate-600 underline">
          Setup Super Admin Pertama
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { ElMessage } from 'element-plus';
import { Message, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formRef = ref(null);
const isLoading = ref(false);

const form = reactive({
  email: '',
  password: ''
});

const rules = {
  email: [
    { required: true, message: 'Email wajib diisi', trigger: 'blur' },
    { type: 'email', message: 'Format email tidak valid', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Kata sandi wajib diisi', trigger: 'blur' },
    { min: 6, message: 'Kata sandi minimal 6 karakter', trigger: 'blur' }
  ]
};

async function handleLogin() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    isLoading.value = true;
    try {
      const res = await authStore.login(form.email, form.password);
      ElMessage.success(`Selamat datang, ${res.profile?.namaPanggilan || res.profile?.namaLengkap || 'Mahasiswa'}!`);

      const redirectPath = route.query.redirect;
      if (redirectPath) {
        router.push(redirectPath);
      } else if (res.profile?.role === 'SUPER_ADMIN' || res.profile?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    } catch (err) {
      console.error(err);
      ElMessage.error(err.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
    } finally {
      isLoading.value = false;
    }
  });
}
</script>

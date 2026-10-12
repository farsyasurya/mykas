<template>
  <div class="w-full max-w-lg my-6">
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-4">
          <el-icon :size="30"><UserFilled /></el-icon>
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Akun Mahasiswa</h1>
        <p class="text-slate-500 text-sm mt-1">Gabung ke sistem kas kelas dan pantau kasmu secara transparan</p>
      </div>

      <!-- Registration Form -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleRegister"
        size="large"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <el-form-item label="Nama Lengkap" prop="namaLengkap">
            <el-input v-model="form.namaLengkap" placeholder="Nama lengkap" />
          </el-form-item>

          <el-form-item label="Nama Panggilan" prop="namaPanggilan">
            <el-input v-model="form.namaPanggilan" placeholder="Panggilan" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <el-form-item label="NIM" prop="nim">
            <el-input v-model="form.nim" placeholder="Contoh: 231011400123" />
          </el-form-item>

          <el-form-item label="Pilih Kelas" prop="kelasId">
            <el-select
              v-model="form.kelasId"
              placeholder="Pilih kelas Anda"
              class="w-full"
              :loading="classesLoading"
              @change="handleClassChange"
            >
              <el-option
                v-for="c in classesList"
                :key="c.id"
                :label="c.namaKelas"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="Alamat Email" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="Email"
            :prefix-icon="Message"
          />
        </el-form-item>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <el-form-item label="Kata Sandi" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="Minimal 6 karakter"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item label="Konfirmasi Kata Sandi" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="Ulangi kata sandi"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
        </div>

        <div class="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs mb-6 border border-emerald-200 flex items-start gap-2">
          <el-icon class="mt-0.5 text-emerald-600"><InfoFilled /></el-icon>
          <span>Pendaftaran otomatis menetapkan peran Anda sebagai <strong>USER (Mahasiswa)</strong> dengan saldo tabungan awal Rp0.</span>
        </div>

        <el-button
          type="primary"
          class="w-full !h-12 !text-base !font-semibold !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none shadow-md shadow-emerald-600/20"
          :loading="isLoading"
          native-type="submit"
        >
          Daftarkan Akun
        </el-button>
      </el-form>

      <!-- Bottom link to login -->
      <div class="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
        Sudah memiliki akun?
        <router-link to="/login" class="text-emerald-600 hover:text-emerald-700 font-semibold ml-1">
          Masuk di Sini
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { classService } from '../../services/classService.js';
import { ElMessage } from 'element-plus';
import { Message, Lock, UserFilled, InfoFilled } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();

const formRef = ref(null);
const isLoading = ref(false);
const classesLoading = ref(false);
const classesList = ref([]);

const form = reactive({
  namaLengkap: '',
  namaPanggilan: '',
  nim: '',
  kelasId: '01TPLE002',
  kelasNama: '01TPLE002',
  email: '',
  password: '',
  confirmPassword: ''
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Ulangi kata sandi Anda'));
  } else if (value !== form.password) {
    callback(new Error('Konfirmasi kata sandi tidak cocok'));
  } else {
    callback();
  }
};

const rules = {
  namaLengkap: [{ required: true, message: 'Nama lengkap wajib diisi', trigger: 'blur' }],
  namaPanggilan: [{ required: true, message: 'Nama panggilan wajib diisi', trigger: 'blur' }],
  nim: [
    { required: true, message: 'NIM wajib diisi', trigger: 'blur' },
    { min: 5, message: 'NIM minimal 5 karakter', trigger: 'blur' }
  ],
  kelasId: [{ required: true, message: 'Pilih salah satu kelas', trigger: 'change' }],
  email: [
    { required: true, message: 'Email wajib diisi', trigger: 'blur' },
    { type: 'email', message: 'Format email tidak valid', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Kata sandi wajib diisi', trigger: 'blur' },
    { min: 6, message: 'Kata sandi minimal 6 karakter', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

onMounted(async () => {
  classesLoading.value = true;
  try {
    const list = await classService.getAllClasses();
    if (list.length === 0) {
      classesList.value = [
        { id: '01TPLE002', namaKelas: '01TPLE002' }
      ];
    } else {
      const hasTarget = list.some(c => c.id === '01TPLE002' || c.namaKelas === '01TPLE002');
      if (!hasTarget) {
        classesList.value = [{ id: '01TPLE002', namaKelas: '01TPLE002' }, ...list];
      } else {
        classesList.value = list;
      }
    }
  } catch (err) {
    console.warn('Error loading classes:', err);
    classesList.value = [{ id: '01TPLE002', namaKelas: '01TPLE002' }];
  } finally {
    classesLoading.value = false;
    form.kelasId = '01TPLE002';
    form.kelasNama = '01TPLE002';
  }
});

function handleClassChange(val) {
  const selected = classesList.value.find(c => c.id === val);
  form.kelasNama = selected ? selected.namaKelas : '';
}

async function handleRegister() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    isLoading.value = true;
    try {
      await authStore.register({
        email: form.email,
        password: form.password,
        namaLengkap: form.namaLengkap,
        namaPanggilan: form.namaPanggilan,
        nim: form.nim,
        kelasId: form.kelasId,
        kelasNama: form.kelasNama
      });

      ElMessage.success('Registrasi berhasil! Akun Anda telah siap.');
      router.push('/user/dashboard');
    } catch (err) {
      console.error(err);
      ElMessage.error(err.message || 'Registrasi gagal. Pastikan NIM dan email belum digunakan.');
    } finally {
      isLoading.value = false;
    }
  });
}
</script>

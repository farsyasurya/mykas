<template>
  <div class="w-full max-w-lg my-6">
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
      <div class="text-center mb-6">
        <div class="inline-flex w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 items-center justify-center mb-4">
          <el-icon :size="28"><Lock /></el-icon>
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Setup Super Admin Pertama</h1>
        <p class="text-slate-500 text-sm mt-1">Mekanisme Bootstrap Terproteksi Aplikasi MyKas</p>
      </div>

      <!-- Loading State -->
      <div v-if="checking" class="text-center py-8">
        <el-icon class="is-loading text-purple-600" :size="32"><Loading /></el-icon>
        <p class="text-xs text-slate-500 mt-2">Memeriksa status sistem keamanan...</p>
      </div>

      <!-- State 1: Super Admin Already Exists -->
      <div v-else-if="superAdminExists" class="space-y-4">
        <div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-sm flex items-start gap-3">
          <el-icon class="mt-0.5 text-rose-600 flex-shrink-0" :size="20"><CircleCloseFilled /></el-icon>
          <div>
            <p class="font-bold">Mekanisme Bootstrap Ditutup</p>
            <p class="text-xs text-rose-700 mt-1">
              Aplikasi ini sudah memiliki akun <strong>SUPER_ADMIN</strong> yang aktif.
              Untuk keamanan hak akses, bootstrap akun awal tidak dapat digunakan lagi.
            </p>
          </div>
        </div>

        <p class="text-xs text-slate-500 leading-relaxed">
          Jika Anda adalah pemilik aplikasi yang kehilangan akses, lakukan perubahan role langsung melalui Firebase Console > Firestore Database pada dokumen <code>users/{UID}</code>.
        </p>

        <router-link to="/login">
          <el-button type="primary" class="w-full mt-4 !h-11 !rounded-xl !bg-purple-600 hover:!bg-purple-700 !border-none">
            Kembali ke Login
          </el-button>
        </router-link>
      </div>

      <!-- State 2: No Super Admin Exists - Ready for Bootstrap -->
      <div v-else class="space-y-4">
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm flex items-start gap-3">
          <el-icon class="mt-0.5 text-amber-600 flex-shrink-0" :size="20"><WarningFilled /></el-icon>
          <div>
            <p class="font-bold">Belum Ada Akun Super Admin</p>
            <p class="text-xs text-amber-700 mt-1">
              Sistem mendeteksi database belum memiliki akun pengelola utama. Akun yang Anda daftarkan sekarang akan diangkat menjadi pemilik sistem dengan akses penuh.
            </p>
          </div>
        </div>

        <div v-if="authStore.isAuthenticated" class="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <p class="text-xs font-semibold text-slate-500 uppercase">Akun yang sedang login:</p>
          <p class="text-sm font-bold text-slate-900 mt-0.5">{{ authStore.userProfile?.namaLengkap }}</p>
          <p class="text-xs text-slate-500">{{ authStore.user?.email }}</p>

          <el-button
            type="primary"
            class="w-full mt-4 !h-11 !rounded-xl !bg-purple-600 hover:!bg-purple-700 !border-none"
            :loading="elevating"
            @click="handleElevateCurrent"
          >
            Angkat Akun Ini Menjadi SUPER_ADMIN
          </el-button>
        </div>

        <div v-else class="space-y-3">
          <p class="text-sm text-slate-600">
            Silakan login atau daftar terlebih dahulu, kemudian kembali ke halaman ini untuk mengangkat akun Anda menjadi Super Admin pertama.
          </p>
          <div class="flex gap-3">
            <router-link to="/login" class="flex-1">
              <el-button class="w-full !rounded-xl">Masuk</el-button>
            </router-link>
            <router-link to="/register" class="flex-1">
              <el-button type="primary" class="w-full !rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !border-none">Daftar</el-button>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { ElMessage } from 'element-plus';
import { Lock, WarningFilled, CircleCloseFilled, Loading } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();

const checking = ref(true);
const superAdminExists = ref(false);
const elevating = ref(false);

onMounted(async () => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'SUPER_ADMIN'));
    const snap = await getDocs(q);
    superAdminExists.value = !snap.empty;
  } catch (err) {
    console.warn('Error checking super admin presence:', err);
    superAdminExists.value = false;
  } finally {
    checking.value = false;
  }
});

async function handleElevateCurrent() {
  if (!authStore.user?.uid) return;
  elevating.value = true;
  try {
    // Re-verify no super admin exists
    const q = query(collection(db, 'users'), where('role', '==', 'SUPER_ADMIN'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      superAdminExists.value = true;
      throw new Error('Aplikasi sudah memiliki Super Admin.');
    }

    const userRef = doc(db, 'users', authStore.user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      await updateDoc(userRef, {
        role: 'SUPER_ADMIN',
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(userRef, {
        uid: authStore.user.uid,
        email: authStore.user.email || '',
        namaLengkap: authStore.user.displayName || 'Super Admin',
        namaPanggilan: 'Admin',
        nim: '',
        kelasId: '01TPLE002',
        kelasNama: '01TPLE002',
        role: 'SUPER_ADMIN',
        tabungan: 0,
        telegramChatId: '',
        telegramConnected: false,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await authStore.refreshProfile();
    ElMessage.success('Selamat! Anda sekarang adalah SUPER_ADMIN MyKas.');
    router.push('/admin/dashboard');
  } catch (err) {
    ElMessage.error(err.message || 'Gagal bootstrap super admin');
  } finally {
    elevating.value = false;
  }
}
</script>

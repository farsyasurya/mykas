<template>
  <div class="text-center py-16 space-y-4">
    <div class="inline-flex w-20 h-20 rounded-3xl bg-slate-100 items-center justify-center text-slate-400 text-3xl font-black">
      404
    </div>
    <h2 class="text-2xl font-extrabold text-slate-900">Halaman Tidak Ditemukan</h2>
    <p class="text-slate-500 text-sm max-w-sm mx-auto">
      Alamat URL yang Anda tuju tidak tersedia atau Anda tidak memiliki hak akses ke halaman ini.
    </p>
    <div class="pt-2">
      <router-link to="/">
        <el-button type="primary" class="!rounded-xl !bg-emerald-600 !border-none">
          Kembali ke Beranda
        </el-button>
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

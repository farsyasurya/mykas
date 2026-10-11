# 🌟 MyKas - Aplikasi Manajemen Kas & Pertemuan Kelas Mahasiswa

**MyKas** adalah aplikasi web modern yang dibangun untuk mengelola keuangan kas mahasiswa berbasis kelas dan pertemuan perkuliahan secara akurat, aman, transparan, dan terintegrasi dengan Telegram Bot serta Firebase Backend.

---

## 🚀 Fitur Unggulan

1. **Aturan Bisnis Kas Presisi**:
   - Tarif standar kas **Rp7.000 / pertemuan**.
   - Input pembayaran otomatis mengalokasikan:
     - **Masuk Kas Kelas** = `Jumlah Pertemuan Dipilih × Rp7.000`
     - **Masuk Tabungan Mahasiswa** = `Nominal Pembayaran − Masuk Kas Kelas`
   - Transaksi Firestore atomik (`runTransaction`) untuk menjamin konsistensi saldo kas dan tabungan.
2. **Pemisahan Kas & Tabungan**:
   - Saldo tabungan mahasiswa adalah **kewajiban kelas** kepada mahasiswa (bukan kas operasional bebas).
   - Pengembalian tabungan (*refund*) dicatat tersendiri dalam `savingsTransactions` dengan audit log.
3. **Pemasukan Lain & Pengeluaran Operasional**:
   - Pemasukan non-rutin (donasi, sumbangan, bazar) dipisahkan dari kas rutin pertemuan.
   - Pengeluaran operasional (konsumsi, spidol, fotokopi) otomatis memotong saldo kas kelas.
4. **Laporan Bulanan & Ekspor PDF**:
   - Filter periode `MM-YYYY` (contoh: `09-2026`).
   - Rumus rekonsiliasi:
     $$\text{Saldo Akhir} = \text{Saldo Awal} + \text{Kas Rutin} + \text{Pemasukan Lain} - \text{Pengeluaran} - \text{Pengembalian Tabungan}$$
   - Ekspor laporan berformat rapi dengan **jsPDF** dan **jsPDF-AutoTable**.
5. **Integrasi Notifikasi Telegram**:
   - Pengingat pertemuan H-1 otomatis.
   - Pengingat tunggakan kas.
   - Konfirmasi bukti pembayaran instan.
   - Pairing aman via deep-link dan verifikasi kode `/start kas_XXXXXX`.
6. **Keamanan Berlapis**:
   - Firebase Authentication & Firestore Security Rules berbasis peran (`SUPER_ADMIN`, `ADMIN`, `USER`).
   - Mekanisme bootstrap akun `SUPER_ADMIN` pertama yang aman tanpa manipulasi client-side.

---

## 🛠️ Arsitektur Teknologi

- **Frontend**: Vue 3 Composition API (`<script setup>`), JavaScript, Vite, Tailwind CSS.
- **Komponen UI**: Element Plus & Element Plus Icons.
- **State Management & Routing**: Pinia & Vue Router 4.
- **Backend & Database**: Firebase Authentication & Cloud Firestore (Modular SDK v10).
- **Serverless & Automation**: Firebase Cloud Functions (v2) & Cloud Scheduler.
- **Dokumen & Grafik**: jsPDF, jsPDF-AutoTable, Chart.js, vue-chartjs, canvas-confetti.

---

## 📁 Struktur Folder Proyek

```text
mykas/
├── functions/                     # Firebase Cloud Functions (Node 20 ESM)
│   ├── src/
│   │   ├── index.js               # Entry point Cloud Functions & Webhook
│   │   ├── telegram.js            # Bot API handler & secure pairing
│   │   ├── scheduledNotifications.js # Cron pengingat H-1 & tunggakan
│   │   └── adminService.js        # Server-side role elevation
│   └── package.json
├── src/
│   ├── assets/
│   │   └── main.css               # Styling Tailwind + Element Plus
│   ├── components/
│   │   ├── dashboard/             # StatCard & FinanceChart
│   │   └── layout/                # Navbar, Sidebar, Footer
│   ├── router/                    # Route guard & role permissions
│   ├── services/                  # Firestore & Auth Services
│   │   ├── authService.js
│   │   ├── classService.js
│   │   ├── meetingService.js
│   │   ├── paymentService.js      # Atomic transaction logic
│   │   ├── savingsService.js
│   │   ├── expenseService.js
│   │   ├── incomeService.js
│   │   ├── reportService.js       # Rekonsiliasi & saldo awal
│   │   ├── telegramService.js
│   │   └── auditService.js
│   ├── stores/                    # Pinia auth & class store
│   ├── utils/                     # Currency (IDR), Date (MM-YYYY), jsPDF Export
│   ├── views/                     # Halaman Auth, Admin, Pertemuan, Laporan, User
│   ├── App.vue
│   └── main.js
├── firestore.rules                # Aturan keamanan database Firestore
├── firestore.indexes.json         # Konfigurasi compound index
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 💻 Panduan Menjalankan Aplikasi Secara Lokal

### 1. Kloning dan Instal Dependensi
```bash
cd mykas
npm install
```

### 2. Konfigurasi Environment Variable (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi dengan kredensial dari **Firebase Console** (*Project Settings > General > Your Apps > Web App*):
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=proyek-anda.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proyek-anda
VITE_FIREBASE_STORAGE_BUCKET=proyek-anda.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
VITE_TELEGRAM_BOT_USERNAME=MyKasClassBot
```

### 3. Jalankan Server Development
```bash
npm run dev
```
Buka browser pada URL: `http://localhost:5173`.

---

## 🔐 Panduan Setup SUPER_ADMIN Pertama (Bootstrap)

Aplikasi MyKas dilengkapi dengan alur bootstrap yang aman:

1. Buka aplikasi dan daftarkan akun baru di menu **Daftar Akun Baru** (`/register`).
2. Setelah terdaftar, buka URL:
   ```text
   http://localhost:5173/bootstrap-super-admin
   ```
3. Sistem akan memverifikasi bahwa database belum memiliki `SUPER_ADMIN`.
4. Klik tombol **"Angkat Akun Ini Menjadi SUPER_ADMIN"**.
5. Akun Anda seketika memiliki akses ke menu **Kelola Kelas**, **Kelola Role & Pengguna**, serta **Audit Log**.
6. Setelah seorang `SUPER_ADMIN` terbentuk, halaman bootstrap ini secara permanen terkunci untuk mencegah eksploitasi oleh pihak luar.

---

## 🤖 Konfigurasi Telegram Bot & Cloud Functions

### 1. Membuat Bot Telegram
1. Buka Telegram dan hubungi `@BotFather`.
2. Ketik `/newbot`, beri nama bot (misal: `MyKas Notifikasi`) dan username (misal: `mykas_class_bot`).
3. Simpan **Bot Token** yang diberikan oleh BotFather.
4. Masukkan username bot ke `VITE_TELEGRAM_BOT_USERNAME` di `.env`.

### 2. Menghubungkan ke Cloud Functions
Di folder `functions/`:
```bash
cd functions
npm install
```

Simpan bot token ke Firebase Secret Manager:
```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
# Masukkan token bot Telegram Anda saat diminta
```

Deploy Cloud Functions:
```bash
firebase deploy --only functions
```

Set webhook Telegram ke URL HTTPS Cloud Function:
```bash
curl -F "url=https://asia-southeast2-PROYEK_ANDA.cloudfunctions.net/telegramWebhook" \
     https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
```

### 3. Informasi Biaya Firebase
- **Cloud Firestore & Authentication**: Sepenuhnya berada dalam kuota gratis (Spark Plan) untuk penggunaan kelas mahasiswa biasa.
- **Cloud Functions & Scheduler**: Memerlukan upgrade proyek ke paket **Blaze (Pay as you go)**. Namun, batas gratis bulanan (*Free Tier*) Google Cloud mencakup 2 juta pemanggilan fungsi per bulan dan 3 jadwal cron gratis, sehingga biaya biasanya tetap **Rp0** jika penggunaan dalam skala kelas.

---

## 🛡️ Deploy Firestore Security Rules & Indexes

Untuk menerapkan proteksi hak akses dan indeks:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 📋 Pengujian Validasi Keuangan & Transaksi

| Skenario Uji | Input Nominal | Masuk Kas | Masuk Tabungan | Hasil Pengujian |
|---|---|---|---|---|
| **Bayar Pas 1 Pertemuan** | Rp7.000 | Rp7.000 | Rp0 | ✅ Sukses, status pertemuan 1 lunas |
| **Bayar Pas 5 Pertemuan** | Rp35.000 | Rp35.000 | Rp0 | ✅ Sukses, saldo kas bertambah Rp35.000 |
| **Bayar Lebih 5 Pertemuan** | Rp50.000 | Rp35.000 | Rp15.000 | ✅ Sukses, kas +Rp35.000, tabungan mahasiswa +Rp15.000 |
| **Nominal Kurang** | Rp30.000 (pilih 5 pertemuan) | - | - | ❌ Ditolak sistem (minimal Rp35.000) |
| **Pertemuan Ganda** | Pertemuan yang sudah lunas | - | - | ❌ Checkbox terkunci & ditolak transaksi atomik |
| **Pengembalian Tabungan** | Minta Rp15.000 dari saldo Rp15.000 | - | - | ✅ Tabungan berkurang, dicatat di `savingsTransactions` |

/**
 * Script Telegram Bot Polling (Long-Polling) MyKas
 * Jalankan ini di terminal (misal: npm run telegram:bot) untuk membuat bot
 * merespons perintah /start, menghubungkan akun secara otomatis, atau membalas pesan.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import fs from 'fs';
import path from 'path';

// Baca file .env secara otomatis tanpa butuh package tambahan
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  }
} catch (e) {}

const botToken = process.env.TELEGRAM_BOT_TOKEN;

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!botToken) {
  console.error('\n❌ ERROR: TELEGRAM_BOT_TOKEN belum diset di file .env.');
  console.error('Silakan buka file .env dan tambahkan:');
  console.error('TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz\n');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    return await res.json();
  } catch (e) {
    console.error('Gagal kirim pesan ke Telegram:', e.message);
  }
}

async function handleStartCommand(message) {
  const chatId = message.chat.id;
  const username = message.chat.username ? `@${message.chat.username}` : message.chat.first_name || 'Teman';
  const text = (message.text || '').trim();

  const parts = text.split(' ');

  // Kasus 1: /start KODE_PENGURUS (misal: /start kas_A1B2C3)
  if (parts.length > 1) {
    const pairingCode = parts[1].trim();
    console.log(`🔑 Menerima kode pairing: ${pairingCode} dari Chat ID: ${chatId} (${username})`);

    try {
      const q = query(collection(db, 'users'), where('telegramPairingCode', '==', pairingCode));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const userData = userDoc.data();

        // Hubungkan Chat ID
        await updateDoc(doc(db, 'users', userDoc.id), {
          telegramChatId: String(chatId),
          telegramUsername: message.chat.username || '',
          telegramConnected: true,
          telegramPairingCode: '',
          updatedAt: serverTimestamp()
        });

        console.log(`✅ Akun ${userData.namaLengkap} (${userData.nim}) berhasil dihubungkan!`);

        await sendTelegramMessage(
          chatId,
          `🎉 <b>Selamat datang di MyKas, ${userData.namaPanggilan || userData.namaLengkap}!</b>\n\n` +
          `Akun Telegram Anda berhasil dihubungkan ke MyKas.\n` +
          `• NIM: <code>${userData.nim || '-'}</code>\n` +
          `• Kelas: <b>${userData.kelasNama || '-'}</b>\n` +
          `• Chat ID: <code>${chatId}</code>\n\n` +
          `Anda akan menerima pengingat kas otomatis H-1 jadwal pertemuan dan konfirmasi pembayaran kas.`
        );
        return;
      } else {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Kode Pengaitan Tidak Ditemukan atau Sudah Kedaluwarsa.</b>\n\n` +
          `Silakan buka aplikasi MyKas di menu <b>Profil > Hubungkan Telegram</b> untuk membuat kode baru, atau gunakan fitur input Chat ID manual: <code>${chatId}</code>.`
        );
        return;
      }
    } catch (err) {
      console.error('Error saat verifikasi kode:', err);
      if (err.message && (err.message.includes('PERMISSION_DENIED') || err.message.includes('Missing or insufficient permissions'))) {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Izin Database Terproteksi (Firestore Security Rules)</b>\n\n` +
          `Database MyKas mewajibkan pembaruan data dilakukan oleh akun terautentikasi.\n\n` +
          `👉 <b>Solusi Mudah & Cepat (Tanpa Kode):</b>\n` +
          `1. Buka web MyKas di menu <b>Profil > Hubungkan Telegram</b>.\n` +
          `2. Masukkan Chat ID Anda langsung di kolom manual: <code>${chatId}</code>.\n` +
          `3. Klik <b>Simpan & Hubungkan</b>. Akun Anda langsung terhubung seketika!\n\n` +
          `<i>(Atau tambahkan BOT_EMAIL & BOT_PASSWORD di file .env jika ingin bot auto-pair via terminal)</i>`
        );
      } else {
        await sendTelegramMessage(chatId, `Terjadi kesalahan saat memproses kode: ${err.message}`);
      }
      return;
    }
  }

  // Kasus 2: /start biasa tanpa kode
  console.log(`👋 Menerima /start biasa dari Chat ID: ${chatId} (${username})`);
  await sendTelegramMessage(
    chatId,
    `👋 <b>Halo, ${username}!</b>\n\n` +
    `Ini adalah Bot Notifikasi Resmi <b>MyKas</b> (Manajemen Kas Mahasiswa Kelas).\n\n` +
    `🆔 <b>Chat ID Telegram Anda:</b> <code>${chatId}</code>\n\n` +
    `📌 <b>Cara Menghubungkan ke Akun MyKas:</b>\n` +
    `1. Buka aplikasi MyKas di browser.\n` +
    `2. Masuk ke menu <b>Profil > Hubungkan Telegram</b>.\n` +
    `3. Masukkan angka Chat ID: <code>${chatId}</code> ke kolom input lalu klik <b>Simpan & Hubungkan</b>.\n` +
    `4. Akun Anda langsung terhubung dan siap menerima pengingat kas!`
  );
}

let offset = 0;

async function poll() {
  const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=30`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;

        if (update.message && update.message.text) {
          const text = update.message.text.trim();
          if (text.startsWith('/start')) {
            await handleStartCommand(update.message);
          } else if (text.startsWith('/myid') || text.startsWith('/id')) {
            await sendTelegramMessage(
              update.message.chat.id,
              `🆔 <b>Chat ID Anda:</b> <code>${update.message.chat.id}</code>`
            );
          }
        }
      }
    }
  } catch (e) {
    // Polling timeout or network hiccup, normal
  }

  // Lanjutkan polling loop
  setTimeout(poll, 1000);
}

async function start() {
  console.log('==============================================');
  console.log('🤖 Telegram Bot Polling MyKas Sedang Berjalan');
  console.log('==============================================');

  // Autentikasi Firebase jika tersedia akun bot/admin
  const botEmail = process.env.BOT_EMAIL || process.env.FIREBASE_AUTH_EMAIL;
  const botPassword = process.env.BOT_PASSWORD || process.env.FIREBASE_AUTH_PASSWORD;

  if (botEmail && botPassword) {
    console.log(`🔐 Mencoba login Firebase sebagai: ${botEmail}...`);
    try {
      await signInWithEmailAndPassword(auth, botEmail.trim(), botPassword);
      console.log('✅ Bot berhasil terautentikasi ke Firebase Auth.');
    } catch (authErr) {
      console.warn('⚠️ Gagal login bot ke Firebase:', authErr.message);
    }
  } else {
    try {
      await signInAnonymously(auth);
      console.log('✅ Bot terautentikasi (Anonymous).');
    } catch (e) {
      console.log('ℹ️ Catatan: Tambahkan BOT_EMAIL & BOT_PASSWORD di file .env jika Firestore membatasi akses tanpa login.');
    }
  }

  console.log('----------------------------------------------');
  console.log('Ketik /start di bot Telegram Anda sekarang.');
  console.log('Tekan Ctrl+C untuk menghentikan bot.');
  console.log('----------------------------------------------');

  // Hapus webhook aktif jika ada agar getUpdates berfungsi
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
  } catch (e) {}

  poll();
}

start();

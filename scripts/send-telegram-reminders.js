/**
 * Script Pengirim Notifikasi Telegram MyKas via GitHub Actions
 * Dapat dijalankan otomatis terjadwal (Cron) atau secara manual.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Baca file .env lokal jika tersedia
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

// 1. Baca Konfigurasi
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
const botEmail = process.env.BOT_EMAIL || process.env.FIREBASE_AUTH_EMAIL;
const botPassword = process.env.BOT_PASSWORD || process.env.FIREBASE_AUTH_PASSWORD;

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function getWibDate(offsetDays = 0) {
  // Hitung tanggal dalam zona waktu Asia/Jakarta (UTC+7)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (7 * 3600000));
  wibTime.setDate(wibTime.getDate() + offsetDays);

  const yyyy = wibTime.getFullYear();
  const mm = String(wibTime.getMonth() + 1).padStart(2, '0');
  const dd = String(wibTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function sendTelegram(chatId, text) {
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN belum diatur dalam Environment / GitHub Secrets.');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  const res = await resp.json();
  if (!res.ok) {
    throw new Error(`Telegram API Error: ${res.description || 'Unknown error'}`);
  }
  return res;
}

async function main() {
  console.log('==============================================');
  console.log('🚀 Menjalankan Notifikasi Telegram MyKas (GitHub)');
  console.log(`⏰ Waktu WIB Hari Ini: ${getWibDate(0)}`);
  console.log(`📅 Target Jadwal H-1 Besok: ${getWibDate(1)}`);
  console.log('==============================================');

  if (!botToken) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN tidak ditemukan di Environment/Secrets.');
    process.exit(1);
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ ERROR: Konfigurasi Firebase tidak lengkap (API Key / Project ID kosong).');
    process.exit(1);
  }

  // Inisialisasi Firebase Web SDK
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Login jika disediakan kredensial bot/admin
  if (botEmail && botPassword) {
    console.log(`🔐 Melakukan autentikasi Firebase dengan akun: ${botEmail}`);
    try {
      await signInWithEmailAndPassword(auth, botEmail.trim(), botPassword);
      console.log('✅ Autentikasi Firebase berhasil.');
    } catch (authErr) {
      console.warn('⚠️ Gagal login akun bot (melanjutkan tanpa sesi auth):', authErr.message);
    }
  } else {
    console.log('ℹ️ Tidak ada BOT_EMAIL/BOT_PASSWORD, mengakses dengan izin publik/rules default.');
  }

  const tomorrowStr = getWibDate(1);
  const todayStr = getWibDate(0);

  let totalH1Sent = 0;
  let totalOverdueSent = 0;

  // ----------------------------------------------------
  // TUGAS 1: Pengingat Pertemuan Besok (H-1)
  // ----------------------------------------------------
  console.log(`\n🔍 Memeriksa jadwal pertemuan untuk tanggal: ${tomorrowStr}...`);

  try {
    const meetingsSnap = await getDocs(
      query(
        collection(db, 'meetings'),
        where('tanggalPertemuan', '==', tomorrowStr)
      )
    );

    const upcomingTomorrow = meetingsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.status !== 'CANCELLED');

    if (upcomingTomorrow.length === 0) {
      console.log(`ℹ️ Tidak ada jadwal pertemuan perkuliahan untuk besok (${tomorrowStr}).`);
    } else {
      console.log(`📌 Ditemukan ${upcomingTomorrow.length} pertemuan untuk besok.`);

      for (const meeting of upcomingTomorrow) {
        // Ambil info kelas
        let className = 'Kelas Anda';
        try {
          const classDoc = await getDoc(doc(db, 'classes', meeting.kelasId));
          if (classDoc.exists()) {
            className = classDoc.data().namaKelas || className;
          }
        } catch (e) {
          console.warn('Gagal ambil data kelas:', e.message);
        }

        // Ambil mahasiswa di kelas ini yang aktif dan punya Telegram
        const usersSnap = await getDocs(
          query(
            collection(db, 'users'),
            where('kelasId', '==', meeting.kelasId),
            where('role', '==', 'USER')
          )
        );

        const students = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.isActive !== false && u.telegramConnected && u.telegramChatId);

        console.log(`👥 ${students.length} mahasiswa terhubung Telegram di ${className}.`);

        // Ambil data pembayaran untuk pertemuan ini
        const paymentsSnap = await getDocs(
          query(
            collection(db, 'payments'),
            where('kelasId', '==', meeting.kelasId)
          )
        );

        const paidUserIds = new Set();
        paymentsSnap.docs.forEach(p => {
          const pData = p.data();
          if (Array.isArray(pData.meetingIds) && pData.meetingIds.includes(meeting.id)) {
            paidUserIds.add(pData.userId);
          }
        });

        // Kirim pengingat ke masing-masing mahasiswa
        for (const student of students) {
          const isPaid = paidUserIds.has(student.id);
          const studentName = student.namaPanggilan || student.namaLengkap || 'Mahasiswa';

          const msg = `🔔 <b>Pengingat Kas Pertemuan H-1</b>\n\n` +
            `Halo <b>${studentName}</b>!\n` +
            `Pertemuan <b>Ke-${meeting.nomorPertemuan} (${className})</b> akan berlangsung besok:\n` +
            `📅 Tanggal: <b>${meeting.tanggalPertemuan}</b>\n` +
            `💰 Tarif Kas: <b>${formatRupiah(meeting.tarifKas || 7000)}</b>\n\n` +
            `Status Pembayaran Anda: <b>${isPaid ? '✅ Sudah Lunas' : '⚠️ Belum Dibayar'}</b>\n\n` +
            `<i>Pantau dan konfirmasi pembayaran Anda di aplikasi MyKas.</i>`;

          try {
            await sendTelegram(student.telegramChatId, msg);
            totalH1Sent++;
            console.log(`  ✓ Notifikasi H-1 terkirim ke: ${studentName} (${student.telegramChatId})`);
          } catch (err) {
            console.error(`  ✗ Gagal kirim ke ${studentName}:`, err.message);
          }
        }

        // Jika dikonfigurasi kirim ke Grup Telegram Kelas
        if (groupChatId) {
          const groupMsg = `🔔 <b>Pengingat Kas Pertemuan H-1 (${className})</b>\n\n` +
            `Jadwal Perkuliahan & Kas Besok:\n` +
            `• Pertemuan: <b>Ke-${meeting.nomorPertemuan}</b>\n` +
            `• Tanggal: <b>${meeting.tanggalPertemuan}</b>\n` +
            `• Tarif Kas: <b>${formatRupiah(meeting.tarifKas || 7000)}</b>\n\n` +
            `Bagi teman-teman yang belum melunasi kas, silakan hubungi bendahara kelas atau setor melalui aplikasi MyKas. Terima kasih! ✨`;

          try {
            await sendTelegram(groupChatId, groupMsg);
            console.log(`  ✓ Rangkuman H-1 terkirim ke Grup Telegram: ${groupChatId}`);
          } catch (err) {
            console.warn(`  ⚠️ Gagal kirim ke Grup Telegram:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Gagal memeriksa pertemuan H-1:', err);
  }

  // ----------------------------------------------------
  // TUGAS 2: Pengingat Tunggakan Kas (Opsional jika diminta)
  // ----------------------------------------------------
  const checkOverdue = process.env.CHECK_OVERDUE === 'true' || process.argv.includes('--overdue');
  if (checkOverdue) {
    console.log(`\n🔍 Memeriksa mahasiswa yang memiliki tunggakan kas...`);
    try {
      const allMeetingsSnap = await getDocs(collection(db, 'meetings'));
      const pastMeetings = allMeetingsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.status !== 'CANCELLED' && m.tanggalPertemuan && m.tanggalPertemuan <= todayStr);

      const allUsersSnap = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'USER')
        )
      );

      const activeStudentsWithTg = allUsersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.isActive !== false && u.telegramConnected && u.telegramChatId);

      const allPaymentsSnap = await getDocs(collection(db, 'payments'));
      const payments = allPaymentsSnap.docs.map(d => d.data());

      for (const student of activeStudentsWithTg) {
        const studentPastMeetings = pastMeetings.filter(m => m.kelasId === student.kelasId);
        if (studentPastMeetings.length === 0) continue;

        const studentPayments = payments.filter(p => p.userId === student.id);
        const paidMeetingIds = new Set();
        studentPayments.forEach(p => {
          if (Array.isArray(p.meetingIds)) {
            p.meetingIds.forEach(id => paidMeetingIds.add(id));
          }
        });

        const unpaid = studentPastMeetings.filter(m => !paidMeetingIds.has(m.id));
        if (unpaid.length > 0) {
          const totalTunggakan = unpaid.reduce((sum, m) => sum + (Number(m.tarifKas) || 7000), 0);
          const studentName = student.namaPanggilan || student.namaLengkap;

          const overdueMsg = `⚠️ <b>Pemberitahuan Tunggakan Kas Kelas</b>\n\n` +
            `Halo <b>${studentName}</b>,\n` +
            `Anda memiliki kewajiban kas perkuliahan yang belum diselesaikan:\n\n` +
            `• Jumlah Pertemuan: <b>${unpaid.length} Pertemuan</b>\n` +
            `• Total Tunggakan: <b>${formatRupiah(totalTunggakan)}</b>\n` +
            `• Saldo Tabungan Anda: <b>${formatRupiah(student.tabungan || 0)}</b>\n\n` +
            `Mohon dapat segera menyelesaikan pembayaran kas ke bendahara kelas. Terima kasih! 🙏`;

          try {
            await sendTelegram(student.telegramChatId, overdueMsg);
            totalOverdueSent++;
            console.log(`  ✓ Notifikasi tunggakan terkirim ke: ${studentName} (${unpaid.length} ptm)`);
          } catch (e) {
            console.warn(`  ✗ Gagal kirim tunggakan ke ${studentName}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error('❌ Gagal memeriksa tunggakan:', e);
    }
  }

  console.log('\n==============================================');
  console.log(`🎉 Selesai! Total Notifikasi H-1 Terkirim: ${totalH1Sent}`);
  if (checkOverdue) console.log(`⚠️ Total Pengingat Tunggakan Terkirim: ${totalOverdueSent}`);
  console.log('==============================================');
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});

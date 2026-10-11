import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendTelegramMessage } from './telegram.js';

const db = getFirestore();

/**
 * Format currency to IDR
 */
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/**
 * Check and send H-1 meeting reminders to all members with connected telegram
 */
export async function sendHMinus1Reminders(botToken) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

  // Find all UPCOMING meetings happening tomorrow
  const meetingsSnap = await db.collection('meetings')
    .where('status', '==', 'UPCOMING')
    .where('tanggalPertemuan', '==', tomorrowStr)
    .get();

  if (meetingsSnap.empty) {
    console.log(`No meetings scheduled for tomorrow (${tomorrowStr})`);
    return { count: 0 };
  }

  let sentCount = 0;

  for (const meetingDoc of meetingsSnap.docs) {
    const meeting = meetingDoc.data();
    const meetingId = meetingDoc.id;

    // Get class info
    const classDoc = await db.collection('classes').doc(meeting.kelasId).get();
    const className = classDoc.exists ? classDoc.data().namaKelas : 'Kelas Anda';

    // Get all students in this class who have telegram connected (Role USER only)
    const usersSnap = await db.collection('users')
      .where('kelasId', '==', meeting.kelasId)
      .where('role', '==', 'USER')
      .where('telegramConnected', '==', true)
      .where('isActive', '==', true)
      .get();

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const userId = userDoc.id;

      // Check if user already paid for this meeting
      const paymentSnap = await db.collection('payments')
        .where('userId', '==', userId)
        .where('meetingIds', 'array-contains', meetingId)
        .limit(1)
        .get();

      const isPaid = !paymentSnap.empty;

      const message = `🔔 <b>Pengingat Kas Pertemuan H-1</b>\n\nHalo <b>${user.namaPanggilan || user.namaLengkap}</b>!\nPertemuan <b>Ke-${meeting.nomorPertemuan} (${className})</b> akan berlangsung besok:\n📅 Tanggal: <b>${meeting.tanggalPertemuan}</b>\n💰 Tarif Kas: <b>${formatRupiah(meeting.tarifKas || 7000)}</b>\n\nStatus Pembayaran Anda: <b>${isPaid ? '✅ Sudah Lunas' : '⚠️ Belum Dibayar'}</b>\n\nPastikan untuk mengecek rincian jadwal dan kas di aplikasi MyKas.`;

      try {
        await sendTelegramMessage(botToken, user.telegramChatId, message);
        sentCount++;

        await db.collection('notificationLogs').add({
          userId: userId,
          kelasId: meeting.kelasId,
          type: 'H_MINUS_1_REMINDER',
          status: 'SUCCESS',
          recipient: user.telegramChatId,
          detail: `Pengingat Pertemuan Ke-${meeting.nomorPertemuan}`,
          createdAt: FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error(`Failed to send H-1 reminder to ${user.telegramChatId}:`, err);
        await db.collection('notificationLogs').add({
          userId: userId,
          kelasId: meeting.kelasId,
          type: 'H_MINUS_1_REMINDER',
          status: 'FAILED',
          recipient: user.telegramChatId,
          detail: err.message,
          createdAt: FieldValue.serverTimestamp()
        });
      }
    }
  }

  return { count: sentCount };
}

/**
 * Send overdue reminders to students with unpaid meetings
 */
export async function sendOverdueReminders(botToken, classId) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Get completed or passed meetings in this class
  let meetingsQuery = db.collection('meetings').where('kelasId', '==', classId);
  const meetingsSnap = await meetingsQuery.get();

  const pastMeetings = meetingsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(m => m.status === 'COMPLETED' || (m.status === 'UPCOMING' && m.tanggalPertemuan < todayStr));

  if (pastMeetings.length === 0) return { count: 0 };

  // Get all active students in class with telegram connected (Role USER only)
  const usersSnap = await db.collection('users')
    .where('kelasId', '==', classId)
    .where('role', '==', 'USER')
    .where('telegramConnected', '==', true)
    .where('isActive', '==', true)
    .get();

  let sentCount = 0;

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const userId = userDoc.id;

    // Get user's payments
    const paymentsSnap = await db.collection('payments')
      .where('userId', '==', userId)
      .get();

    const paidMeetingIds = new Set();
    paymentsSnap.docs.forEach(p => {
      const pData = p.data();
      if (Array.isArray(pData.meetingIds)) {
        pData.meetingIds.forEach(id => paidMeetingIds.add(id));
      }
    });

    const unpaidPastMeetings = pastMeetings.filter(m => !paidMeetingIds.has(m.id));

    if (unpaidPastMeetings.length > 0) {
      const totalTunggakan = unpaidPastMeetings.reduce((acc, m) => acc + (m.tarifKas || 7000), 0);
      const text = `⚠️ <b>Pemberitahuan Tunggakan Kas Kelas</b>\n\nHalo <b>${user.namaPanggilan || user.namaLengkap}</b>,\nAnda memiliki kewajiban kas yang belum diselesaikan:\n\n• Jumlah Pertemuan Belum Dibayar: <b>${unpaidPastMeetings.length} Pertemuan</b>\n• Total Tunggakan: <b>${formatRupiah(totalTunggakan)}</b>\n• Saldo Tabungan Anda: <b>${formatRupiah(user.tabungan || 0)}</b>\n\nMohon segera melunasi melalui bendahara/admin kelas. Terima kasih!`;

      try {
        await sendTelegramMessage(botToken, user.telegramChatId, text);
        sentCount++;

        await db.collection('notificationLogs').add({
          userId: userId,
          kelasId: classId,
          type: 'OVERDUE_REMINDER',
          status: 'SUCCESS',
          recipient: user.telegramChatId,
          detail: `Tunggakan ${unpaidPastMeetings.length} pertemuan`,
          createdAt: FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error('Error sending overdue:', err);
      }
    }
  }

  return { count: sentCount };
}

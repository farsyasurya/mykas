import { initializeApp } from 'firebase-admin/app';
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { handleTelegramWebhook, sendTelegramMessage } from './telegram.js';
import { sendHMinus1Reminders, sendOverdueReminders } from './scheduledNotifications.js';
import { bootstrapSuperAdmin, assignClassAdmin } from './adminService.js';

initializeApp();

const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN');

/**
 * Webhook for Telegram Bot interactions & secure pairing
 */
export const telegramWebhook = onRequest(
  { secrets: [telegramBotToken] },
  async (req, res) => {
    const token = telegramBotToken.value();
    return handleTelegramWebhook(req, res, token);
  }
);

/**
 * Callable function to send a test message from user profile
 */
export const sendTestTelegramMessage = onCall(
  { secrets: [telegramBotToken] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Harus login terlebih dahulu.');
    }

    const { chatId } = request.data;
    if (!chatId) {
      throw new HttpsError('invalid-argument', 'Chat ID Telegram diperlukan.');
    }

    const token = telegramBotToken.value();
    const text = `🔔 <b>Tes Notifikasi MyKas Berhasil!</b>\n\nAkun Telegram Anda telah terhubung sempurna dengan sistem kas kelas MyKas.\nAnda akan menerima notifikasi otomatis ketika ada pembayaran kas atau jadwal pertemuan baru.`;

    try {
      const res = await sendTelegramMessage(token, chatId, text);
      return { success: true, result: res };
    } catch (err) {
      throw new HttpsError('internal', err.message);
    }
  }
);

/**
 * Scheduled Cloud Function: Runs daily at 07:00 WIB (00:00 UTC) to send H-1 meeting reminders
 */
export const scheduledMeetingReminder = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'Asia/Jakarta',
    secrets: [telegramBotToken]
  },
  async () => {
    const token = telegramBotToken.value();
    console.log('Running daily H-1 meeting reminder...');
    const result = await sendHMinus1Reminders(token);
    console.log(`Sent ${result.count} H-1 reminders.`);
  }
);

/**
 * Callable function: Bootstrap the first SUPER_ADMIN
 */
export const bootstrapFirstSuperAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Harus login untuk bootstrap.');
  }
  try {
    return await bootstrapSuperAdmin(request.auth.uid);
  } catch (err) {
    throw new HttpsError('failed-precondition', err.message);
  }
});

/**
 * Callable function: Assign class admin
 */
export const setClassAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Harus login.');
  }
  const { classId, targetUserId } = request.data;
  if (!classId || !targetUserId) {
    throw new HttpsError('invalid-argument', 'classId dan targetUserId wajib diisi.');
  }

  try {
    return await assignClassAdmin(request.auth.uid, classId, targetUserId);
  } catch (err) {
    throw new HttpsError('permission-denied', err.message);
  }
});

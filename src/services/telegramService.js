import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';

export const telegramService = {
  /**
   * Get deep link for pairing Telegram bot with current user's pairing code
   */
  getPairingLink(pairingCode) {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'MyKasClassBot';
    return `https://t.me/${botUsername}?start=${pairingCode}`;
  },

  /**
   * Send test notification to user's Telegram
   */
  async sendTestNotification(chatId) {
    if (!chatId) throw new Error('Chat ID tidak valid');

    try {
      // 1. Try Firebase Cloud Function if deployed
      const sendTest = httpsCallable(functions, 'sendTestTelegramMessage');
      const res = await sendTest({ chatId });
      return res.data;
    } catch (funcError) {
      console.warn('Cloud Function not reachable, checking client fallback...', funcError);

      // 2. Client fallback if bot token is present in development (or throw clear info)
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🔔 <b>Tes Notifikasi MyKas Berhasil!</b>\n\nAkun Telegram Anda telah terhubung dengan sistem MyKas.\nAnda akan menerima informasi pembayaran kas dan jadwal pertemuan secara berkala.`,
            parse_mode: 'HTML'
          })
        });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.description || 'Gagal mengirim pesan Telegram');
        return { success: true };
      }

      throw new Error(`Cloud Functions belum di-deploy atau belum dikonfigurasi: ${funcError.message}`);
    }
  }
};

/**
 * Telegram Service (Direct Client API without Firebase Cloud Functions)
 */

export const telegramService = {
  /**
   * Get deep link for pairing Telegram bot with current user's pairing code
   */
  getPairingLink(pairingCode) {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'mykastibot';
    return `https://t.me/${botUsername}?start=${pairingCode}`;
  },

  /**
   * Send test notification directly to user's Telegram via Telegram Bot API
   */
  async sendTestNotification(chatId) {
    if (!chatId) throw new Error('Chat ID tidak valid');

    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8737714506:AAExC-KVzt47MAAnZ2pg_Zv-K6cVdutjxbw';

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔔 <b>Tes Notifikasi MyKas Berhasil!</b>\n\nAkun Telegram Anda telah terhubung sempurna dengan sistem MyKas.\nPengingat kas dan jadwal pertemuan otomatis dikelola via GitHub Actions & Telegram Bot.`,
        parse_mode: 'HTML'
      })
    });

    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.description || 'Gagal mengirim pesan Telegram');
    }
    return { success: true };
  }
};

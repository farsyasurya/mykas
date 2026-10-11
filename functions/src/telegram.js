import fetch from 'node-fetch';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Send a message via Telegram Bot API
 * @param {string} botToken Telegram Bot Token
 * @param {string|number} chatId Telegram Chat ID
 * @param {string} text Markdown or HTML formatted text
 */
export async function sendTelegramMessage(botToken, chatId, text) {
  if (!botToken || !chatId) {
    throw new Error('Telegram Bot Token atau Chat ID tidak valid');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Telegram API Error: ${result.description || 'Unknown error'}`);
  }
  return result;
}

/**
 * Handle Telegram incoming webhook (e.g. /start PAIRING_CODE)
 */
export async function handleTelegramWebhook(req, res, botToken) {
  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).send('OK');
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = (message.text || '').trim();

    // Check if command is /start with pairing code: /start pair_XXXXXX
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const pairingCode = parts[1].trim();

        // Find user by pairing code
        const querySnapshot = await db.collection('users')
          .where('telegramPairingCode', '==', pairingCode)
          .limit(1)
          .get();

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();

          // Link telegram
          await userDoc.ref.update({
            telegramChatId: String(chatId),
            telegramUsername: message.chat.username || '',
            telegramConnected: true,
            telegramPairingCode: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp()
          });

          // Log
          await db.collection('notificationLogs').add({
            userId: userDoc.id,
            kelasId: userData.kelasId || '',
            type: 'TELEGRAM_CONNECTED',
            status: 'SUCCESS',
            detail: `Akun Telegram @${message.chat.username || chatId} berhasil dihubungkan.`,
            createdAt: FieldValue.serverTimestamp()
          });

          await sendTelegramMessage(
            botToken,
            chatId,
            `🎉 <b>Selamat datang di MyKas, ${userData.namaLengkap || 'Mahasiswa'}!</b>\n\nAkun Telegram Anda berhasil dihubungkan dengan akun MyKas.\nAnda akan menerima notifikasi pengingat kas, jadwal pertemuan, dan konfirmasi pembayaran secara otomatis.`
          );

          return res.status(200).json({ ok: true, paired: true });
        } else {
          await sendTelegramMessage(
            botToken,
            chatId,
            `⚠️ Kode verifikasi tidak ditemukan atau sudah kadaluarsa. Silakan periksa kembali kode di halaman profil MyKas Anda.`
          );
          return res.status(200).json({ ok: true, paired: false });
        }
      } else {
        await sendTelegramMessage(
          botToken,
          chatId,
          `👋 Halo! Ini adalah Bot Notifikasi Resmi <b>MyKas</b>.\nUntuk menghubungkan akun Anda, buka halaman Profil di aplikasi MyKas dan klik tombol <b>Hubungkan Telegram</b>.`
        );
        return res.status(200).send('OK');
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).send(err.message);
  }
}

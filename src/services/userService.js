import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

export const userService = {
  /**
   * Get all users belonging to a class
   */
  async getUsersByClass(classId) {
    if (!classId) return [];
    try {
      const q = query(
        collection(db, 'users'),
        where('kelasId', '==', classId),
        orderBy('namaLengkap', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getUsersByClass without orderBy:', e);
      const q = query(collection(db, 'users'), where('kelasId', '==', classId));
      const snap = await getDocs(q);
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return users.sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || ''));
    }
  },

  /**
   * Get only students (role: USER) belonging to a class (excludes ADMIN and SUPER_ADMIN)
   */
  async getStudentsByClass(classId) {
    const list = await this.getUsersByClass(classId);
    return list.filter(u => u.role === 'USER');
  },

  /**
   * Get all users across the system (for SUPER_ADMIN)
   */
  async getAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Get single user by UID
   */
  async getUserById(userId) {
    if (!userId) return null;
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  /**
   * Update self profile (allowed fields only: namaLengkap, namaPanggilan)
   */
  async updateProfile(userId, { namaLengkap, namaPanggilan }) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      namaLengkap: namaLengkap.trim(),
      namaPanggilan: namaPanggilan.trim(),
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Update role (SUPER_ADMIN only)
   */
  async updateUserRole(userId, newRole) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Generate temporary Telegram pairing code (e.g. "pair_a1b2c3")
   */
  async generateTelegramPairingCode(userId) {
    const code = 'kas_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      telegramPairingCode: code,
      updatedAt: serverTimestamp()
    });
    return code;
  },

  /**
   * Disconnect Telegram
   */
  async disconnectTelegram(userId) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      telegramChatId: '',
      telegramUsername: '',
      telegramConnected: false,
      telegramPairingCode: '',
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Manually bind Telegram Chat ID (with validation)
   */
  async bindTelegramChatId(userId, chatId) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      telegramChatId: String(chatId).trim(),
      telegramConnected: true,
      updatedAt: serverTimestamp()
    });
  }
};

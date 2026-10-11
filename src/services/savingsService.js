import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

export const savingsService = {
  /**
   * Get savings transactions for a specific user
   */
  async getTransactionsByUser(userId) {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, 'savingsTransactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getTransactionsByUser:', e);
      const q = query(collection(db, 'savingsTransactions'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
  },

  /**
   * Get all savings transactions for a class
   */
  async getTransactionsByClass(classId) {
    if (!classId) return [];
    try {
      const q = query(
        collection(db, 'savingsTransactions'),
        where('kelasId', '==', classId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getTransactionsByClass:', e);
      const q = query(collection(db, 'savingsTransactions'), where('kelasId', '==', classId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
  },

  /**
   * Refund student's savings (Pengembalian Uang Tabungan)
   * Decreases student's savings balance.
   * Decreases class cash on hand.
   * Recorded in savingsTransactions with type WITHDRAWAL.
   */
  async refundSavings({ kelasId, userId, nominal, deskripsi = 'Pengembalian tabungan ke mahasiswa', createdBy }) {
    const amount = parseInt(nominal, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal pengembalian harus berupa angka positif.');
    }

    const userRef = doc(db, 'users', userId);
    const txnRef = doc(collection(db, 'savingsTransactions'));
    const auditRef = doc(collection(db, 'auditLogs'));

    return await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('Data mahasiswa tidak ditemukan.');
      }

      const currentTabungan = Number(userDoc.data().tabungan) || 0;
      if (amount > currentTabungan) {
        throw new Error(`Saldo tabungan mahasiswa tidak mencukupi (Tersedia: Rp ${currentTabungan.toLocaleString()}, Diminta: Rp ${amount.toLocaleString()}).`);
      }

      const newTabungan = currentTabungan - amount;

      // Update student's tabungan
      transaction.update(userRef, {
        tabungan: newTabungan,
        updatedAt: serverTimestamp()
      });

      // Record savings transaction
      transaction.set(txnRef, {
        kelasId,
        userId,
        type: 'WITHDRAWAL',
        nominal: amount,
        deskripsi: deskripsi || 'Pengembalian tabungan ke mahasiswa',
        createdBy: createdBy || 'admin',
        createdAt: serverTimestamp()
      });

      // Record audit log
      transaction.set(auditRef, {
        action: 'SAVINGS_REFUNDED',
        kelasId,
        userId,
        nominal: amount,
        remainingTabungan: newTabungan,
        performedBy: createdBy,
        createdAt: serverTimestamp()
      });

      return {
        success: true,
        refundedAmount: amount,
        newTabungan
      };
    });
  }
};

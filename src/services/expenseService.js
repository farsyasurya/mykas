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

export const expenseService = {
  /**
   * Get all expenses for a class
   */
  async getExpensesByClass(classId) {
    if (!classId) return [];
    try {
      const q = query(
        collection(db, 'expenses'),
        where('kelasId', '==', classId),
        orderBy('tanggalPengeluaran', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getExpensesByClass:', e);
      const q = query(collection(db, 'expenses'), where('kelasId', '==', classId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => (b.tanggalPengeluaran || '').localeCompare(a.tanggalPengeluaran || ''));
    }
  },

  /**
   * Create expense with atomic saldo deduction
   */
  async createExpense({ kelasId, judul, kategori, deskripsi = '', nominal, tanggalPengeluaran, buktiUrl = '', createdBy }) {
    const amount = parseInt(nominal, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal pengeluaran harus berupa angka positif.');
    }
    if (!judul || !kategori || !tanggalPengeluaran) {
      throw new Error('Judul, kategori, dan tanggal pengeluaran wajib diisi.');
    }

    const classRef = doc(db, 'classes', kelasId);
    const expenseRef = doc(collection(db, 'expenses'));
    const auditRef = doc(collection(db, 'auditLogs'));

    return await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      if (!classDoc.exists()) throw new Error('Kelas tidak ditemukan');

      const currentSaldo = Number(classDoc.data().saldo) || 0;
      const newSaldo = currentSaldo - amount;

      // Update class saldo
      transaction.update(classRef, {
        saldo: newSaldo,
        updatedAt: serverTimestamp()
      });

      // Insert expense doc
      transaction.set(expenseRef, {
        kelasId,
        judul: judul.trim(),
        kategori,
        deskripsi: deskripsi.trim(),
        nominal: amount,
        tanggalPengeluaran,
        buktiUrl: buktiUrl.trim(),
        createdBy: createdBy || 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Insert audit log
      transaction.set(auditRef, {
        action: 'EXPENSE_RECORDED',
        kelasId,
        expenseId: expenseRef.id,
        judul: judul.trim(),
        nominal: amount,
        newSaldo,
        performedBy: createdBy,
        createdAt: serverTimestamp()
      });

      return {
        id: expenseRef.id,
        nominal: amount,
        newSaldo
      };
    });
  },

  /**
   * Delete expense and restore class saldo
   */
  async deleteExpense(expenseId, performedBy = '') {
    const expenseRef = doc(db, 'expenses', expenseId);

    return await runTransaction(db, async (transaction) => {
      const expenseDoc = await transaction.get(expenseRef);
      if (!expenseDoc.exists()) throw new Error('Pengeluaran tidak ditemukan');

      const data = expenseDoc.data();
      const classRef = doc(db, 'classes', data.kelasId);
      const classDoc = await transaction.get(classRef);

      if (classDoc.exists()) {
        const currentSaldo = Number(classDoc.data().saldo) || 0;
        transaction.update(classRef, {
          saldo: currentSaldo + data.nominal,
          updatedAt: serverTimestamp()
        });
      }

      transaction.delete(expenseRef);

      const auditRef = doc(collection(db, 'auditLogs'));
      transaction.set(auditRef, {
        action: 'EXPENSE_DELETED',
        kelasId: data.kelasId,
        expenseId,
        nominal: data.nominal,
        performedBy,
        createdAt: serverTimestamp()
      });

      return { success: true };
    });
  }
};

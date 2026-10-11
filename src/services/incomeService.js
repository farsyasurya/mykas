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

export const incomeService = {
  /**
   * Get other incomes for a class
   */
  async getOtherIncomesByClass(classId) {
    if (!classId) return [];
    try {
      const q = query(
        collection(db, 'otherIncomes'),
        where('kelasId', '==', classId),
        orderBy('tanggalPemasukan', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getOtherIncomesByClass:', e);
      const q = query(collection(db, 'otherIncomes'), where('kelasId', '==', classId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => (b.tanggalPemasukan || '').localeCompare(a.tanggalPemasukan || ''));
    }
  },

  /**
   * Record other income with atomic class saldo increase
   */
  async createOtherIncome({ kelasId, judul, kategori, deskripsi = '', nominal, tanggalPemasukan, sumberPemasukan = '', createdBy }) {
    const amount = parseInt(nominal, 10);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal pemasukan harus berupa angka positif.');
    }
    if (!judul || !tanggalPemasukan) {
      throw new Error('Judul dan tanggal pemasukan wajib diisi.');
    }

    const classRef = doc(db, 'classes', kelasId);
    const incomeRef = doc(collection(db, 'otherIncomes'));
    const auditRef = doc(collection(db, 'auditLogs'));

    return await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      if (!classDoc.exists()) throw new Error('Kelas tidak ditemukan');

      const currentSaldo = Number(classDoc.data().saldo) || 0;
      const newSaldo = currentSaldo + amount;

      // Update class saldo
      transaction.update(classRef, {
        saldo: newSaldo,
        updatedAt: serverTimestamp()
      });

      // Insert other income doc
      transaction.set(incomeRef, {
        kelasId,
        judul: judul.trim(),
        kategori: kategori || 'Lainnya',
        deskripsi: deskripsi.trim(),
        nominal: amount,
        tanggalPemasukan,
        sumberPemasukan: sumberPemasukan.trim(),
        createdBy: createdBy || 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Insert audit log
      transaction.set(auditRef, {
        action: 'OTHER_INCOME_RECORDED',
        kelasId,
        incomeId: incomeRef.id,
        judul: judul.trim(),
        nominal: amount,
        newSaldo,
        performedBy: createdBy,
        createdAt: serverTimestamp()
      });

      return {
        id: incomeRef.id,
        nominal: amount,
        newSaldo
      };
    });
  },

  /**
   * Delete other income and adjust class saldo
   */
  async deleteOtherIncome(incomeId, performedBy = '') {
    const incomeRef = doc(db, 'otherIncomes', incomeId);

    return await runTransaction(db, async (transaction) => {
      const incomeDoc = await transaction.get(incomeRef);
      if (!incomeDoc.exists()) throw new Error('Pemasukan tidak ditemukan');

      const data = incomeDoc.data();
      const classRef = doc(db, 'classes', data.kelasId);
      const classDoc = await transaction.get(classRef);

      if (classDoc.exists()) {
        const currentSaldo = Number(classDoc.data().saldo) || 0;
        transaction.update(classRef, {
          saldo: Math.max(0, currentSaldo - data.nominal),
          updatedAt: serverTimestamp()
        });
      }

      transaction.delete(incomeRef);

      const auditRef = doc(collection(db, 'auditLogs'));
      transaction.set(auditRef, {
        action: 'OTHER_INCOME_DELETED',
        kelasId: data.kelasId,
        incomeId,
        nominal: data.nominal,
        performedBy,
        createdAt: serverTimestamp()
      });

      return { success: true };
    });
  },

  // Aliases for convenience
  async getIncomesByClass(classId) {
    return this.getOtherIncomesByClass(classId);
  },
  async createIncome(data) {
    return this.createOtherIncome(data);
  },
  async deleteIncome(incomeId, performedBy = '') {
    return this.deleteOtherIncome(incomeId, performedBy);
  }
};

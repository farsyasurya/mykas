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

export const paymentService = {
  /**
   * Get all payments for a class
   */
  async getPaymentsByClass(classId) {
    if (!classId) return [];
    try {
      const q = query(
        collection(db, 'payments'),
        where('kelasId', '==', classId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getPaymentsByClass:', e);
      const q = query(collection(db, 'payments'), where('kelasId', '==', classId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    }
  },

  /**
   * Get all payments for a specific student
   */
  async getPaymentsByUser(userId) {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getPaymentsByUser:', e);
      const q = query(collection(db, 'payments'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    }
  },

  /**
   * Get set of paid meeting IDs for a specific user
   */
  async getPaidMeetingIdsForUser(userId) {
    const payments = await this.getPaymentsByUser(userId);
    const paidIds = new Set();
    payments.forEach(p => {
      if (Array.isArray(p.meetingIds)) {
        p.meetingIds.forEach(id => paidIds.add(id));
      }
    });
    return paidIds;
  },

  /**
   * Execute atomic payment transaction
   * - Validates meetingIds not already paid
   * - Allocates to kas and savings
   * - Updates class saldo and user savings atomically
   * - Creates savings transaction if excess
   * - Creates audit log
   */
  async processPayment({
    kelasId,
    semester,
    userId,
    namaLengkap,
    namaPanggilan,
    nim,
    nominalPembayaran,
    meetingIds,
    tarifKas = 7000,
    tipePembayaran = 'TRANSFER',
    createdBy
  }) {
    if (!kelasId || !userId || !meetingIds || meetingIds.length === 0) {
      throw new Error('Data pembayaran tidak lengkap (kelas, mahasiswa, atau pertemuan belum dipilih).');
    }

    const nominal = parseInt(nominalPembayaran, 10);
    const tarif = parseInt(tarifKas, 10) || 7000;
    const jumlahPertemuan = meetingIds.length;
    const totalMasukKas = jumlahPertemuan * tarif;

    if (isNaN(nominal) || nominal <= 0) {
      throw new Error('Nominal pembayaran harus berupa angka positif.');
    }

    if (nominal < totalMasukKas) {
      throw new Error(`Nominal pembayaran (Rp ${nominal.toLocaleString()}) kurang dari total kas untuk ${jumlahPertemuan} pertemuan (Rp ${totalMasukKas.toLocaleString()}).`);
    }

    const totalMasukTabungan = nominal - totalMasukKas;

    // Check user's previous payments to ensure none of the selected meetings are already paid
    const existingPayments = await this.getPaymentsByUser(userId);
    const alreadyPaidIds = new Set();
    existingPayments.forEach(p => {
      if (Array.isArray(p.meetingIds)) {
        p.meetingIds.forEach(id => alreadyPaidIds.add(id));
      }
    });

    const duplicateMeetings = meetingIds.filter(id => alreadyPaidIds.has(id));
    if (duplicateMeetings.length > 0) {
      throw new Error('Satu atau lebih pertemuan yang dipilih sudah pernah dibayar oleh mahasiswa ini.');
    }

    // References
    const classRef = doc(db, 'classes', kelasId);
    const userRef = doc(db, 'users', userId);
    const paymentRef = doc(collection(db, 'payments'));
    const savingsTxnRef = doc(collection(db, 'savingsTransactions'));
    const auditRef = doc(collection(db, 'auditLogs'));

    return await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      if (!classDoc.exists()) {
        throw new Error('Data kelas tidak ditemukan.');
      }

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('Data mahasiswa tidak ditemukan.');
      }

      const currentClassSaldo = Number(classDoc.data().saldo) || 0;
      const currentUserTabungan = Number(userDoc.data().tabungan) || 0;

      const newClassSaldo = currentClassSaldo + totalMasukKas;
      const newUserTabungan = currentUserTabungan + totalMasukTabungan;

      // 1. Update class saldo
      transaction.update(classRef, {
        saldo: newClassSaldo,
        updatedAt: serverTimestamp()
      });

      // 2. Update user tabungan
      transaction.update(userRef, {
        tabungan: newUserTabungan,
        updatedAt: serverTimestamp()
      });

      // 3. Create payment document
      const paymentData = {
        kelasId,
        semester,
        userId,
        namaLengkap: namaLengkap || userDoc.data().namaLengkap || '',
        namaPanggilan: namaPanggilan || userDoc.data().namaPanggilan || '',
        nim: nim || userDoc.data().nim || '',
        nominalPembayaran: nominal,
        totalMasukKas,
        totalMasukTabungan,
        meetingIds,
        jumlahPertemuan,
        tarifKas: tarif,
        tipePembayaran,
        createdBy: createdBy || 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      transaction.set(paymentRef, paymentData);

      // 4. If excess goes into savings, create savings transaction
      if (totalMasukTabungan > 0) {
        transaction.set(savingsTxnRef, {
          kelasId,
          userId,
          paymentId: paymentRef.id,
          type: 'DEPOSIT',
          nominal: totalMasukTabungan,
          deskripsi: `Kelebihan pembayaran kas (${jumlahPertemuan} pertemuan)`,
          createdBy: createdBy || 'admin',
          createdAt: serverTimestamp()
        });
      }

      // 5. Create audit log
      transaction.set(auditRef, {
        action: 'PAYMENT_RECORDED',
        kelasId,
        userId,
        paymentId: paymentRef.id,
        nominal,
        masukKas: totalMasukKas,
        masukTabungan: totalMasukTabungan,
        jumlahPertemuan,
        performedBy: createdBy,
        createdAt: serverTimestamp()
      });

      return {
        paymentId: paymentRef.id,
        totalMasukKas,
        totalMasukTabungan,
        newClassSaldo,
        newUserTabungan
      };
    });
  }
};

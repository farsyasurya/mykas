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
    nominalDariTabungan = 0,
    meetingIds,
    tarifKas = 7000,
    tipePembayaran = 'TRANSFER',
    createdAt = null,
    createdBy
  }) {
    if (!kelasId || !userId || !meetingIds || meetingIds.length === 0) {
      throw new Error('Data pembayaran tidak lengkap (kelas, mahasiswa, atau pertemuan belum dipilih).');
    }

    const nominal = parseInt(nominalPembayaran, 10) || 0;
    const pakaiTabungan = parseInt(nominalDariTabungan, 10) || 0;
    const jumlahPertemuan = meetingIds.length;

    // Ambil tarif kas riil dari masing-masing pertemuan di database 'meetings'
    let sumTarifKas = 0;
    const meetingSnaps = await Promise.all(
      meetingIds.map(id => getDoc(doc(db, 'meetings', id)))
    );
    meetingSnaps.forEach(mDoc => {
      if (mDoc.exists()) {
        const mData = mDoc.data();
        sumTarifKas += Number(mData.tarifKas) || 0;
      }
    });

    // Gunakan total tarif riil dari meetings, atau fallback jika tidak ditemukan
    const totalMasukKas = sumTarifKas > 0 ? sumTarifKas : (jumlahPertemuan * (parseInt(tarifKas, 10) || 7000));
    const totalDana = nominal + pakaiTabungan;

    if (nominal < 0 || pakaiTabungan < 0) {
      throw new Error('Nominal pembayaran dan tabungan tidak boleh bernilai negatif.');
    }

    if (totalDana <= 0) {
      throw new Error('Nominal pembayaran harus berupa angka positif.');
    }

    if (totalDana < totalMasukKas) {
      throw new Error(`Total dana (setoran Rp ${nominal.toLocaleString('id-ID')} + tabungan Rp ${pakaiTabungan.toLocaleString('id-ID')}) kurang dari total kas untuk ${jumlahPertemuan} pertemuan yang dipilih (Rp ${totalMasukKas.toLocaleString('id-ID')}).`);
    }

    const totalMasukTabungan = totalDana - totalMasukKas;

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
    const deductSavingsTxnRef = doc(collection(db, 'savingsTransactions'));
    const auditRef = doc(collection(db, 'auditLogs'));

    const paymentDate = createdAt ? (createdAt instanceof Date ? createdAt : new Date(createdAt)) : serverTimestamp();

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

      if (pakaiTabungan > currentUserTabungan) {
        throw new Error(`Saldo tabungan mahasiswa tidak mencukupi (Tersedia: Rp ${currentUserTabungan.toLocaleString('id-ID')}, Diminta: Rp ${pakaiTabungan.toLocaleString('id-ID')}).`);
      }

      const newClassSaldo = currentClassSaldo + totalMasukKas;
      const newUserTabungan = currentUserTabungan - pakaiTabungan + totalMasukTabungan;

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
        nominalDariTabungan: pakaiTabungan,
        totalDana,
        totalMasukKas,
        totalMasukTabungan,
        meetingIds,
        jumlahPertemuan,
        tarifKas: jumlahPertemuan > 0 ? Math.round(totalMasukKas / jumlahPertemuan) : (Number(tarifKas) || 7000),
        tipePembayaran: nominal === 0 && pakaiTabungan > 0 ? 'TABUNGAN' : tipePembayaran,
        pakaiTabungan: pakaiTabungan > 0,
        createdBy: createdBy || 'admin',
        createdAt: paymentDate,
        updatedAt: serverTimestamp()
      };
      transaction.set(paymentRef, paymentData);

      // 4a. If savings used to pay kas, create deduction savings transaction
      if (pakaiTabungan > 0) {
        transaction.set(deductSavingsTxnRef, {
          kelasId,
          userId,
          namaLengkap: namaLengkap || userDoc.data().namaLengkap || '',
          nim: nim || userDoc.data().nim || '',
          paymentId: paymentRef.id,
          type: 'WITHDRAWAL',
          nominal: pakaiTabungan,
          deskripsi: `Pembayaran kas via tabungan (${jumlahPertemuan} pertemuan)`,
          createdBy: createdBy || 'admin',
          createdAt: paymentDate
        });
      }

      // 4b. If excess goes into savings, create deposit savings transaction
      if (totalMasukTabungan > 0) {
        transaction.set(savingsTxnRef, {
          kelasId,
          userId,
          namaLengkap: namaLengkap || userDoc.data().namaLengkap || '',
          nim: nim || userDoc.data().nim || '',
          paymentId: paymentRef.id,
          type: 'DEPOSIT',
          nominal: totalMasukTabungan,
          deskripsi: `Kelebihan pembayaran kas (${jumlahPertemuan} pertemuan)`,
          createdBy: createdBy || 'admin',
          createdAt: paymentDate
        });
      }

      // 5. Create audit log
      transaction.set(auditRef, {
        action: 'PAYMENT_RECORDED',
        kelasId,
        userId,
        paymentId: paymentRef.id,
        nominal,
        nominalDariTabungan: pakaiTabungan,
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
        nominalDariTabungan: pakaiTabungan,
        newClassSaldo,
        newUserTabungan
      };
    });
  },

  /**
   * Delete / rollback a payment transaction atomically
   * - Restores class saldo (subtracts totalMasukKas)
   * - Restores user tabungan (adds back nominalDariTabungan, removes totalMasukTabungan)
   * - Deletes related savingsTransactions (WITHDRAWAL / DEPOSIT linked to this payment)
   * - Deletes payment document
   * - Writes audit log
   */
  async deletePayment(paymentId, deletedBy = 'admin') {
    if (!paymentId) throw new Error('ID Pembayaran tidak valid.');

    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) {
      throw new Error('Data pembayaran tidak ditemukan atau sudah dihapus.');
    }

    const paymentData = paymentSnap.data();
    const {
      kelasId,
      userId,
      totalMasukKas = 0,
      nominalDariTabungan = 0,
      totalMasukTabungan = 0,
      meetingIds = []
    } = paymentData;

    const classRef = doc(db, 'classes', kelasId);
    const userRef = doc(db, 'users', userId);
    const auditRef = doc(collection(db, 'auditLogs'));

    // Ambil mutasi tabungan yang pernah dibuat oleh transaksi pembayaran ini
    const savingsQ = query(
      collection(db, 'savingsTransactions'),
      where('paymentId', '==', paymentId)
    );
    const savingsSnap = await getDocs(savingsQ);

    return await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classRef);
      const userDoc = await transaction.get(userRef);

      const currentClassSaldo = classDoc.exists() ? (Number(classDoc.data().saldo) || 0) : 0;
      const currentUserTabungan = userDoc.exists() ? (Number(userDoc.data().tabungan) || 0) : 0;

      // 1. Kurangi saldo kelas yang tadinya masuk dari kas ini
      const newClassSaldo = Math.max(0, currentClassSaldo - Number(totalMasukKas || 0));

      // 2. Kembalikan tabungan:
      // Tabungan yang pernah dipakai dikembalikan (+), kelebihan yang pernah disetor ditarik (-)
      const netTabunganRollback = Number(nominalDariTabungan || 0) - Number(totalMasukTabungan || 0);
      const newUserTabungan = Math.max(0, currentUserTabungan + netTabunganRollback);

      if (classDoc.exists()) {
        transaction.update(classRef, {
          saldo: newClassSaldo,
          updatedAt: serverTimestamp()
        });
      }

      if (userDoc.exists()) {
        transaction.update(userRef, {
          tabungan: newUserTabungan,
          updatedAt: serverTimestamp()
        });
      }

      // 3. Hapus dokumen savingsTransactions terkait pembayaran ini
      savingsSnap.docs.forEach((sDoc) => {
        transaction.delete(doc(db, 'savingsTransactions', sDoc.id));
      });

      // 4. Hapus dokumen payment
      transaction.delete(paymentRef);

      // 5. Catat audit log
      transaction.set(auditRef, {
        action: 'PAYMENT_DELETED',
        paymentId,
        kelasId,
        userId,
        namaLengkap: paymentData.namaLengkap || '',
        nim: paymentData.nim || '',
        totalMasukKasDibatalkan: totalMasukKas,
        tabunganDikembalikan: nominalDariTabungan,
        tabunganDitarikKembali: totalMasukTabungan,
        meetingIds,
        deletedBy: deletedBy || 'admin',
        createdAt: serverTimestamp()
      });

      return {
        success: true,
        restoredClassSaldo: newClassSaldo,
        restoredUserTabungan: newUserTabungan,
        returnedTabungan: nominalDariTabungan,
        cancelledKas: totalMasukKas
      };
    });
  },

  /**
   * Update payment metadata (e.g. tipe pembayaran or date)
   */
  async updatePaymentMeta(paymentId, updates = {}, updatedBy = 'admin') {
    if (!paymentId) throw new Error('ID Pembayaran tidak valid.');
    const paymentRef = doc(db, 'payments', paymentId);

    const payload = {
      updatedAt: serverTimestamp(),
      updatedBy: updatedBy || 'admin'
    };

    if (updates.tipePembayaran) payload.tipePembayaran = updates.tipePembayaran;
    if (updates.createdAt) {
      payload.createdAt = updates.createdAt instanceof Date ? updates.createdAt : new Date(updates.createdAt);
    }

    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(paymentRef, payload);

    return { success: true };
  }
};

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

export const meetingService = {
  /**
   * Get all meetings for a class & semester
   */
  async getMeetingsByClass(classId, semester = null) {
    if (!classId) return [];
    try {
      let q;
      if (semester) {
        q = query(
          collection(db, 'meetings'),
          where('kelasId', '==', classId),
          where('semester', '==', semester),
          orderBy('nomorPertemuan', 'asc')
        );
      } else {
        q = query(
          collection(db, 'meetings'),
          where('kelasId', '==', classId),
          orderBy('nomorPertemuan', 'asc')
        );
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getMeetingsByClass:', e);
      let q = query(collection(db, 'meetings'), where('kelasId', '==', classId));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (semester) {
        list = list.filter(m => m.semester === semester);
      }
      return list.sort((a, b) => (a.nomorPertemuan || 0) - (b.nomorPertemuan || 0));
    }
  },

  /**
   * Create meeting with unique nomorPertemuan validation
   */
  async createMeeting({ kelasId, semester, nomorPertemuan, tanggalPertemuan, tarifKas = 7000, createdBy }) {
    const num = Number(nomorPertemuan);

    // Verify unique meeting number in class and semester
    const checkQ = query(
      collection(db, 'meetings'),
      where('kelasId', '==', kelasId),
      where('semester', '==', semester),
      where('nomorPertemuan', '==', num)
    );
    const existing = await getDocs(checkQ);
    if (!existing.empty) {
      throw new Error(`Pertemuan ke-${num} sudah ada di semester ${semester}. Nomor pertemuan harus unik.`);
    }

    const meetingRef = doc(collection(db, 'meetings'));
    const meetingData = {
      kelasId,
      semester,
      nomorPertemuan: num,
      tanggalPertemuan, // YYYY-MM-DD
      tarifKas: Number(tarifKas) || 7000,
      status: 'UPCOMING',
      cancelReason: '',
      createdBy: createdBy || 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(meetingRef, meetingData);

    // Audit log
    await setDoc(doc(collection(db, 'auditLogs')), {
      action: 'CREATE_MEETING',
      kelasId,
      meetingId: meetingRef.id,
      nomorPertemuan: num,
      tanggalPertemuan,
      performedBy: createdBy,
      createdAt: serverTimestamp()
    });

    return { id: meetingRef.id, ...meetingData };
  },

  /**
   * Update meeting schedule or status
   */
  async updateMeeting(meetingId, data) {
    const meetingRef = doc(db, 'meetings', meetingId);
    await updateDoc(meetingRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Cancel meeting with reason
   */
  async cancelMeeting(meetingId, reason, performedBy = '') {
    const meetingRef = doc(db, 'meetings', meetingId);
    const snap = await getDoc(meetingRef);
    if (!snap.exists()) throw new Error('Pertemuan tidak ditemukan');

    await updateDoc(meetingRef, {
      status: 'CANCELLED',
      cancelReason: reason || 'Dibatalkan oleh admin',
      updatedAt: serverTimestamp()
    });

    // Audit log
    await setDoc(doc(collection(db, 'auditLogs')), {
      action: 'CANCEL_MEETING',
      meetingId,
      kelasId: snap.data().kelasId,
      nomorPertemuan: snap.data().nomorPertemuan,
      reason,
      performedBy,
      createdAt: serverTimestamp()
    });
  }
};

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.js';

export const classService = {
  /**
   * Get all active classes
   */
  async getAllClasses() {
    let list = [];
    try {
      const q = query(collection(db, 'classes'), orderBy('namaKelas', 'asc'));
      const snap = await getDocs(q);
      list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('getAllClasses fallback to un-ordered query:', e);
      try {
        const snap = await getDocs(collection(db, 'classes'));
        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        list = [];
      }
    }

    const defaultClass = {
      id: '01TPLE002',
      namaKelas: '01TPLE002',
      tarifKas: 7000,
      semesterAktif: 'Semester 1 2026/2027',
      saldo: 0,
      isActive: true
    };

    if (!list.some(c => c.id === '01TPLE002' || c.namaKelas === '01TPLE002')) {
      // Auto-persist into Firestore if possible
      try {
        const classRef = doc(db, 'classes', '01TPLE002');
        const snap = await getDoc(classRef);
        if (!snap.exists()) {
          await setDoc(classRef, {
            ...defaultClass,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (err) {
        // Silently continue
      }
      return [defaultClass, ...list];
    }

    return list;
  },

  /**
   * Get class by ID
   */
  async getClassById(classId) {
    if (!classId) return null;
    try {
      const snap = await getDoc(doc(db, 'classes', classId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn('Error fetching class:', err);
    }

    if (classId === '01TPLE002') {
      return {
        id: '01TPLE002',
        namaKelas: '01TPLE002',
        tarifKas: 7000,
        semesterAktif: 'Semester 1 2026/2027',
        saldo: 0,
        isActive: true
      };
    }
    return null;
  },

  /**
   * Create new class (SUPER_ADMIN only)
   */
  async createClass({ namaKelas, tarifKas = 7000, semesterAktif = 'Ganjil 2026/2027', adminUid = '' }) {
    const classRef = doc(collection(db, 'classes'));
    const classData = {
      namaKelas: namaKelas.trim(),
      tarifKas: Number(tarifKas) || 7000,
      adminUid: adminUid || '',
      memberUids: [],
      semesterAktif: semesterAktif || 'Ganjil 2026/2027',
      saldo: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(classRef, classData);
    return { id: classRef.id, ...classData };
  },

  /**
   * Update class information
   */
  async updateClass(classId, data) {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Assign an admin to class
   */
  async assignAdmin(classId, newAdminUid) {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, {
      adminUid: newAdminUid,
      updatedAt: serverTimestamp()
    });

    // Also update target user's role to ADMIN
    if (newAdminUid) {
      const userRef = doc(db, 'users', newAdminUid);
      await updateDoc(userRef, {
        role: 'ADMIN',
        kelasId: classId,
        updatedAt: serverTimestamp()
      });
    }
  }
};

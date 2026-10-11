import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase.js';

export const auditService = {
  /**
   * Get audit logs for a class or globally
   */
  async getAuditLogs(classId = null, maxCount = 100) {
    try {
      let q;
      if (classId) {
        q = query(
          collection(db, 'auditLogs'),
          where('kelasId', '==', classId),
          orderBy('createdAt', 'desc'),
          limit(maxCount)
        );
      } else {
        q = query(
          collection(db, 'auditLogs'),
          orderBy('createdAt', 'desc'),
          limit(maxCount)
        );
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fallback getAuditLogs:', e);
      let q = collection(db, 'auditLogs');
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (classId) {
        list = list.filter(l => l.kelasId === classId);
      }
      return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, maxCount);
    }
  }
};

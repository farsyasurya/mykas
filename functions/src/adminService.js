import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();
const auth = getAuth();

/**
 * Bootstrap the very first SUPER_ADMIN securely.
 * Can only be called once when no SUPER_ADMIN exists in Firestore users.
 */
export async function bootstrapSuperAdmin(callerUid) {
  if (!callerUid) {
    throw new Error('Caller UID is required');
  }

  // Check if any SUPER_ADMIN already exists
  const superAdminSnap = await db.collection('users')
    .where('role', '==', 'SUPER_ADMIN')
    .limit(1)
    .get();

  if (!superAdminSnap.empty) {
    throw new Error('Aplikasi sudah memiliki SUPER_ADMIN. Bootstrap ditolak.');
  }

  // Promote caller
  const userRef = db.collection('users').doc(callerUid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User profile tidak ditemukan di database.');
  }

  await userRef.update({
    role: 'SUPER_ADMIN',
    updatedAt: FieldValue.serverTimestamp()
  });

  // Set custom user claims for Firebase Auth token
  await auth.setCustomUserClaims(callerUid, { role: 'SUPER_ADMIN' });

  // Record audit log
  await db.collection('auditLogs').add({
    action: 'BOOTSTRAP_SUPER_ADMIN',
    performedBy: callerUid,
    targetUserId: callerUid,
    timestamp: FieldValue.serverTimestamp(),
    details: 'Initial bootstrap of SUPER_ADMIN role.'
  });

  return { success: true, message: 'Berhasil diangkat menjadi SUPER_ADMIN!' };
}

/**
 * Assign an ADMIN to a class securely
 */
export async function assignClassAdmin(callerUid, classId, targetUserId) {
  // Verify caller is SUPER_ADMIN
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'SUPER_ADMIN') {
    throw new Error('Hanya SUPER_ADMIN yang berhak menetapkan admin kelas.');
  }

  const classRef = db.collection('classes').doc(classId);
  const classDoc = await classRef.get();
  if (!classDoc.exists) {
    throw new Error('Kelas tidak ditemukan.');
  }

  const targetUserRef = db.collection('users').doc(targetUserId);
  const targetUserDoc = await targetUserRef.get();
  if (!targetUserDoc.exists) {
    throw new Error('Mahasiswa tidak ditemukan.');
  }

  const oldAdminUid = classDoc.data().adminUid;

  // Run batch update
  const batch = db.batch();

  // Demote old admin back to USER if different
  if (oldAdminUid && oldAdminUid !== targetUserId) {
    const oldAdminRef = db.collection('users').doc(oldAdminUid);
    batch.update(oldAdminRef, {
      role: 'USER',
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  // Promote new admin
  batch.update(targetUserRef, {
    role: 'ADMIN',
    kelasId: classId,
    kelasNama: classDoc.data().namaKelas,
    updatedAt: FieldValue.serverTimestamp()
  });

  // Update class document with active adminUid
  batch.update(classRef, {
    adminUid: targetUserId,
    updatedAt: FieldValue.serverTimestamp()
  });

  // Add audit log
  const auditRef = db.collection('auditLogs').doc();
  batch.set(auditRef, {
    action: 'CHANGE_CLASS_ADMIN',
    performedBy: callerUid,
    kelasId: classId,
    oldAdminUid: oldAdminUid || null,
    newAdminUid: targetUserId,
    timestamp: FieldValue.serverTimestamp()
  });

  await batch.commit();

  // Set Auth Custom claims for fast authorization checks
  await auth.setCustomUserClaims(targetUserId, { role: 'ADMIN', kelasId: classId });
  if (oldAdminUid && oldAdminUid !== targetUserId) {
    await auth.setCustomUserClaims(oldAdminUid, { role: 'USER' });
  }

  return { success: true, message: 'Admin kelas berhasil ditetapkan.' };
}

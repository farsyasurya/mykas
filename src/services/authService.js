import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase.js';

export const authService = {
  /**
   * Listen to Firebase auth state changes
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Login with email & password
   */
  async login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    let userDoc = await this.getUserProfile(credential.user.uid);

    // Jika akun terdaftar di Firebase Auth namun belum memiliki dokumen profil di Firestore
    if (!userDoc) {
      const initialProfile = {
        uid: credential.user.uid,
        email: (credential.user.email || email).trim().toLowerCase(),
        namaLengkap: credential.user.displayName || email.split('@')[0],
        namaPanggilan: credential.user.displayName?.split(' ')[0] || email.split('@')[0],
        nim: '',
        kelasId: '',
        kelasNama: '',
        role: 'USER',
        tabungan: 0,
        telegramChatId: '',
        telegramConnected: false,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', credential.user.uid), initialProfile);
      userDoc = initialProfile;
    }

    return {
      user: credential.user,
      profile: userDoc
    };
  },

  /**
   * Register new student user
   * Rule: Always assigned role 'USER' and tabungan 0. NIM must be unique.
   */
  async register({ email, password, namaLengkap, namaPanggilan, nim, kelasId, kelasNama }) {
    const cleanNim = String(nim).trim();

    // 1. Check unique NIM
    const nimQuery = query(collection(db, 'users'), where('nim', '==', cleanNim));
    const nimSnap = await getDocs(nimQuery);
    if (!nimSnap.empty) {
      throw new Error(`NIM "${cleanNim}" sudah terdaftar. Silakan hubungi admin kelas jika ini adalah NIM Anda.`);
    }

    // 2. Create Firebase Auth user
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const uid = credential.user.uid;

    await updateProfile(credential.user, {
      displayName: namaLengkap.trim()
    });

    // 3. Create Firestore user document
    const userProfile = {
      uid: uid,
      email: email.trim().toLowerCase(),
      namaLengkap: namaLengkap.trim(),
      namaPanggilan: namaPanggilan ? namaPanggilan.trim() : namaLengkap.trim().split(' ')[0],
      nim: cleanNim,
      kelasId: kelasId || '',
      kelasNama: kelasNama || '',
      role: 'USER', // Enforced default role
      tabungan: 0,  // Enforced 0 initial savings
      telegramChatId: '',
      telegramConnected: false,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', uid), userProfile);

    // 4. Record audit log
    try {
      await setDoc(doc(collection(db, 'auditLogs')), {
        action: 'USER_REGISTERED',
        userId: uid,
        nim: cleanNim,
        namaLengkap: namaLengkap.trim(),
        kelasId: kelasId,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Audit log write error:', e);
    }

    return {
      user: credential.user,
      profile: userProfile
    };
  },

  /**
   * Get user profile by UID
   */
  async getUserProfile(uid) {
    if (!uid) return null;
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  },

  /**
   * Logout user
   */
  async logout() {
    return await signOut(auth);
  },

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    return await sendPasswordResetEmail(auth, email.trim());
  }
};

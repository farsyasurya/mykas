import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
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
   * Login with NIM or Email & password
   * @param {string} identifier - NIM Mahasiswa atau Email Akun
   * @param {string} password
   */
  async login(identifier, password) {
    const cleanId = String(identifier || '').trim();
    if (!cleanId) {
      throw new Error('NIM atau Email wajib diisi.');
    }

    let emailToUse = cleanId;

    // Jika input bukan format email (yaitu mahasiswa memasukkan NIM)
    if (!cleanId.includes('@')) {
      const q = query(collection(db, 'users'), where('nim', '==', cleanId));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error(`NIM "${cleanId}" tidak ditemukan. Pastikan NIM Anda sudah terdaftar.`);
      }
      const userData = snap.docs[0].data();
      if (!userData.email) {
        throw new Error(`Akun dengan NIM "${cleanId}" tidak memiliki email terdaftar.`);
      }
      emailToUse = userData.email;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, emailToUse.trim().toLowerCase(), password);
      let userDoc = await this.getUserProfile(credential.user.uid);

      // Jika akun berstatus tidak aktif, cegah login dan langsung logout
      if (userDoc && userDoc.isActive === false) {
        await signOut(auth);
        throw new Error('Akun Anda berstatus Tidak Aktif. Anda tidak dapat login ke sistem. Silakan hubungi Super Admin.');
      }

      // Jika akun terdaftar di Firebase Auth namun belum memiliki dokumen profil di Firestore
      if (!userDoc) {
        const initialProfile = {
          uid: credential.user.uid,
          email: (credential.user.email || emailToUse).trim().toLowerCase(),
          namaLengkap: credential.user.displayName || emailToUse.split('@')[0],
          namaPanggilan: credential.user.displayName?.split(' ')[0] || emailToUse.split('@')[0],
          nim: cleanId.includes('@') ? '' : cleanId,
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
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
      } else if (err.code === 'auth/user-not-found') {
        throw new Error('Akun tidak ditemukan. Pastikan NIM atau email Anda sudah benar.');
      }
      throw err;
    }
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
   * Send password reset email using Email or NIM
   */
  async resetPassword(identifier) {
    const cleanId = String(identifier || '').trim();
    let emailToUse = cleanId;

    if (!cleanId.includes('@')) {
      const q = query(collection(db, 'users'), where('nim', '==', cleanId));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error(`NIM "${cleanId}" tidak ditemukan.`);
      }
      const userData = snap.docs[0].data();
      if (!userData.email) {
        throw new Error(`Akun dengan NIM "${cleanId}" belum memiliki email terdaftar.`);
      }
      emailToUse = userData.email;
    }

    return await sendPasswordResetEmail(auth, emailToUse.trim().toLowerCase());
  },

  /**
   * Change password for the currently authenticated user
   * Re-authenticates with current password before updating to new password
   */
  async changePassword(currentPassword, newPassword) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Sesi masuk telah berakhir. Silakan login kembali.');
    }
    if (!currentUser.email) {
      throw new Error('Email akun tidak ditemukan.');
    }

    // Re-authenticate
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    // Update password
    await updatePassword(currentUser, newPassword);
  }
};

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA5hyGti5owt7QyL4-j0D3KGVwsiw2qric",
  authDomain: "mykas-7fe7b.firebaseapp.com",
  projectId: "mykas-7fe7b",
  storageBucket: "mykas-7fe7b.firebasestorage.app",
  messagingSenderId: "744354214466",
  appId: "1:744354214466:web:0c3d3796a31dd3fd0af3db",
  measurementId: "G-NBJ8ZB3XLD"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;



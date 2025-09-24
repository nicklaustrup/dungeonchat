import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDkaNKFFSvbphzzTRWPsDJtDP45boXqELY",
  authDomain: "superchat-58b43.firebaseapp.com",
  projectId: "superchat-58b43",
  storageBucket: "superchat-58b43.firebasestorage.app",
  messagingSenderId: "131619204399",
  appId: "1:131619204399:web:3cf92be0cd8c606ea245da"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export {
  app,
  auth,
  firestore,
  rtdb,
  storage,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
};

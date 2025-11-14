'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBuWpWEQQiT7pXJznxEkMFns0npDlmjaIw",
  authDomain: "lakshya-platform.firebaseapp.com",
  projectId: "lakshya-platform",
  storageBucket: "lakshya-platform.firebasestorage.app",
  messagingSenderId: "301499468953",
  appId: "1:301499468953:web:3cd7d04d708cb04058bc08",
  measurementId: "G-48EH55B1VW"
};

// --- Initialize Firebase ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// --- App ID for Firestore paths (if needed) ---
const appId = 'default-app-id';

// --- Current UID (may be null at first) ---
const currentUserId = auth.currentUser?.uid ?? null;

// --- Ensure User Is Signed In ---
const ensureUserIsSignedIn = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      console.log("✅ Already signed in as:", auth.currentUser.uid);
      return resolve(auth.currentUser);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Auth state changed. UID:", user.uid);
        unsubscribe();
        resolve(user);
      }
    }, (error) => {
      console.error("❌ Auth state error:", error);
      unsubscribe();
      reject(error);
    });

    (async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("🔥 Firebase sign-in error:", error);
        reject(error);
      }
    })();
  });
};

// --- Optional Debug Helper ---
const debugAuth = () => {
  if (auth.currentUser) {
    console.log("🔍 Auth UID:", auth.currentUser.uid);
  } else {
    console.log("⚠️ No user signed in yet.");
  }
};

export { db, auth, appId, currentUserId, ensureUserIsSignedIn, debugAuth };

'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  User,
  Unsubscribe,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBuWpWEQQiT7pXJznxEkMFns0npDlmjaIw",
  authDomain: "lakshya-platform.firebaseapp.com",
  projectId: "lakshya-platform",
  storageBucket: "lakshya-platform.firebasestorage.app",
  messagingSenderId: "301499468953",
  appId: "1:301499468953:web:3cd7d04d708cb04058bc08",
  measurementId: "G-48EH55B1VW",
};

// --- Initialize Firebase ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// --- App ID for Firestore paths (if needed) ---
const appId = 'default-app-id';

// --- Optional: attempt anonymous sign-in (only when explicitly requested) ---
export async function signInAnonymouslyIfNeeded(): Promise<void> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log('✅ Signed in anonymously');
    } catch (err) {
      console.warn('Anonymous sign-in failed:', err);
      throw err;
    }
  }
}

/**
 * Wait for a signed-in user. Does NOT auto-create an anonymous user.
 * If anonymous fallback is desired, call signInAnonymouslyIfNeeded() first.
 * @param timeoutMs optional timeout in milliseconds (default 10000)
 */
export async function ensureUserIsSignedIn(timeoutMs = 10000): Promise<User> {
  if (auth.currentUser) return auth.currentUser;

  return new Promise<User>((resolve, reject) => {
    let timedOut = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let unsub: Unsubscribe | null = null;

    // start timeout
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      if (unsub) unsub();
      reject(new Error(`ensureUserIsSignedIn: timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      unsub = onAuthStateChanged(
        auth,
        (user) => {
          if (timedOut) return;
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
          if (unsub) unsub();
          if (user) resolve(user);
          else reject(new Error('ensureUserIsSignedIn: no user found'));
        },
        (error) => {
          if (timedOut) return;
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
          if (unsub) unsub();
          reject(error);
        }
      );
    } catch (err) {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      if (unsub) unsub();
      reject(err as Error);
    }
  });
}

// --- Optional Debug Helper ---
export function debugAuth(): void {
  if (auth.currentUser) {
    console.log('🔍 Auth UID:', auth.currentUser.uid);
  } else {
    console.log('⚠️ No user signed in yet.');
  }
}

export { app, auth, db, appId };
export default app;

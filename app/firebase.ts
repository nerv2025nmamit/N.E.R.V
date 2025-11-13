'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth'; // Import User
import { getFirestore } from 'firebase/firestore';

// --- YOUR PERSONAL CONFIG (This is correct) ---
const firebaseConfig = {
  apiKey: "AIzaSyBuWpWEQQiT7pXJznxEkMFns0npDlmjaIw",
  authDomain: "lakshya-platform.firebaseapp.com",
  projectId: "lakshya-platform",
  storageBucket: "lakshya-platform.firebasestorage.app",
  messagingSenderId: "301499468953",
  appId: "1:301499468953:web:3cd7d04d708cb04058bc08",
  measurementId: "G-48EH55B1VW"
};

// 2. Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 3. Initialize and export services
const auth = getAuth(app);
const db = getFirestore(app);

// 4. --- THIS IS THE CRITICAL PATH FIX ---
// This is the path you confirmed from your database
const appId = 'default-app-id';

// 5. --- NEW SIMPLIFIED SIGN-IN ---
// This is the one, correct function.
const ensureUserIsSignedIn = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Check if user is already signed in
    if (auth.currentUser) {
      return resolve(auth.currentUser);
    }
    
    // Listen for auth state change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe(); // Stop listening
        resolve(user);
      }
    }, (error) => {
      unsubscribe();
      reject(error);
    });

    // Sign in anonymously
    (async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Firebase sign-in error:", error);
        reject(error);
      }
    })();
  });
};

export { db, auth, appId, ensureUserIsSignedIn };
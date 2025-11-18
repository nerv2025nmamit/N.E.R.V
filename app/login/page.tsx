'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ArrowRight, User, Mail, Lock, AlertCircle } from 'lucide-react';

import { auth, db, appId } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * theme
 */
const CornerOrnament = ({ className }: { className: string }) => (
  <svg
    className={`absolute w-8 h-8 text-amber-500/30 ${className}`}
    fill="none"
    viewBox="0 0 30 30"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M 0 20 Q 10 10, 20 0" />
    <path d="M 10 30 Q 10 15, 0 10" />
    <path d="M 30 10 Q 15 10, 10 0" />
  </svg>
);

// for email
const isValidEmail = (value: string) => {
  const email = value.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// to check erro
const mapAuthError = (code?: string, message?: string) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/wrong-password':
      return 'Incorrect password. Try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Create one first.';
    case 'auth/operation-not-allowed':
      return 'Email/password auth is disabled for this project. Enable it in Firebase Console.';
    default:
      return message || 'Authentication failed. Please try again.';
  }
};

type Ember = { left: string; delay: string; duration: string };

export default function LoginPage() {
  const [name, setName] = useState('');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [embers, setEmbers] = useState<Ember[] | null>(null);
  const router = useRouter();

  // on mismatch
  useEffect(() => {
    const generated: Ember[] = Array.from({ length: 20 }).map(() => ({
      left: `${(Math.random() * 100).toFixed(6)}%`,
      delay: `${(Math.random() * 10).toFixed(6)}s`,
      duration: `${(Math.random() * 10 + 10).toFixed(6)}s`,
    }));
    setEmbers(generated);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const email = (gmail || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      setError('Enter a valid email like name@college.in or you@gmail.com.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      if (name && user.displayName !== name) {
        try {
          await updateProfile(user, { displayName: name });
        } catch (uErr) {
          console.warn('Could not update displayName:', uErr);
        }
      }
      localStorage.setItem('user', JSON.stringify({ name: user.displayName || name, gmail: user.email, uid: user.uid }));
      router.push('/portal');
    } catch (err: any) {
      console.error('Sign in failed', err);
      setError(mapAuthError(err?.code, err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const email = (gmail || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      setError('Enter a valid email like name@college.in or you@gmail.com.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Choose a password of at least 6 characters.');
      return;
    }

    setIsSigningUp(true);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      if (name) {
        try {
          await updateProfile(user, { displayName: name });
        } catch (uErr) {
          console.warn('Could not set displayName:', uErr);
        }
      }

      const profileDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
      await setDoc(profileDocRef, {
        uid: user.uid,
        name: name || '',
        username: email.split('@')[0],
        profilePicUrl: '',
        bio: '',
        hashtags: '',
        role: '',
        college: '',
        pastCompanies: [],
        age: ''
      });

      localStorage.setItem('user', JSON.stringify({ name: user.displayName || name, gmail: user.email, uid: user.uid }));
      router.push('/portal');
    } catch (err: any) {
      console.error('Sign up failed', err);
      setError(mapAuthError(err?.code, err?.message));
    } finally {
      setIsSigningUp(false);
      setLoading(false);
    }
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/*background) */}
      <div className="absolute inset-0 w-full h-full z-0" aria-hidden>
        {embers
          ? embers.map((e, i) => (
              <div
                key={i}
                className="golden-ember"
                style={{
                  left: e.left,
                  animationDelay: e.delay,
                  animationDuration: e.duration,
                }}
              />
            ))
          : null}
      </div>

      {/* Login Form */}
      <motion.form
        onSubmit={handleSignIn}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md p-8 sm:p-12 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/10"
      >
        {/* theme corner */}
        <CornerOrnament className="top-4 left-4" />
        <CornerOrnament className="top-4 right-4 rotate-90" />
        <CornerOrnament className="bottom-4 left-4 -rotate-90" />
        <CornerOrnament className="bottom-4 right-4 rotate-180" />

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
            className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-2 border-amber-500/50 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Target className="w-10 h-10 text-amber-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 font-serif">
            Welcome, Seeker
          </h1>
          <p className="text-slate-400 mt-2">Your journey awaits. Enter the portal.</p>
        </div>

        {/* help box */}
        <div className="my-6 p-4 bg-slate-800/60 border border-amber-500/20 rounded-lg text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-amber-400">Students:</strong> Please log in with your{' '}
            <strong className="font-medium">@collegename.in</strong> email.
          </p>
          <p className="mt-1">
            <strong className="text-amber-400">Alumni:</strong> Please log in with your
            personal Gmail.
          </p>
        </div>
        {/* --- end help box*/}

        {/* Input Fields */}
        <div className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
            <input
              type="text"
              placeholder="Full Name (if u have an account skip)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
            <input
              type="email"
              placeholder="Email Address (e.g., name@college.in or you@gmail.com)"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Password info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-amber-500/70">
            For first-time users, create an account. Passwords are managed securely by Firebase.
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mt-4 p-3 bg-red-900/50 border border-red-700/50 text-red-300 rounded-lg flex items-center text-sm"
            >
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-amber-500/40 flex items-center justify-center"
          >
            {loading ? 'Please wait...' : 'Sign in'}
            <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300" />
          </motion.button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={isSigningUp || loading}
            className="w-full py-3 border border-amber-500 text-amber-300 rounded-lg"
          >
            {isSigningUp ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </motion.form>

      {/*styling*/}
      <style jsx>{`
        .golden-ember {
          position: absolute;
          bottom: -20px;
          width: 3px;
          height: 3px;
          background-color: #eab308; /* amber-500 */
          border-radius: 50%;
          opacity: 0;
          animation: float-up 10s linear infinite;
          box-shadow: 0 0 5px #eab308, 0 0 10px #eab308;
        }

        @keyframes float-up {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10%,
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}

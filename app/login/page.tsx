'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
} from 'lucide-react';

/**
 * A decorative corner element to give the form an epic, ornamental feel.
 */
const CornerOrnament = ({ className }: { className: string }) => (
  <svg
    className={`absolute w-8 h-8 text-amber-500/30 ${className}`}
    fill="none"
    viewBox="0 0 30 30"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    {/* Simple scroll/ornamental flourish */}
    <path d="M 0 20 Q 10 10, 20 0" />
    <path d="M 10 30 Q 10 15, 0 10" />
    <path d="M 30 10 Q 15 10, 10 0" />
  </svg>
);

export default function LoginPage() {
  const [name, setName] = useState('');
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // For displaying errors instead of alert()
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '12345') {
      setError(''); // Clear any previous errors
      localStorage.setItem('user', JSON.stringify({ name, gmail }));
      // This will redirect to your app/portal/page.tsx
      router.push('/portal'); 
    } else {
      setError('Incorrect password! Please try again.');
    }
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Animated Golden Embers Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="golden-ember"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Login Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md p-8 sm:p-12 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/10"
      >
        {/* Ornamental Corners */}
        <CornerOrnament className="top-4 left-4" />
        <CornerOrnament className="top-4 right-4 rotate-90" />
        <CornerOrnament className="bottom-4 left-4 -rotate-90" />
        <CornerOrnament className="bottom-4 right-4 rotate-180" />

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 10,
            }}
            className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-2 border-amber-500/50 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Target className="w-10 h-10 text-amber-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 font-serif">
            Welcome, Seeker
          </h1>
          <p className="text-slate-400 mt-2">
            Your journey awaits. Enter the portal.
          </p>
        </div>

        {/* --- INSTRUCTION BOX --- */}
        <div className="my-6 p-4 bg-slate-800/60 border border-amber-500/20 rounded-lg text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-amber-400">Students:</strong> Please log in
            with your{' '}
            {/* TODO: Change this to your college domain */}
            <strong className="font-medium">@collegename.in</strong> email.
          </p>
          <p className="mt-1">
            <strong className="text-amber-400">Alumni:</strong> Please log in
            with your personal Gmail.
          </p>
        </div>
        {/* --- END INSTRUCTION BOX --- */}

        {/* Input Fields */}
        <div className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
            <input
              type="email"
              placeholder="Email Address"
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Password Hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-amber-500/70">
            Hint: The password is{' '}
            <span className="font-bold text-amber-400">12345</span>
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

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-4 px-6 mt-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-amber-500/40 group flex items-center justify-center"
        >
          Enter Portal
          <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
        </motion.button>
      </motion.form>

      {/* CSS for the floating embers animation */}
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
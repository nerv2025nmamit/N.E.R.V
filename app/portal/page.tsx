'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Users, Bot, Newspaper, GitBranch } from 'lucide-react';

// --- Custom Fiery Arrow Logo (for this page) ---
const FieryArrowLogo = () => (
  <motion.div
    className="flex flex-col items-center gap-2"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5 }}
  >
    <svg
      width="24"
      height="40"
      viewBox="0 0 24 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-amber-500 h-14 w-14" // Made logo larger
    >
      <defs>
        <filter id="fire-glow-page" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="fire-gradient-page" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" /> {/* yellow-300 */}
          <stop offset="50%" stopColor="#F59E0B" /> {/* amber-500 */}
          <stop offset="100%" stopColor="#D97706" /> {/* amber-600 */}
        </linearGradient>
      </defs>
      <motion.path
        d="M12 2C12 2 13 8 16 12C19 16 20 22 20 22C20 22 18 20 16 19C14 18 12 20 12 20V2Z"
        fill="url(#fire-gradient-page)"
        opacity="0.7"
        filter="url(#fire-glow-page)"
        initial={{ y: 5, opacity: 0.8 }}
        animate={{ y: [0, -3, 0], opacity: [1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path
        d="M12 2L12 38M12 38L8 34M12 38L16 34"
        stroke="url(#fire-gradient-page)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d="M12 2L12 38M12 38L8 34M12 38L16 34"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'blur(1px)' }}
      />
    </svg>
  </motion.div>
);

// --- Feature Item Component (Restyled for Scroll) ---
interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description, delay }) => (
  <motion.li
    className="flex items-start gap-4"
    variants={{ // Animation variants for stagger
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } }
    }}
  >
    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-800/10 text-amber-900 flex-shrink-0">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h3 className="text-lg font-serif font-bold text-slate-900">{title}</h3>
      <p className="text-slate-700">{description}</p>
    </div>
  </motion.li>
);

// --- Stagger Animation for the List ---
const listVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.2, // Stagger each child by 0.2s
    },
  },
  hidden: {},
};


// --- Main Portal Page ---
export default function PortalPage() {
  const [userName, setUserName] = useState('Seeker');

  // Get user name from local storage on client-side
  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        setUserName(JSON.parse(user).name.split(' ')[0] || 'Seeker'); // Get first name
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* --- Main Welcome Card (with new shimmer animation) --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative mb-12 flex flex-col items-center rounded-2xl border border-amber-500/10 bg-gradient-to-tr from-slate-900/50 to-slate-950/30 p-8 text-center overflow-hidden"
      >
        {/* Shimmer Effect */}
        <motion.div 
          className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-amber-300/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'linear'
          }}
        />

        <FieryArrowLogo />
        
        <h1 className="mt-4 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 font-serif tracking-widest">
          WELCOME TO LAKSHYA
        </h1>
        
        <p className="mt-4 text-lg text-slate-300">
          Welcome to Your Portal,{' '}
          <span className="font-bold text-white">{userName}!</span> 👋
        </p>

        <p className="mt-2 text-sm text-slate-400 font-serif italic">
          &quot;Karmanye Vadhikaraste Ma Phaleshu Kadachana&quot;
        </p>
      </motion.div>

      {/* --- NEW: "Ancient Scroll" Section --- */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="relative p-8 md:p-12 rounded-lg border-2 border-amber-400/50 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-50 shadow-xl shadow-amber-900/50"
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h20v20H0V0zm20%2020h20v20H20V20z%22%20fill%3D%22%2392400E%22%20fill-opacity%3D%220.02%22%20%2F%3E%3C%2Fsvg%3E')] opacity-50"></div>

        <div className="relative z-10">
          <h2 className="mb-8 text-center text-3xl font-bold text-slate-900 font-serif">
            Your Arsenal of Abilities
          </h2>
          <motion.ul 
            className="space-y-6"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <FeatureItem
              icon={Users}
              title="Interact with Alumni"
              description="Connect with elders, read their sagas (stories), and find valuable guidance."
              delay={0.4}
            />
            <FeatureItem
              icon={Bot}
              title="Seek Divine Guidance"
              description="Ask questions and receive personalized vyūhas (strategies) from Drona AI."
              delay={0.6} // Increased delay for better stagger
            />
            <FeatureItem
              icon={GitBranch}
              title="Create Custom Roadmaps"
              description="Use Drona AI to build step-by-step plans to conquer your career goals."
              delay={0.8} // Increased delay
            />
            <FeatureItem
              icon={Newspaper}
              title="Stay Updated on the Battlefield"
              description="Be updated about the latest tech news, internships, and opportunities."
              delay={1.0} // Increased delay
            />
          </motion.ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
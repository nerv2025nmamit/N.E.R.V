'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Newspaper,
  Bot,
  MessageSquare,
  LogOut,
  User,
  Menu,
  X,
  Target,
  Edit,
  Compass,
  Inbox, // --- NEW: Added Inbox icon
} from 'lucide-react';

// --- Re-usable Hook (unchanged) ---
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

// --- Navigation Items ---
const navItems = [
  { href: '/portal', icon: Home, label: 'Home' },
  { href: '/portal/stroll', icon: Compass, label: 'Stroll' },
  { href: '/portal/wisdom-hub', icon: MessageSquare, label: 'Wisdom Hub' },
  // --- NEW: Added Inbox Link ---
  { href: '/portal/messages', icon: Inbox, label: 'Inbox' },
  { href: '/portal/chatbot', icon: Bot, label: 'Drona AI' },
  { href: '/portal/news', icon: Newspaper, label: 'Tech-ronicles' },
  { href: '/portal/profile', icon: User, label: 'My Profile' },
];

// --- Fiery Arrow Logo (unchanged) ---
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
      className="text-amber-500"
    >
      <defs>
        <filter id="fire-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="fire-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <motion.path
        d="M12 2C12 2 13 8 16 12C19 16 20 22 20 22C20 22 18 20 16 19C14 18 12 20 12 20V2Z"
        fill="url(#fire-gradient)"
        opacity="0.7"
        filter="url(#fire-glow)"
        initial={{ y: 5, opacity: 0.8 }}
        animate={{ y: [0, -3, 0], opacity: [1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path
        d="M12 2L12 38M12 38L8 34M12 38L16 34"
        stroke="url(#fire-gradient)"
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
    <div className="font-serif text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
      LAKSHYA
    </div>
  </motion.div>
);

// --- Animation Variants (unchanged) ---
const navListVariants = {
  open: {
    transition: { staggerChildren: 0.05, delayChildren: 0.2 },
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const navItemVariants = {
  open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
  closed: { y: 30, opacity: 0, transition: { y: { stiffness: 1000 } } },
};

// --- Main Layout (unchanged) ---
export default function PortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Seeker');
  
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        setUserName(JSON.parse(user).name || 'Seeker');
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* --- Mobile Header --- */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-amber-500/10 bg-slate-950/80 px-4 backdrop-blur-lg lg:hidden">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-amber-500" />
          <span className="font-serif text-lg font-bold tracking-wider text-white">
            LAKSHYA
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-200 hover:text-amber-400"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </motion.button>
      </header>

      {/* --- Sidebar Overlay (for mobile) --- */}
      <AnimatePresence>
        {isSidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- Sidebar --- */}
      <motion.aside
        animate={isDesktop ? { x: '0%' } : { x: isSidebarOpen ? '0%' : '-100%' }}
        initial={{ x: isDesktop ? '0%' : '-100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-8 overflow-y-auto border-r border-amber-500/10 bg-slate-950/90 p-6 backdrop-blur-lg lg:static"
      >
        <div className="flex items-center justify-between">
          <FieryArrowLogo />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:text-amber-400 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-6 w-6" />
          </motion.button>
        </div>

        {/* Navigation Links */}
        <motion.nav 
          variants={navListVariants} 
          initial="closed" 
          animate="open" 
          className="flex-1"
        >
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/portal/messages' && pathname.startsWith('/portal/messages/'));
              return (
                <motion.li key={item.label} variants={navItemVariants}>
                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 shadow-inner shadow-amber-500/5'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    {item.label}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </motion.nav>

        {/* User Info & Sign Out (unchanged) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-auto"
        >
          <Link
            href="/portal/profile"
            className="group mb-4 block rounded-lg border border-slate-800/50 bg-slate-900/50 p-4 transition-all duration-300 hover:border-amber-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {userName}
                </div>
                <div className="text-xs text-slate-400 group-hover:text-amber-400 transition-colors">
                  View Profile
                </div>
              </div>
              <Edit className="ml-auto h-4 w-4 text-slate-600 transition-all duration-300 group-hover:text-amber-400 group-hover:translate-x-1" />
            </div>
          </Link>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="group flex w-full items-center justify-center gap-3 rounded-lg bg-slate-800/50 px-4 py-3 text-sm font-medium text-red-400/70 transition-all duration-200 hover:bg-red-900/50 hover:text-red-400 hover:shadow-lg hover:shadow-red-500/10"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </motion.button>
        </motion.div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}
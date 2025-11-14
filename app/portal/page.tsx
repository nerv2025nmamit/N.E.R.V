'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Compass, MessageSquare, Bot, Newspaper, Sparkles, Target } from 'lucide-react';

// --- Particle definitions and effects as before ---
interface Particle {
  id: number;
  x: string;
  y: string;
  duration: number;
  delay: number;
  size: number;
  initialY?: number;
}

const GoldenBubbles = () => {
  const [bubbles, setBubbles] = useState<Particle[]>([]);
  useEffect(() => {
    const generatedBubbles = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: Math.random() * 16 + 8,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 5,
      initialY: Math.random() * 200,
    }));
    setBubbles(generatedBubbles);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-amber-300/20 blur-sm"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: bubble.x,
            top: `calc(${bubble.y} + ${bubble.initialY}px)`,
          }}
          animate={{
            y: [`calc(${bubble.initialY}px)`, `calc(${bubble.initialY}px - 150px)`],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: bubble.delay,
            repeatType: "loop"
          }}
        />
      ))}
    </div>
  );
};

const FieryWisps = () => {
  const [wisps, setWisps] = useState<Particle[]>([]);
  useEffect(() => {
    const generatedWisps = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${100 + Math.random() * 20}%`,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 10,
    }));
    setWisps(generatedWisps);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden -z-20 pointer-events-none">
      {wisps.map((wisp) => (
        <motion.div
          key={wisp.id}
          className="absolute rounded-full bg-gradient-to-t from-orange-500/0 via-amber-400/30 to-yellow-300/0 blur-md"
          style={{
            width: `${wisp.size}px`,
            height: `${wisp.size * 2}px`,
            left: wisp.x,
            top: wisp.y,
          }}
          animate={{
            y: [`${100 + Math.random() * 20}%`, `${-50 - Math.random() * 20}%`],
            opacity: [0, 0.3, 0.5, 0.3, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: wisp.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: wisp.delay,
            repeatType: "loop"
          }}
        />
      ))}
    </div>
  );
};

const FlameThrowerParticles = () => {
  const [flames, setFlames] = useState<Particle[]>([]);
  useEffect(() => {
    const generatedFlames = Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      x: `${10 + Math.random() * 80}%`,
      y: `100%`,
      size: Math.random() * 32 + 28,
      duration: Math.random() * 3 + 2.7,
      delay: Math.random() * 3,
    }));
    setFlames(generatedFlames);
  }, []);
  return (
    <div className="absolute bottom-0 left-0 w-full h-full -z-30 pointer-events-none">
      {flames.map((flame) => (
        <motion.div
          key={flame.id}
          className="absolute rounded-full"
          style={{
            width: `${flame.size}px`,
            height: `${flame.size * 1.47}px`,
            left: flame.x,
            bottom: '0',
            background: 'radial-gradient(circle at 60% 40%, #ffde85 0%, #ff8323 54%, #ffd84b00 90%)'
          }}
          animate={{
            opacity: [0, 0.8, 0.6, 0],
            y: [0, -120, -150],
            scale: [1, 1.17, 1],
            rotate: [0, (Math.random() * 18) - 9, 0],
          }}
          transition={{
            duration: flame.duration,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: flame.delay,
          }}
        />
      ))}
    </div>
  );
};

const ArsenalParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    const generatedParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5,
    }));
    setParticles(generatedParticles);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-400"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.x,
            top: p.y,
          }}
          animate={{
            y: [0, -80],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

const FieryArrowLogo = () => {
  const [imgError, setImgError] = useState(false);
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1, duration: 1, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-center">
        {imgError ? (
          <div className="h-36 w-36 rounded-full bg-slate-800 border-4 border-amber-500 flex items-center justify-center">
            <Target className="w-16 h-16 text-amber-500" />
          </div>
        ) : (
          <motion.img
            src="/image.jpg"
            alt="Lakshya Archer Logo"
            className="h-36 w-36 rounded-full object-cover border-4 border-amber-400 shadow-xl bg-slate-900"
            onError={() => setImgError(true)}
            initial={{ filter: 'drop-shadow(0 0 0px rgba(251,191,36,0))' }}
            animate={{
              filter: [
                'drop-shadow(0 0 16px rgba(251,191,36,0.8))',
                'drop-shadow(0 0 24px rgba(251,191,36,1))',
                'drop-shadow(0 0 16px rgba(251,191,36,0.8))'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
      <div className="font-serif text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
        LAKSHYA
      </div>
    </motion.div>
  );
};

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description, delay }) => (
  <motion.li
    className="flex items-start gap-4"
    variants={{
      hidden: { opacity: 0, y: 30, scale: 0.9 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut', delay } },
    }}
  >
    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 flex-shrink-0 border border-amber-500 shadow-lg shadow-amber-500/10">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg md:text-xl font-serif font-bold text-amber-200 break-words">{title}</h3>
      <p className="text-slate-300 text-base break-words">{description}</p>
    </div>
  </motion.li>
);

const listVariants: Variants = {
  visible: { transition: { staggerChildren: 0.2 } },
  hidden: {},
};

export default function PortalPage() {
  const [userName, setUserName] = useState('Seeker');
  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        setUserName(JSON.parse(user).name.split(' ')[0] || 'Seeker');
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
      className="w-full min-h-screen relative overflow-x-hidden"
    >

      {/* Effects */}
      <FieryWisps />
      <GoldenBubbles />
      <FlameThrowerParticles />

      <motion.div
        className="absolute inset-0 bg-gradient-radial from-orange-400/5 via-transparent to-transparent blur-3xl scale-150 -z-30 pointer-events-none"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Welcome Card (responsive) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative mb-8 flex flex-col items-center rounded-2xl border border-amber-500/20 bg-gradient-to-tr from-slate-900/70 to-slate-950/40 p-4 sm:p-6 md:p-8 w-full max-w-lg mx-auto text-center overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-radial from-amber-400/20 via-transparent to-transparent blur-3xl scale-125 animate-pulse-light"></div>
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-amber-300/10 to-transparent pointer-events-none"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <FieryArrowLogo />
        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 font-serif tracking-widest drop-shadow-lg break-words">
          WELCOME TO LAKSHYA
        </h1>
        <p className="mt-2 text-md sm:text-lg text-slate-300 break-words">
          Welcome to Your Portal, <span className="font-bold text-white">{userName}!</span> 👋
        </p>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 font-serif italic break-words">
          &quot;Karmanye Vadhikaraste Ma Phaleshu Kadachana&quot;
        </p>
      </motion.div>

      {/* Arsenal scroll/card (responsive) */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-lg mx-auto p-4 sm:p-6 md:p-8 rounded-3xl border border-amber-500/20 bg-slate-900/70 backdrop-blur-md shadow-2xl shadow-black/30 overflow-hidden z-10"
      >
        <ArsenalParticles />
        <div className="relative z-10">
          <h2 className="mb-6 text-center text-2xl sm:text-3xl md:text-4xl font-bold text-amber-300 font-serif drop-shadow-md break-words">
            Your Arsenal of Abilities
            <Sparkles className="inline-block ml-2 text-yellow-300 h-8 w-8 animate-pulse-slow" />
          </h2>
          <motion.ul
            className="space-y-6"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <FeatureItem
              icon={Compass}
              title="Stroll the Grounds"
              description="Explore the profiles of all seekers and guides on the platform. Find mentors and peers."
              delay={0.6}
            />
            <FeatureItem
              icon={MessageSquare}
              title="Visit the Wisdom Hub"
              description="Read, post, and comment on the chronicles shared by the community."
              delay={0.8}
            />
            <FeatureItem
              icon={Bot}
              title="Seek Divine Guidance"
              description="Confer with Drona AI to unravel complex challenges and receive personalized vyūhas (strategies)."
              delay={1.0}
            />
            <FeatureItem
              icon={Newspaper}
              title="Monitor the Battlefield"
              description="Stay acutely aware of the latest tech news, internships, and emerging opportunities."
              delay={1.2}
            />
          </motion.ul>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes pulse-light {
          0%, 100% { opacity: 0.8; transform: scale(1.25); }
          50% { opacity: 1; transform: scale(1.35); }
        }
        .animate-pulse-light {
          animation: pulse-light 4s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Compass, MessageSquare, Bot, Newspaper, Sparkles } from 'lucide-react';
import { GoldenBubbles, FlameWisps } from '../../components/Particles';
import { FieryArrowLogo } from '../../components/FieryArrowLogo';

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description, delay }) => (
  <motion.li
    className="flex items-start gap-3"
    variants={{
      hidden: { opacity: 0, y: 20, scale: 0.96 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut', delay } },
    }}
  >
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-amber-300 flex-shrink-0 border border-red-500 shadow-md">
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 break-words whitespace-normal">
      <h3 className="text-base sm:text-lg font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-200">
        {title}
      </h3>
      <p className="text-slate-300 text-sm">{description}</p>
    </div>
  </motion.li>
);

const listVariants: Variants = {
  visible: { transition: { staggerChildren: 0.18 } },
  hidden: {},
};

export default function PortalPage() {
  const [userName, setUserName] = useState('Seeker');

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) setUserName(JSON.parse(user).name.split(' ')[0] || 'Seeker');
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="w-full min-h-screen relative overflow-visible bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
    >
      {/* Particles */}
      <div className="hidden sm:block pointer-events-none">
        <FlameWisps />
        <GoldenBubbles />
      </div>

      {/* Welcome card */}
      <motion.div
        initial={{ opacity: 0, scale: 1.06, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative mb-6 flex flex-col items-center rounded-xl border border-red-500/20 
                   bg-gradient-to-tr from-slate-900/70 to-slate-950/30 p-4 sm:p-6 w-full sm:max-w-2xl mx-auto text-center shadow-2xl"
      >
        <FieryArrowLogo />
        <h1 className="mt-3 text-2xl sm:text-4xl font-bold text-transparent bg-clip-text 
                       bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 font-serif tracking-widest">
          WELCOME TO LAKSHYA
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300">
          Welcome, <span className="font-bold text-amber-200">{userName}!</span>
        </p>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 font-serif italic">
          "Karmanye Vadhikaraste Ma Phaleshu Kadachana"
        </p>
      </motion.div>

      {/* Arsenal card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
        className="relative w-full sm:max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl border border-red-500/20 
                   bg-slate-900/75 backdrop-blur-md shadow-2xl overflow-visible"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* style particlese */}
        <div className="hidden sm:block pointer-events-none">
          <FlameWisps />
          <GoldenBubbles />
        </div>

        <div className="relative z-10">
          <h2 className="mb-4 text-center text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-200 font-serif">
            Your Arsenal of Abilities
            <Sparkles className="inline-block ml-2 text-yellow-300 h-6 w-6 animate-pulse-slow" />
          </h2>

          <motion.ul
            className="space-y-6 sm:space-y-8 pb-8"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <FeatureItem
              icon={Compass}
              title="Stroll the Grounds"
              description="Explore seekers and guides. Find mentors and peers."
              delay={0.3}
            />
            <FeatureItem
              icon={MessageSquare}
              title="Visit the Wisdom Hub"
              description="Read, post, and comment on chronicles shared by the community."
              delay={0.45}
            />
            <FeatureItem
              icon={Bot}
              title="Seek Divine Guidance"
              description="Confer with Drona AI to unravel challenges and receive personalized vyūhas."
              delay={0.6}
            />
            <FeatureItem
              icon={Newspaper}
              title="Monitor the Battlefield"
              description="Stay aware of the latest tech news, internships, and opportunities without missing updates."
              delay={0.75}
            />
            <FeatureItem
              icon={Newspaper}
              title="Tech Chronicle"
              description="Get the latest technology news, trends, and breakthroughs without missing any update."
              delay={0.9}
            />
          </motion.ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Target,
  Users,
  BookOpen,
  Bot,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

//Type Definitions 
interface PortalCardProps {
  title: string;
  icon: ReactNode;
  description: string;
  cta: string;
  color: 'blue' | 'amber';
  delay: number;
  href: string;
  isExternal: boolean;
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay: number;
}

interface Maker {
  name: string;
  role: string;
  image: string;
}

interface MakerCardProps {
  maker: Maker;
  index: number;
}

//  Components
const SectionHeading = ({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="text-center mb-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif tracking-wide"
      >
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
          {children}
        </span>
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-slate-400 max-w-2xl mx-auto text-lg"
        >
          {subtitle}
        </motion.p>
      )}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        className="h-1 w-24 bg-gradient-to-r from-amber-500 to-transparent mx-auto mt-6"
      />
    </div>
  );
};

// --- our info 
const makers: Maker[] = [
  {
    name: 'SUCHAYA',
    role: 'MEMBER',
    image: 'https://placehold.co/400x400/1e293b/eab308?text=M1',
  },
  {
    name: 'BHARGAV',
    role: 'MEMBER',
    image: 'https://placehold.co/400x400/1e293b/eab308?text=M2',
  },
  {
    name: 'GAURAV',
    role: 'MEMBER',
    image: 'https://placehold.co/400x400/1e293b/eab308?text=M3',
  },
  {
    name: 'DEVANG',
    role: 'MEMBER',
    image: 'https://placehold.co/400x400/1e293b/eab308?text=M4',
  },
];

// --- Main Component ---
export default function Home() {
  const [arrowShot, setArrowShot] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setArrowShot(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const scrollToPortals = () => {
    targetRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
      {/* bg*/}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/20 rounded-full blur-[120px] opacity-40"></div>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            {/* Logo image */}
            <img
              src="/image.jpg"
              alt="Lakshya logo"
              className="w-9 h-9 rounded-md object-cover"
            />
            <span className="text-2xl font-bold tracking-wider text-white font-serif">
              LAKSHYA
            </span>
          </motion.div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-amber-400 transition-colors">
              Mission
            </a>
            <a href="#team" className="hover:text-amber-400 transition-colors">
              Makers
            </a>
            <button
              onClick={scrollToPortals}
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
            >
              Enter Portal
            </button>
          </div>
        </div>
      </nav>

      {/* info  */}
      <section className="relative z-10 min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Bridging Legends & Future Leaders</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight font-serif">
              Your Target, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600">
                Defined.
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0">
              LAKSHYA is the ultimate platform connecting ambitious students with
              accomplished alumni. Get mentored, find opportunities, and hit
              your career goals with precision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={scrollToPortals}
                className="px-8 py-4 bg-white text-slate-950 text-lg font-bold rounded-full hover:bg-amber-400 transition-all duration-300 flex items-center group"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className="px-8 py-4 text-white text-lg font-medium rounded-full border border-slate-700 hover:border-amber-500/50 hover:bg-slate-900 transition-all duration-300"
              >
                Explore Features
              </a>
            </div>
          </motion.div>

          {/* bow n arrow */}
          <div className="relative h-[500px] flex items-center justify-center">
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0, x: 80 }}
              animate={{ scale: 1, opacity: 1, x: 120 }}
              transition={{ duration: 1 }}
              className="absolute right-0"
            >
              <svg width="300" height="300" viewBox="0 0 100 100" className="opacity-80">
                <circle cx="50" cy="50" r="45" stroke="#334155" strokeWidth="0.5" fill="none" />
                <circle cx="50" cy="50" r="35" stroke="#475569" strokeWidth="0.5" fill="none" />
                <circle cx="50" cy="50" r="25" stroke="#64748b" strokeWidth="1" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="15"
                  stroke="#eab308"
                  strokeWidth="2"
                  fill="none"
                  className="drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                />
                <circle cx="50" cy="50" r="5" fill="#eab308" />
              </svg>
            </motion.div>

           
            <motion.div
              initial={{ x: -140, opacity: 0 }}
              animate={{ x: -50, opacity: 2}}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute left-0 lg:-left-10 h-64 w-32 opacity-60 lg:opacity-100"
            >
              <svg
                viewBox="0 0 100 200"
                className="w-full h-full stroke-slate-500"
                fill="none"
                strokeWidth="2"
              >
               
                <path d="M 10 10 C 80 50, 80 150, 10 190" strokeLinecap="round" />

                <motion.line
                  x1="10"
                  y1="10"
                  x2="10"
                  y2="190"
                  stroke="#eab308"
                  strokeWidth="1"
                  initial={{ x: 10 }}
                  animate={arrowShot ? { x: 20 } : { x: 10 }} // subtle pull towards the arrow nock
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>

            {/* Arrow startin*/}
            <motion.div
              initial={{ x: -160, opacity: 0 }}
              animate={
                arrowShot
                  ? { x: 190, opacity: [1, 1, 0] }
                  : { x: -160, opacity: 1 }
              }
              transition={{
                duration: arrowShot ? 0.6 : 0,
                ease: 'backIn',
                opacity: { delay: 0.5, duration: 0.1 },
              }}
              className="absolute left-1/2 top-1/2"
              style={{ marginTop: '-1px', marginLeft: '-50px' }}
            >
              <div className="w-[220px] h-[2px] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 relative">
               
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[12px] border-l-amber-500"></div>
              </div>
            </motion.div>

            {/* Hit  target */}
            <AnimatePresence>
              {arrowShot && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
                  className="absolute right-10 w-20 h-20 bg-amber-500/40 rounded-full blur-md"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Portals Section */}
      <section id="portals" ref={targetRef} className="relative z-10 py-32 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading subtitle="Your journey begins here. Are you seeking guidance, or are you ready to give back?">
            Enter The Arena
          </SectionHeading>

          <div className="max-w-xl mx-auto">
            <PortalCard
              title="Enter the Portal"
              icon={<Target className="w-12 h-12" />}
              description="Students and Alumni, your journey begins here. Login or register to access the platform."
              cta="Login / Register"
              color="amber"
              delay={0.2}
              href="/login"
              isExternal={false}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading subtitle="A complete arsenal for career success.">
            Divine Weapons for Your Career
          </SectionHeading>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-400" />}
              title="Alumni Connect"
              description="Direct access to seniors who have walked the path before you. Schedule 1:1 mentorship sessions."
              delay={0.1}
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-amber-400" />}
              title="Opportunity Hub"
              description="Exclusive internships, latest tech news, and curated courses posted directly by industry insiders."
              delay={0.3}
            />
            <FeatureCard
              icon={<Bot className="w-8 h-8 text-emerald-400" />}
              title="DRONA.AI"
              description="Our advanced chatbot provides instant, personalized roadmaps to crack your dream companies."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="about" className="relative z-10 py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-serif tracking-wide">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
                Our Mission
              </span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              Our mission is to forge an unbreakable bond between a college&apos;s
              present and its past. We believe every student deserves access to
              the wisdom of those who came before them.
            </p>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              LAKSHYA provides the battlefield, the weapons, and the divine
              guidance. Your <span className="text-amber-400 font-bold">target</span> is the only thing
              left to conquer.
            </p>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-slate-950 text-lg font-bold rounded-full hover:bg-amber-400 transition-all duration-300 flex items-center group w-fit"
            >
              Join the Quest
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="relative h-80 lg:h-96"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-blue-500/10 rounded-3xl -rotate-3 transition-transform hover:rotate-0 duration-500"></div>
            <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-md rounded-3xl rotate-2 shadow-2xl transition-transform hover:rotate-0 duration-500 flex items-center justify-center p-8">
              <span className="text-8xl text-amber-500 opacity-30">
                <Target />
              </span>
              <p className="text-2xl text-center font-serif text-slate-200 z-10 relative">
                &quot;The path is made by walking on it. We just provide the
                map.&quot;
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Makers Section */}
      <section id="team" className="relative z-10 py-32 bg-slate-900/50 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading>The Architects:
                          Team N.E.R.V
          </SectionHeading>
          <div className="grid md:grid-cols-3 gap-8 justify-center">
            {makers.map((maker, index) => (
              <MakerCard key={index} maker={maker} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-slate-950 border-t border-slate-900 text-center text-slate-500">
        <div className="flex items-center justify-center space-x-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
          <Target className="w-6 h-6" />
          <span className="font-serif font-bold tracking-widest">LAKSHYA</span>
        </div>
        <p>© 2025 Lakshya Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

// --- Sub
const PortalCard: React.FC<PortalCardProps> = ({
  title,
  icon,
  description,
  cta,
  color,
  delay,
  href,
  isExternal,
}) => {
  const isAmber = color === 'amber';
  const baseColor = isAmber ? 'amber' : 'blue';

  const colors = {
    amber: {
      border: 'group-hover:border-amber-500/50',
      bg_glow: 'bg-amber-500/5',
      icon_bg: 'bg-amber-500/10',
      icon_text: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-400',
      shadow: 'hover:shadow-amber-500/10',
    },
    blue: {
      border: 'group-hover:border-blue-500/50',
      bg_glow: 'bg-blue-500/5',
      icon_bg: 'bg-blue-500/10',
      icon_text: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-500',
      shadow: 'hover:shadow-blue-500/10',
    },
  }[baseColor];

  const CardContent = () => (
    <>
      <div
        className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.bg_glow}`}
      ></div>

      <div className="relative z-10 flex flex-col h-full">
        <div
          className={`w-20 h-20 rounded-2xl ${colors.icon_bg} ${colors.icon_text} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}
        >
          {icon}
        </div>
        <h3 className="text-3xl font-bold text-white mb-4 font-serif">{title}</h3>
        <p className="text-slate-400 mb-10 flex-grow text-lg leading-relaxed">{description}</p>
        <div
          className={`w-full py-4 rounded-xl font-bold text-slate-950 text-center flex items-center justify-center transition-all duration-300 ${colors.button} group-hover:shadow-lg`}
        >
          {cta}
          {isExternal ? (
            <ExternalLink className="ml-2 w-5 h-5" />
          ) : (
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          )}
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8, type: 'spring', bounce: 0.3 }}
      className={`group relative p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm transition-all duration-500 ${colors.border} hover:shadow-2xl ${colors.shadow}`}
    >
      {isExternal ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          <CardContent />
        </a>
      ) : (
        <Link href={href} className="block">
          <CardContent />
        </Link>
      )}
    </motion.div>
  );
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-2xl"
    >
      <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const MakerCard: React.FC<MakerCardProps> = ({ maker, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="text-center"
    >
      <div className="relative inline-block mb-4">
        <img
          src={maker.image}
          alt={maker.name}
          className="w-40 h-40 rounded-full object-cover border-4 border-slate-700 shadow-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://placehold.co/400x400/1e293b/eab308?text=${maker.name
              .split(' ')
              .map((n) => n[0])
              .join('')}`;
          }}
        />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center border-4 border-slate-900/50 text-slate-900 font-bold">
          {index + 1}
        </div>
      </div>
      <h4 className="text-xl font-bold text-white">{maker.name}</h4>
      <p className="text-amber-400/80">{maker.role}</p>
    </motion.div>
  );
};

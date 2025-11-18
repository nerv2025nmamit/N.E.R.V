'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, Loader2, Globe } from 'lucide-react';
import { db, appId, ensureUserIsSignedIn } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ParticlesWrapper } from '../../../components/ParticlesWrapper';
import { PageCard } from '../../../components/PageCard';


// --- Type definition ---
type UserProfile = {
  uid: string;
  name: string;
  username: string;
  profilePicUrl: string;
  bio: string;
  hashtags: string;
  role: 'student' | 'employee' | 'entrepreneur' | '';
  college: string;
};

// --- Profile Card Component ---
const ProfileCard = ({ profile, delay }: { profile: UserProfile; delay: number }) => {
  const router = useRouter();

  const handleViewProfile = () => {
    try {
      sessionStorage.setItem('viewing_profile', JSON.stringify(profile));
    } catch {}
    router.push(`/portal/stroll/${profile.uid}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="group relative flex flex-col bg-gradient-to-br from-indigo-900/70 via-slate-900/60 to-slate-950/70 border border-indigo-700 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:border-emerald-400/50 hover:shadow-emerald-400/20 hover:-translate-y-1.5"
    >
      {/* lightweight aura on md+, hidden on small to save perf */}
      <div
        className="absolute inset-0 -z-10 blur-2xl hidden md:block"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      <div className="flex items-center gap-4 p-4 md:p-5 border-b border-slate-800">
        <img
          src={profile.profilePicUrl || 'https://placehold.co/80x80/1e293b/eab308?text=PIC'}
          alt={profile.name}
          className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-2 border-amber-500/40"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://placehold.co/80x80/1e293b/eab308?text=PIC';
          }}
        />
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white font-serif">
            {profile.name || profile.username || 'Anonymous'}
          </h3>
          {profile.name && (
            <p className="text-xs md:text-sm font-medium text-emerald-300">
              @{profile.username || 'no_username'}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 md:p-5 flex-1">
        <span className="px-2 md:px-3 py-1 bg-slate-800 text-amber-300 text-xs md:text-sm font-medium rounded-full capitalize">
          {profile.role || 'Seeker'}
        </span>
        <p className="text-sm md:text-base text-slate-400 line-clamp-3 mt-3 mb-3">
          {profile.bio || 'No bio provided.'}
        </p>

        {profile.college && (
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <Book className="w-4 h-4 text-emerald-400/70" />
            <span className="text-sm">{profile.college}</span>
          </div>
        )}

        {profile.hashtags && (
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.hashtags.split(' ').map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-emerald-400/10 text-emerald-300 text-xs md:text-sm font-medium rounded-full"
              >
                {tag.startsWith('#') ? '' : '#'}
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 bg-slate-900/50 border-t border-slate-800">
        <button
          onClick={handleViewProfile}
          className="w-full text-center px-3 py-2 bg-slate-800/70 text-emerald-300 font-medium rounded-lg transition-all duration-300 group-hover:bg-amber-400 group-hover:text-slate-900"
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
};

// --- Main Stroll Page ---
export default function StrollPage() {
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      try {
        await ensureUserIsSignedIn();
      } catch (e) {
        console.error('Authentication failed for Stroll page:', e);
      } finally {
        setIsAuthReady(true);
      }
    };
    authenticate();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const profilesPath = `/artifacts/${appId}/public/data/profiles`;
        const profilesCollectionRef = collection(db, profilesPath);
        const querySnapshot = await getDocs(profilesCollectionRef);

        const profilesList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as UserProfile;
          profilesList.push({ ...data, uid: data.uid || doc.id });
        });

        setAllProfiles(profilesList);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setAllProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [isAuthReady]);

  const filteredProfiles = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    if (!lowerSearch) return allProfiles;

    return allProfiles.filter(
      (profile) =>
        profile.name?.toLowerCase().includes(lowerSearch) ||
        profile.username?.toLowerCase().includes(lowerSearch) ||
        profile.college?.toLowerCase().includes(lowerSearch) ||
        profile.bio?.toLowerCase().includes(lowerSearch) ||
        profile.hashtags?.toLowerCase().includes(lowerSearch) ||
        profile.role?.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm, allProfiles]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative"
    >
      {/* Particles on md+ only */}
      <div className="pointer-events-none -z-20 absolute inset-0">
        <ParticlesWrapper hideOnMobile />
      </div>

      {/* Safe-area top padding */}
      <div className="pt-safe pb-safe">
        {/* Header */}
        <div className="mb-4">
          <h1 className="flex items-center gap-3 text-2xl sm:text-4xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-indigo-400 to-amber-400 drop-shadow-lg">
            Stroll the Grounds
            <Globe className="w-6 h-6 text-amber-300" />
          </h1>
          <p className="text-sm sm:text-lg text-slate-400 mb-4 font-serif italic">
            Explore the profiles of seekers and guides —{' '}
            <span className="text-amber-300">“ज्ञानं परमं बलम्”</span>
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/70" />
            <input
              type="text"
              placeholder="Search by name, @username, college, skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-4 bg-slate-900/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>
        </div>

        {/* Profiles Grid (mobile-first) */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredProfiles.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-6 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl sm:col-span-2 lg:col-span-3"
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {allProfiles.length === 0
                      ? 'No Profiles in Database (Save one in My Profile)'
                      : 'No Seekers Match Your Search'}
                  </h3>
                  <p className="text-slate-400 mt-2 text-sm">
                    This platform is new, be the first to create a profile!
                  </p>
                </motion.div>
              ) : (
                filteredProfiles.map((profile, index) => (
                  <ProfileCard
                    key={profile.uid || `${profile.username}-${index}`}
                    profile={profile}
                    delay={index * 0.03}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style jsx>{`
        .pt-safe { padding-top: env(safe-area-inset-top, 12px); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 12px); }

        /* reduce heavy glows on small screens */
        @media (max-width: 767px) {
          .blur-3xl { filter: blur(8px); opacity: 0.6; }
        }
      `}</style>
    </motion.div>
  );
}
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book, Loader2, Globe } from 'lucide-react'; // <-- Added Globe icon
import { db, appId, ensureUserIsSignedIn } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative flex flex-col bg-gradient-to-br from-indigo-900/70 via-slate-900/60 to-slate-950/70 border border-indigo-700 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:border-emerald-400/50 hover:shadow-emerald-400/20 hover:-translate-y-1.5"
    >
      {/* Krishna aura glow */}
      <div
        className="absolute inset-0 -z-10 blur-2xl"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      <div className="flex items-center gap-4 p-5 border-b border-slate-800">
        <img
          src={profile.profilePicUrl || 'https://placehold.co/80x80/1e293b/eab308?text=PIC'}
          alt={profile.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/40"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://placehold.co/80x80/1e293b/eab308?text=PIC';
          }}
        />
        <div>
          <h3 className="text-xl font-bold text-white font-serif">
            {profile.name || profile.username || 'Anonymous'}
          </h3>
          {profile.name && (
            <p className="text-sm font-medium text-emerald-300">
              @{profile.username || 'no_username'}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 flex-1">
        <span className="px-3 py-1 bg-slate-800 text-amber-300 text-xs font-medium rounded-full capitalize">
          {profile.role || 'Seeker'}
        </span>
        <p className="text-sm text-slate-400 line-clamp-3 mt-4 mb-4">
          {profile.bio || 'No bio provided.'}
        </p>

        {profile.college && (
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <Book className="w-4 h-4 text-emerald-400/70" />
            <span>{profile.college}</span>
          </div>
        )}

        {profile.hashtags && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.hashtags.split(' ').map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-emerald-400/10 text-emerald-300 text-xs font-medium rounded-full"
              >
                {tag.startsWith('#') ? '' : '#'}
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <button
          onClick={handleViewProfile}
          className="w-full text-center px-4 py-2 bg-slate-800/70 text-emerald-300 font-medium rounded-lg transition-all duration-300 group-hover:bg-amber-400 group-hover:text-slate-900"
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto relative"
    >
      {/* Krishna aura background */}
      <div
        className="absolute inset-0 -z-20 blur-3xl"
        style={{
          background:
            'radial-gradient(1200px 600px at 20% 20%, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0) 60%), radial-gradient(1000px 500px at 80% 30%, rgba(99,102,241,0.08) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 450px at 50% 80%, rgba(251,191,36,0.08) 0%, rgba(0,0,0,0) 60%)',
        }}
      />

      {/* Header with Earth icon */}
      <h1 className="flex items-center gap-3 text-5xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-indigo-400 to-amber-400 mb-4 drop-shadow-lg">
        Stroll the Grounds 
        <Globe className="w-8 h-8 text-amber-300" />
      </h1>
      <p className="text-lg text-slate-400 mb-8 font-serif italic">
        Explore the profiles of seekers and guides —{' '}
        <span className="text-amber-300">“ज्ञानं परमं बलम्”</span>
      </p>

      {/* Search Bar */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/70" />
        <input
          type="text"
          placeholder="Search by name, @username, college, skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProfiles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-10 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl md:col-span-3"
              >
                <h3 className="text-xl font-semibold text-white">
                  {allProfiles.length === 0
                    ? 'No Profiles in Database (Save one in My Profile)'
                    : 'No Seekers Match Your Search'}
                </h3>
                <p className="text-slate-400 mt-2">
                  This platform is new, be the first to create a profile!
                </p>
              </motion.div>
            ) : (
              filteredProfiles.map((profile, index) => (
                <ProfileCard
                  key={profile.uid || `${profile.username}-${index}`}
                  profile={profile}
                  delay={index * 0.05}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Global animations */}
      <style jsx global>{`
        @keyframes pulse-light {
          0%,
          100% {
            opacity: 0.85;
            transform: scale(1.15);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }
        .animate-pulse-light {
          animation: pulse-light 4s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
}

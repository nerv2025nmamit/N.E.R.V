'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- NEW: Import useRouter
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Book, Hash, Loader2 } from 'lucide-react';
import { db, appId, ensureUserIsSignedIn } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

// --- Type definition (unchanged) ---
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
const ProfileCard = ({ profile, delay }: { profile: UserProfile, delay: number }) => {
  const router = useRouter(); // <-- NEW: Get router

  const handleViewProfile = () => {
    // --- NEW: Save the profile to session storage BEFORE navigating ---
    sessionStorage.setItem('viewing_profile', JSON.stringify(profile));
    router.push(`/portal/stroll/${profile.uid}`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1.5"
    >
      <div className="flex items-center gap-4 p-5 border-b border-slate-800">
        <img
          src={profile.profilePicUrl || 'https://placehold.co/80x80/1e293b/eab308?text=PIC'}
          alt={profile.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-slate-700"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/80x80/1e293b/eab308?text=PIC' }}
        />
        <div>
          <h3 className="text-xl font-bold text-white font-serif">
            {profile.name || profile.username || 'Anonymous'}
          </h3>
          {profile.name && (
            <p className="text-sm font-medium text-amber-400">
              @{profile.username || 'no_username'}
            </p>
          )}
        </div>
      </div>
      <div className="p-5 flex-1">
        <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-full capitalize">
          {profile.role || 'Seeker'}
        </span>
        <p className="text-sm text-slate-400 line-clamp-3 mt-4 mb-4">{profile.bio || 'No bio provided.'}</p>
        
        {profile.college && (
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
            <Book className="w-4 h-4 text-amber-500/60" />
            <span>{profile.college}</span>
          </div>
        )}
        
        {profile.hashtags && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.hashtags.split(' ').map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full">
                {tag.startsWith('#') ? '' : '#'}
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* --- UPDATED: This is now a button that runs a function --- */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <button
          onClick={handleViewProfile}
          className="w-full text-center px-4 py-2 bg-slate-800/70 text-amber-400 font-medium rounded-lg transition-all duration-300 group-hover:bg-amber-500 group-hover:text-slate-900"
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

  // --- 1. Authentication Check (unchanged) ---
  useEffect(() => {
    const authenticate = async () => {
        try {
            await ensureUserIsSignedIn();
        } catch (e) {
            console.error("Authentication failed for Stroll page:", e);
        } finally {
            setIsAuthReady(true);
        }
    };
    authenticate();
  }, []);

  // --- 2. Load ALL profiles from database (unchanged) ---
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
          profilesList.push(doc.data() as UserProfile);
        });

        setAllProfiles(profilesList);
      } catch (error) {
        console.error("Error fetching profiles (Permissions/Path Failure):", error);
        setAllProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [isAuthReady]);

  // --- Filter profiles (unchanged) ---
  const filteredProfiles = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    if (!lowerSearch) return allProfiles;

    return allProfiles.filter(profile => 
      profile.name?.toLowerCase().includes(lowerSearch) ||
      profile.username?.toLowerCase().includes(lowerSearch) ||
      profile.college?.toLowerCase().includes(lowerSearch) ||
      profile.bio?.toLowerCase().includes(lowerSearch) ||
      profile.hashtags?.toLowerCase().includes(lowerSearch) ||
      profile.role?.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm, allProfiles]);

  // --- Render Logic (unchanged) ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <h1 className="text-5xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-4">
        Stroll the Grounds
      </h1>
      <p className="text-lg text-slate-400 mb-8">
        Explore the profiles of students, mentors, and entrepreneurs in the community.
      </p>

      {/* Search Bar */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
        <input
          type="text"
          placeholder="Search by name, @username, college, skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
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
                   ? "No Profiles in Database (Save one in My Profile)" 
                   : "No Seekers Match Your Search"
                  }
                </h3>
                <p className="text-slate-400 mt-2">
                  This platform is new, be the first to create a profile!
                </p>
              </motion.div>
            ) : (
              filteredProfiles.map((profile, index) => (
                <ProfileCard key={profile.uid || index} profile={profile} delay={index * 0.05} />
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
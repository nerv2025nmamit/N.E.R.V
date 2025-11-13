'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { db, appId, ensureUserIsSignedIn } from '../../../firebase';
// --- NEW: Import setDoc and serverTimestamp ---
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Book, Briefcase, Hash, Loader2, Send, Edit } from 'lucide-react';

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
  pastCompanies: string[];
  age: number | '';
};

export default function ViewProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  // --- Load profile (unchanged) ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const currentUser = await ensureUserIsSignedIn(); 
        setCurrentUserId(currentUser.uid);

        const profilePath = `/artifacts/${appId}/public/data/profiles/${userId}`;
        const profileDocRef = doc(db, profilePath);
        const docSnap = await getDoc(profileDocRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          console.error("No such profile!");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  // --- UPDATED: Handle "Message" Button Click ---
  const handleMessageClick = async () => {
    if (!currentUserId || !userId || !profile) return;

    const chatId = [currentUserId, userId].sort().join('_');

    try {
      // --- NEW: Create the chat "room" document ---
      // This makes it show up in the inbox
      const chatDocRef = doc(db, `/artifacts/${appId}/public/data/chats/${chatId}`);
      
      // Get current user's info (name from login, pic from their profile)
      // NOTE: This assumes current user has saved their profile.
      const loginData = localStorage.getItem('user');
      const currentUserInfo = loginData ? JSON.parse(loginData) : { name: 'Current User' };
      // A more robust way would be to fetch the current user's profile, but this is faster.

      await setDoc(chatDocRef, {
        participants: [currentUserId, userId],
        // This stores the info for the Inbox page
        participantNames: {
          [currentUserId]: currentUserInfo.name,
          [userId]: profile.name || profile.username
        },
        participantPictures: {
          [currentUserId]: 'https://placehold.co/80x80/1e293b/eab308?text=ME', // TODO: Fetch current user's real pic
          [userId]: profile.profilePicUrl || 'https://placehold.co/80x80/1e293b/eab308?text=PIC'
        },
        // Set a timestamp so it appears in the inbox
        lastTimestamp: serverTimestamp(),
      }, { merge: true }); // 'merge: true' won't overwrite if it already exists

      // Redirect to the chat page
      router.push(`/portal/messages/${chatId}`);

    } catch (error) {
      console.error("Error creating chat room:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-500">Profile Not Found</h1>
        <p className="text-slate-400 mt-2">This user's profile could not be loaded.</p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.uid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      {/* Profile Header Card (unchanged) */}
      <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-8 mb-8">
        <img
          src={profile.profilePicUrl || 'https://placehold.co/128x128/1e293b/eab308?text=PIC'}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-slate-700"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/128x128/1e293b/eab308?text=PIC' }}
        />
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white font-serif">
            {profile.name}
          </h1>
          <p className="text-xl font-medium text-amber-400 mt-1">
            @{profile.username}
          </p>
          <span className="inline-block mt-4 px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-full capitalize">
            {profile.role || 'Seeker'}
          </span>
        </div>
        
        {/* Message / Edit Button (unchanged) */}
        {isOwnProfile ? (
          <Link
            href="/portal/profile"
            className="px-6 py-3 bg-slate-700 text-slate-100 font-bold rounded-lg shadow-lg transition-colors duration-300 hover:bg-slate-600 flex items-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Edit Your Profile
          </Link>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMessageClick}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-amber-500/40 group flex items-center justify-center"
          >
            <Send className="w-5 h-5 mr-2" />
            Message {profile.name.split(' ')[0]}
          </motion.button>
        )}
      </div>

      {/* Profile Details (unchanged) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Bio</h3>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{profile.bio || 'No bio provided.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">College</h3>
            <div className="flex items-center gap-2 text-slate-300">
              <Book className="w-5 h-5" />
              <span>{profile.college || 'Not provided'}</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Age</h3>
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-5 h-5" />
              <span>{profile.age || 'Not provided'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.hashtags ? (
              profile.hashtags.split(' ').map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-full">
                  {tag.startsWith('#') ? '' : '#'}
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No skills listed.</p>
            )}
          </div>
        </div>

        {profile.pastCompanies && profile.pastCompanies.length > 0 && (
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Past Companies</h3>
            <div className="flex flex-wrap gap-3">
              {profile.pastCompanies.map((company, index) => (
                <span key={index} className="flex items-center gap-2 pl-3 pr-4 py-1.5 bg-slate-800 text-slate-300 rounded-full text-sm font-medium">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  {company}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { db, appId, ensureUserIsSignedIn } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Book, Briefcase, Loader2, Send, Edit } from 'lucide-react';
import { ParticlesWrapper } from '../../../../components/ParticlesWrapper';
import { PageCard } from '../../../../components/PageCard';

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
          console.error('No such profile!');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadProfile();
  }, [userId]);

  const handleMessageClick = async () => {
    if (!currentUserId || !userId || !profile) return;

    const chatId = [currentUserId, userId].sort().join('_');

    try {
      const chatDocRef = doc(db, `/artifacts/${appId}/public/data/chats/${chatId}`);

      const loginData = localStorage.getItem('user');
      const currentUserInfo = loginData ? JSON.parse(loginData) : { name: 'Current User' };

      await setDoc(
        chatDocRef,
        {
          participants: [currentUserId, userId],
          participantNames: {
            [currentUserId]: currentUserInfo.name,
            [userId]: profile.name || profile.username
          },
          participantPictures: {
            [currentUserId]: 'https://placehold.co/80x80/1e293b/eab308?text=ME',
            [userId]: profile.profilePicUrl || 'https://placehold.co/80x80/1e293b/eab308?text=PIC'
          },
          lastTimestamp: serverTimestamp()
        },
        { merge: true }
      );

      router.push(`/portal/messages/${chatId}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-44">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-500">Profile Not Found</h1>
        <p className="text-slate-400 mt-2">This user's profile could not be loaded.</p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.uid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-3xl mx-auto px-4 sm:px-6 relative"
    >
      <div className="absolute inset-0 -z-20 pointer-events-none">
        <ParticlesWrapper hideOnMobile />
      </div>

      <div className="pt-safe pb-safe space-y-6">
        {/* Header Card */}
        <PageCard className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex-shrink-0">
              <img
                src={profile.profilePicUrl || 'https://placehold.co/128x128/1e293b/eab308?text=PIC'}
                alt="Profile"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-700"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://placehold.co/128x128/1e293b/eab308?text=PIC';
                }}
              />
            </div>

            <div className="flex-1 w-full text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">{profile.name}</h1>
              <p className="text-sm sm:text-base text-amber-400 mt-1">@{profile.username}</p>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-3 justify-center md:justify-start">
                <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">
                  {profile.role || 'Seeker'}
                </span>
                <div className="mt-2 sm:mt-0">
                  {isOwnProfile ? (
                    <Link
                      href="/portal/profile"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-100 rounded-lg text-sm font-semibold hover:bg-slate-600"
                    >
                      <Edit className="w-4 h-4" /> Edit Profile
                    </Link>
                  ) : (
                    <button
                      onClick={handleMessageClick}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-semibold rounded-lg shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      Message {profile.name.split(' ')[0]}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageCard>

        {/* Details Card */}
        <PageCard>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Bio</h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {profile.bio || 'No bio provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">College</h3>
                <div className="flex items-center gap-2 text-slate-300">
                  <Book className="w-4 h-4" />
                  <span className="text-sm">{profile.college || 'Not provided'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Age</h3>
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{profile.age || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.hashtags ? (
                  profile.hashtags.split(' ').map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-400 text-sm rounded-full">
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
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Past Companies</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.pastCompanies.map((company, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-2 pl-3 pr-4 py-1.5 bg-slate-800 text-slate-300 rounded-full text-sm font-medium"
                    >
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageCard>
      </div>

      <style jsx>{`
        .pt-safe { padding-top: env(safe-area-inset-top, 12px); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 12px); }
      `}</style>
    </motion.div>
  );
}

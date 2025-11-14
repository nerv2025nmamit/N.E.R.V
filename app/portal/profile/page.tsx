'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save, Image as ImageIcon, Briefcase, Plus, X, Hash, Book, Calendar, Loader2, AtSign } from 'lucide-react';
import { db, appId, ensureUserIsSignedIn } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// --- Types (unchanged) ---
type UserProfile = {
  profilePicUrl: string;
  bio: string;
  hashtags: string;
  role: 'student' | 'employee' | 'entrepreneur' | '';
  pastCompanies: string[];
  age: number | '';
  college: string;
  name: string;
  gmail: string;
  uid: string;
  username: string;
};

// --- Floating bubbles (subtle, safe) ---
const FloatingBubbles = () => {
  const bubbles = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {bubbles.map((i) => {
        const size = 8 + (i % 6) * 3;
        const left = (i * 7) % 100;
        const delay = i * 0.6;
        const duration = 10 + (i % 5) * 4;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full blur-sm"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${20 + (i % 5) * 10}%`,
              background:
                'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(16,185,129,0.18) 50%, rgba(168,85,247,0.18) 100%)',
            }}
            initial={{ y: 0, opacity: 0.15 }}
            animate={{ y: -140, opacity: [0.15, 0.4, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
    </div>
  );
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    profilePicUrl: '',
    bio: '',
    hashtags: '',
    role: '',
    pastCompanies: [],
    age: '',
    college: '',
    name: '',
    gmail: '',
    uid: '',
    username: '',
  });

  const [newCompany, setNewCompany] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // --- Data Loading (unchanged logic, fixed path formatting preserved) ---
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = await ensureUserIsSignedIn();
        if (!user) throw new Error('User not authenticated');
        setUserId(user.uid);

        const loginData = localStorage.getItem('user');
        const { name, gmail } = loginData ? JSON.parse(loginData) : { name: 'Seeker', gmail: '' };

        const profilePath = `artifacts/${appId}/public/data/profiles/${user.uid}`;
        const profileDocRef = doc(db, profilePath);
        const docSnap = await getDoc(profileDocRef);

        if (docSnap.exists()) {
          const dbProfile = docSnap.data() as UserProfile;
          setProfile({
            ...dbProfile,
            name,
            gmail,
            uid: user.uid,
          });
        } else {
          const suggestedUsername = name.replace(/\s+/g, '_').toLowerCase();
          setProfile((prev) => ({
            ...prev,
            name,
            gmail,
            uid: user.uid,
            username: suggestedUsername,
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setMessage('Error loading your profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // --- Handle input changes (unchanged) ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // --- Add/Remove company (unchanged) ---
  const handleAddCompany = () => {
    if (newCompany.trim()) {
      setProfile((prev) => ({
        ...prev,
        pastCompanies: [...prev.pastCompanies, newCompany.trim()],
      }));
      setNewCompany('');
    }
  };

  const handleRemoveCompany = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      pastCompanies: prev.pastCompanies.filter((_, i) => i !== index),
    }));
  };

  // --- Save profile (unchanged, path fix preserved) ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage('Error: User not signed in.');
      return;
    }

    try {
      setMessage('Saving...');
      const profilePath = `artifacts/${appId}/public/data/profiles/${userId}`;
      const profileDocRef = doc(db, profilePath);

      const formattedProfile = {
        ...profile,
        username: profile.username.replace(/@/g, '').replace(/\s+/g, '_'),
      };

      await setDoc(profileDocRef, formattedProfile);
      setProfile(formattedProfile);

      setMessage('Your profile has been saved!');
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Failed to save profile.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // --- Render Logic (unchanged structure) ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto relative"
    >
      <FloatingBubbles />

      <h1 className="text-5xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-emerald-400 to-purple-400 mb-8">
        Craft Your Profile
      </h1>
      <p className="text-lg text-slate-400 mb-10">
        Let others know who you are. This information will be visible to seekers and guides on the Stroll page.
      </p>

      <form onSubmit={handleSaveProfile} className="space-y-10">
        {/* Profile Card */}
        <div className="p-8 bg-slate-900/50 border border-indigo-700 rounded-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <motion.img
              key={profile.profilePicUrl}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={profile.profilePicUrl || 'https://placehold.co/128x128/1e293b/6366f1?text=PIC'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://placehold.co/128x128/1e293b/6366f1?text=PIC';
              }}
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center border-4 border-slate-900">
              <User className="w-5 h-5 text-slate-900" />
            </div>
          </div>
          <div className="flex-1 w-full">
            <label htmlFor="profilePicUrl" className="block text-sm font-medium text-indigo-300 mb-2">
              Profile Picture URL
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                id="profilePicUrl"
                name="profilePicUrl"
                placeholder="https://your-image-url.com/pic.png"
                value={profile.profilePicUrl}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              For now, please upload an image online and paste the URL here.
            </p>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-indigo-300 mb-2">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                id="username"
                name="username"
                placeholder="your_unique_handle"
                value={profile.username}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">This is your unique @handle. No spaces or @ symbols.</p>
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-indigo-300 mb-2">
              Age
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="number"
                id="age"
                name="age"
                placeholder="Enter your age"
                value={profile.age}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label htmlFor="bio" className="block text-sm font-medium text-indigo-300 mb-2">
              Your Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              placeholder="Tell your story, your skills, your mission..."
              value={profile.bio}
              onChange={handleChange}
              className="w-full p-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
            />
          </div>

          {/* Hashtags */}
          <div className="md:col-span-2">
            <label htmlFor="hashtags" className="block text-sm font-medium text-indigo-300 mb-2">
              Skill Hashtags
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                id="hashtags"
                name="hashtags"
                placeholder="#react #python #finance #marketing"
                value={profile.hashtags}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Separate tags with a space. These help others find you.</p>
          </div>

          {/* Role */}
          <div className="md:col-span-1">
            <label htmlFor="role" className="block text-sm font-medium text-indigo-300 mb-2">
              Current Role
            </label>
            <select
              id="role"
              name="role"
              value={profile.role}
              onChange={handleChange}
              className="w-full p-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
            >
              <option value="" disabled>
                Select your role...
              </option>
              <option value="student">Student</option>
              <option value="employee">Employee</option>
              <option value="entrepreneur">Entrepreneur</option>
            </select>
          </div>

          {/* College */}
          <div className="md:col-span-1">
            <label htmlFor="college" className="block text-sm font-medium text-indigo-300 mb-2">
              College / University
            </label>
            <div className="relative">
              <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                id="college"
                name="college"
                placeholder="e.g., 'IIT Bombay', 'BITS Pilani'"
                value={profile.college}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
          </div>
        </div>

        {/* Past Companies */}
        <div>
          <label className="block text-sm font-medium text-indigo-300 mb-2">Past Companies</label>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Add a company name..."
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-indigo-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleAddCompany}
              className="px-5 py-3 bg-slate-700 text-slate-100 rounded-lg font-medium transition-colors hover:bg-indigo-500 hover:text-white"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <AnimatePresence>
              {profile.pastCompanies.map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 pl-4 pr-2 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-full text-sm font-medium"
                >
                  {company}
                  <button
                    type="button"
                    onClick={() => handleRemoveCompany(index)}
                    className="p-1 bg-indigo-500/20 rounded-full transition-colors hover:bg-red-500/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-6 pt-6 border-t border-slate-800">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-emerald-400 to-purple-500 text-slate-950 font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-emerald-400/40 group flex items-center justify-center"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Profile
          </motion.button>

          <AnimatePresence>
            {message && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-400">
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  );
}

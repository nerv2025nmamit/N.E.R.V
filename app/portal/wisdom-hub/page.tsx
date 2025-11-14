'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Heart,
  Search,
  Tag,
  Send,
  Feather,
  Loader2
} from 'lucide-react';
import { db, appId, ensureUserIsSignedIn } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';

// --- Data Types ---
type Comment = {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  text: string;
  timestamp: any;
};

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorProfilePic: string;
  timestamp: any;
  content: string;
  hashtags: string[];
  likedBy: string[];
  comments: Comment[];
};

type UserProfile = {
  name: string;
  username: string;
  profilePicUrl: string;
};

// Sanskrit slogan
const SLOGAN = 'ज्ञानं परमं बलम्'; // "Wisdom is the supreme power"

// --- Helper Function: Time Ago ---
const timeAgo = (timestamp: any): string => {
  if (!timestamp) return 'just now';
  const date = timestamp.toDate();
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return Math.floor(seconds) + 's ago';
};

// --- Custom Animation Classes ---
const spinSlow = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 12s linear infinite;
}
`;

export default function WisdomHubPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostHashtags, setNewPostHashtags] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  // --- 1. Get Current User and their Profile ---
  useEffect(() => {
    const setupUser = async () => {
      try {
        const user = await ensureUserIsSignedIn();
        setCurrentUser(user);

        const profileDocRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'profiles',
          user.uid
        );
        const docSnap = await getDoc(profileDocRef);

        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          const loginData = localStorage.getItem('user');
          const { name } = loginData ? JSON.parse(loginData) : { name: 'Anonymous' };
          setUserProfile({ name: name, username: 'unknown', profilePicUrl: '' });
        }
      } catch (e) {
        console.error('Auth failed:', e);
      }
    };
    setupUser();
  }, []);

  // --- 2. Fetch All Posts in Real-Time ---
  useEffect(() => {
    setLoadingPosts(true);
    const postsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'wisdomHubPosts'
    );
    const q = query(postsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsList: Post[] = [];
        snapshot.forEach((d) => {
          postsList.push({ id: d.id, ...(d.data() as any) } as Post);
        });
        setPosts(postsList);
        setLoadingPosts(false);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- 3. Fetch Comments for Active Post ---
  useEffect(() => {
    if (!activeCommentBox) {
      setComments([]);
      return;
    }

    setLoadingComments(true);
    const commentsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'wisdomHubPosts',
      activeCommentBox,
      'comments'
    );
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsList: Comment[] = [];
        snapshot.forEach((d) => commentsList.push({ id: d.id, ...(d.data() as any) } as Comment));
        setComments(commentsList);
        setLoadingComments(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setLoadingComments(false);
      }
    );

    return () => unsubscribe();
  }, [activeCommentBox]);

  // --- Handle Posting a New "Saga" ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUser || !userProfile) {
      alert('You must be logged in and have a profile to post.');
      return;
    }

    const hashtags = newPostHashtags
      .split(' ')
      .map((tag) => tag.replace(/#/g, '').trim())
      .filter(Boolean);

    const newPost = {
      authorId: currentUser.uid,
      authorName: userProfile.name,
      authorUsername: userProfile.username || 'unknown',
      authorProfilePic: userProfile.profilePicUrl || '',
      timestamp: serverTimestamp(),
      content: newPostContent.trim(),
      hashtags,
      likedBy: [],
      comments: []
    };

    try {
      const postsRef = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'wisdomHubPosts'
      );
      await addDoc(postsRef, newPost);
      setNewPostContent('');
      setNewPostHashtags('');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  // --- Handle Liking a Post ---
  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;

    const postRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'wisdomHubPosts',
      postId
    );
    const post = posts.find((p) => p.id === postId);

    if (post) {
      const alreadyLiked = (post.likedBy || []).includes(currentUser.uid);
      try {
        if (alreadyLiked) {
          await updateDoc(postRef, {
            likedBy: arrayRemove(currentUser.uid)
          });
        } else {
          await updateDoc(postRef, {
            likedBy: arrayUnion(currentUser.uid)
          });
        }
      } catch (error) {
        console.error('Error liking post:', error);
      }
    }
  };

  // --- Handle Submitting a Comment ---
  const handleCommentSubmit = async (postId: string) => {
    if (!newComment.trim() || !currentUser || !userProfile) return;

    const newCommentObj = {
      authorId: currentUser.uid,
      authorName: userProfile.name,
      authorUsername: userProfile.username || 'unknown',
      text: newComment.trim(),
      timestamp: serverTimestamp()
    };

    try {
      const commentsRef = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'wisdomHubPosts',
        postId,
        'comments'
      );
      await addDoc(commentsRef, newCommentObj);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

    // --- Filter and Sort Posts ---
  const filteredPosts = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (!lowerSearchTerm) {
      return posts;
    }

    return posts.filter((post) => {
      const contentMatch = post.content.toLowerCase().includes(lowerSearchTerm);
      const tagMatch = post.hashtags?.some((tag) => tag.toLowerCase().includes(lowerSearchTerm));
      const authorMatch =
        post.authorName.toLowerCase().includes(lowerSearchTerm) ||
        post.authorUsername.toLowerCase().includes(lowerSearchTerm);
      return contentMatch || tagMatch || authorMatch;
    });
  }, [posts, searchTerm]);

  const userCanPost = currentUser && userProfile;

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 sm:px-6 relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Krishna aura background */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-tr from-emerald-500/10 via-indigo-500/10 to-amber-400/10 blur-3xl animate-pulse"></div>

      {/* Header */}
      <div className="text-center mb-10 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400/10 via-indigo-400/10 to-amber-300/10 blur-2xl rounded-full animate-pulse"></div>
        <h1 className="text-5xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-teal-300 to-amber-300">
          Jnana Hub 🦚
        </h1>
        <p className="mt-2 text-slate-300 italic">
          {SLOGAN} — <span className="text-amber-200">ज्ञानं परम् बलम्</span>
        </p>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          The path they have walked before. Now, they come together for your guidance.
        </p>
      </div>

      {/* New Post Form */}
      <form
        onSubmit={handlePostSubmit}
        className="mb-10 p-6 bg-gradient-to-br from-indigo-900/40 via-teal-900/20 to-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md relative"
      >
        {/* subtle feather glare */}
        <div className="absolute inset-0 -z-10 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent blur-2xl"></div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <label className="flex items-center gap-3 mb-3">
              <Feather className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              <span className="text-sm text-slate-300 font-medium">Share Your Wisdom</span>
            </label>
            <textarea
              placeholder={
                userCanPost
                  ? `Share your wisdom, ${userProfile?.name}...`
                  : 'Create your profile to share wisdom...'
              }
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
              className="w-full p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-300/30"
              disabled={!userCanPost}
            />

            <div className="mt-3 flex gap-3 items-center">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-300/80" />
                <input
                  type="text"
                  placeholder="Tag your post (e.g., #strategy #google)"
                  value={newPostHashtags}
                  onChange={(e) => setNewPostHashtags(e.target.value)}
                  className="w-full pl-10 py-2 pr-3 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                  disabled={!userCanPost}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-400 to-amber-300 text-slate-900 font-semibold rounded-lg shadow-md disabled:opacity-50"
                disabled={!newPostContent.trim() || !userCanPost}
              >
                Post
              </motion.button>
            </div>
          </div>

          <div className="w-20 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-300 flex items-center justify-center text-slate-900 font-bold shadow-inner">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
            <p className="mt-2 text-xs text-slate-400">{userProfile?.username || 'unknown'}</p>
          </div>
        </div>
      </form>

      {/* Search + header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-white">Community Chronicles</h2>
        <div className="relative w-1/3 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-300" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search @users or #tags..."
            className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
          />
        </div>
      </div>

      {/* Post Feed */}
      <div className="space-y-6">
        <AnimatePresence>
          {loadingPosts ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-12 h-12 text-amber-300 animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl"
            >
              <h3 className="text-xl font-semibold text-white">The Hub is Empty</h3>
              <p className="text-slate-400 mt-2">
                {searchTerm
                  ? 'No wisdom matches your search.'
                  : 'Be the first to share your wisdom and guide others!'}
              </p>
            </motion.div>
          ) : (
            filteredPosts.map((post) => {
              const userHasLiked =
                currentUser && (post.likedBy || []).includes(currentUser.uid);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="relative bg-gradient-to-br from-indigo-900/30 via-teal-900/10 to-slate-900/30 border border-slate-800 rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Krishna feather glare */}
                  <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent blur-2xl -z-10"></div>

                  {/* Header */}
                  <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          post.authorProfilePic ||
                          'https://placehold.co/80x80/0f172a/ffd166?text=PIC'
                        }
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">{post.authorName}</h4>
                        <p className="text-xs text-slate-400">
                          @{post.authorUsername} • {timeAgo(post.timestamp)}
                        </p>
                      </div>
                    </div>
                                        <div className="ml-auto text-amber-200 font-mono text-xs px-3 py-1 rounded bg-amber-900/10">
                      #{post.hashtags?.[0] || 'wisdom'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.hashtags?.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSearchTerm(tag)}
                          className="px-3 py-1 bg-amber-300/10 text-amber-200 text-xs rounded-full hover:backdrop-brightness-110"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 1.15 }}
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-2 ${
                        userHasLiked
                          ? 'text-red-500'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                      disabled={!currentUser}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {(post.likedBy || []).length}
                      </span>
                    </motion.button>

                    <button
                      onClick={() =>
                        setActiveCommentBox(
                          activeCommentBox === post.id ? null : post.id
                        )
                      }
                      className="flex items-center gap-2 text-slate-300 hover:text-amber-300"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">Comment</span>
                    </button>

                    <div className="ml-auto text-xs text-slate-400">
                      {post.authorName !== userProfile?.name ? '' : 'Your post'}
                    </div>
                  </div>

                  {/* Comments */}
                  <AnimatePresence>
                    {activeCommentBox === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-900/20 p-4"
                      >
                        <div className="space-y-3">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleCommentSubmit(post.id);
                            }}
                            className="flex gap-2"
                          >
                            <input
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={
                                userCanPost
                                  ? 'Add your comment...'
                                  : 'Log in to comment'
                              }
                              className="flex-1 p-2 bg-slate-900/50 border border-slate-800 rounded-md text-slate-200"
                              disabled={!userCanPost}
                            />
                            <motion.button
                              whileTap={{ scale: 1.05 }}
                              className="px-3 py-2 bg-amber-300 text-slate-900 rounded-md"
                              disabled={!newComment.trim() || !userCanPost}
                            >
                              <Send className="w-4 h-4" />
                            </motion.button>
                          </form>

                          {loadingComments ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                            </div>
                          ) : comments.length === 0 ? (
                            <p className="text-sm text-slate-400">
                              No comments yet.
                            </p>
                          ) : (
                            comments.map((c) => (
                              <div
                                key={c.id}
                                className="flex gap-3 items-start"
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-200">
                                  {c.authorName.charAt(0)}
                                </div>
                                <div className="bg-slate-800/40 p-3 rounded-md w-full">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-semibold text-white">
                                        {c.authorName}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        @{c.authorUsername} •{' '}
                                        {timeAgo(c.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-sm text-slate-300 mt-2">
                                    {c.text}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

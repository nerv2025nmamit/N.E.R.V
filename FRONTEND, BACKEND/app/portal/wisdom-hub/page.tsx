'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Heart,
  Search,
  Tag,
  Send,
  Feather,
  Loader2,
  Trash2,
  Edit3
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
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { ParticlesWrapper } from '../../../components/ParticlesWrapper';
import { PageCard } from '../../../components/PageCard';

// --- Types ---
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
};

type UserProfile = {
  name: string;
  username: string;
  profilePicUrl: string;
};

const SLOGAN = 'ज्ञानं परमं बलम्';

// --- Helpers ---
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
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // --- Load current user profile ---
  useEffect(() => {
    const setupUser = async () => {
      const user = await ensureUserIsSignedIn();
      setCurrentUser(user);

      const profileDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', user.uid);
      const docSnap = await getDoc(profileDocRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        const loginData = localStorage.getItem('user');
        const { name } = loginData ? JSON.parse(loginData) : { name: 'Anonymous' };
        setUserProfile({ name, username: 'unknown', profilePicUrl: '' });
      }
    };
    setupUser();
  }, []);

  // --- Real-time posts ---
  useEffect(() => {
    setLoadingPosts(true);
    const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'wisdomHubPosts');
    const q = query(postsRef, orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Post[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) } as Post));
        setPosts(list);
        setLoadingPosts(false);
      },
      () => setLoadingPosts(false)
    );
    return () => unsub();
  }, []);

  // --- Real-time comments for active post ---
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
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Comment[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) } as Comment));
        setComments(list);
        setLoadingComments(false);
      },
      () => setLoadingComments(false)
    );
    return () => unsub();
  }, [activeCommentBox]);

  // --- Post actions ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUser || !userProfile) return;

    const hashtags = newPostHashtags
      .split(' ')
      .map((t) => t.replace(/#/g, '').trim())
      .filter(Boolean);

    const newPost = {
      authorId: currentUser.uid,
      authorName: userProfile.name,
      authorUsername: userProfile.username,
      authorProfilePic: userProfile.profilePicUrl,
      timestamp: serverTimestamp(),
      content: newPostContent.trim(),
      hashtags,
      likedBy: []
    };

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wisdomHubPosts'), newPost);
    setNewPostContent('');
    setNewPostHashtags('');
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'wisdomHubPosts', postId);
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const alreadyLiked = post.likedBy.includes(currentUser.uid);
    await updateDoc(postRef, {
      likedBy: alreadyLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    const post = posts.find((p) => p.id === postId);
    if (!post || post.authorId !== currentUser.uid) return;
    if (!confirm('Delete this post?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wisdomHubPosts', postId));
  };

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const handleEditPost = async (postId: string) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wisdomHubPosts', postId), {
      content: editContent
    });
    cancelEditPost();
  };

  // --- Comment actions ---
  const handleCommentSubmit = async (postId: string) => {
    const text = (newComments[postId] || '').trim();
    if (!text || !currentUser || !userProfile) return;

    const newComment = {
      authorId: currentUser.uid,
      authorName: userProfile.name,
      authorUsername: userProfile.username,
      text,
      timestamp: serverTimestamp()
    };

    await addDoc(
      collection(db, 'artifacts', appId, 'public', 'data', 'wisdomHubPosts', postId, 'comments'),
      newComment
    );
    setNewComments((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleDeleteComment = async (postId: string, commentId: string, commentAuthorId: string) => {
    if (!currentUser || currentUser.uid !== commentAuthorId) return;
    await deleteDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'wisdomHubPosts', postId, 'comments', commentId)
    );
  };

  const setCommentForPost = (postId: string, value: string) => {
    setNewComments((prev) => ({ ...prev, [postId]: value }));
  };

  // --- Filter posts ---
  const filteredPosts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return posts;
    return posts.filter((post) => {
      const contentMatch = post.content.toLowerCase().includes(term);
      const tagMatch = post.hashtags?.some((t) => t.toLowerCase().includes(term));
      const authorMatch =
        post.authorName.toLowerCase().includes(term) ||
        post.authorUsername.toLowerCase().includes(term);
      return contentMatch || tagMatch || authorMatch;
    });
  }, [posts, searchTerm]);

  const userCanPost = Boolean(currentUser && userProfile);

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Particles (md+) */}
      <div className="pointer-events-none -z-20 absolute inset-0">
        <ParticlesWrapper hideOnMobile />
      </div>

      <div className="pt-safe pb-safe">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400/6 via-indigo-400/6 to-amber-300/6 blur-2xl rounded-full animate-pulse"></div>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-teal-300 to-amber-300">
            Jnana Hub 🦚
          </h1>
          <p className="mt-2 text-slate-300 italic text-sm sm:text-base">
            {SLOGAN} — <span className="text-amber-200">ज्ञानं परम् बलम्</span>
          </p>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto text-sm">
            The path they have walked before. Now, they come together for your guidance.
          </p>
        </div>

        {/* New Post */}
        <PageCard className="mb-8">
          <form onSubmit={handlePostSubmit} className="relative">
            <div className="absolute inset-0 -z-10 bg-gradient-radial from-emerald-400/8 via-transparent to-transparent blur-2xl rounded-2xl"></div>

            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="flex-1 w-full">
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

                <div className="mt-3 flex flex-col sm:flex-row gap-3 items-center">
                  <div className="relative flex-1 w-full">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-300/80" />
                    <input
                      type="text"
                      placeholder="Tag your post (e.g., #COMPANY #COLLEGE #FIELD)"
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
                    className="px-5 py-2 w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-amber-300 text-slate-900 font-semibold rounded-lg shadow-md disabled:opacity-50"
                    disabled={!newPostContent.trim() || !userCanPost}
                  >
                    Post
                  </motion.button>
                </div>
              </div>

              <div className="w-full md:w-24 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-300 flex items-center justify-center text-slate-900 font-bold shadow-inner">
                  {userProfile?.name?.charAt(0) || 'U'}
                </div>
                <p className="mt-2 text-xs text-slate-400">{userProfile?.username || 'unknown'}</p>
              </div>
            </div>
          </form>
        </PageCard>

        {/* Search */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Community Chronicles</h2>
          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-300" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search @users or #tags..."
                className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
              />
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          <AnimatePresence>
            {loadingPosts ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-10 h-10 text-amber-300 animate-spin" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-white">The Hub is Empty</h3>
                <p className="text-slate-400 mt-2">
                  {searchTerm ? 'No wisdom matches your search.' : 'Be the first to share your wisdom and guide others!'}
                </p>
              </motion.div>
            ) : (
              filteredPosts.map((post) => {
                const userHasLiked = currentUser && (post.likedBy || []).includes(currentUser.uid);
                const isAuthor = currentUser && post.authorId === currentUser.uid;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="relative bg-gradient-to-br from-indigo-900/30 via-teal-900/10 to-slate-900/30 border border-slate-800 rounded-2xl shadow-lg overflow-hidden hover-glow transition"
                  >
                    <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent blur-2xl -z-10"></div>

                    {/* Header — clickable author with golden hover glow */}
                    <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/portal/stroll/${post.authorId}`}
                          className="author-link inline-flex items-center gap-3"
                          aria-label={`Open ${post.authorName} profile`}
                        >
                          <img
                            src={post.authorProfilePic || 'https://placehold.co/80x80/0f172a/ffd166?text=PIC'}
                            alt={post.authorName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white">{post.authorName}</h4>
                            <p className="text-xs text-slate-400">
                              @{post.authorUsername} • {timeAgo(post.timestamp)}
                            </p>
                          </div>
                        </Link>
                      </div>
                      <div className="ml-auto text-amber-200 font-mono text-xs px-3 py-1 rounded bg-amber-900/10">
                        #{post.hashtags?.[0] || 'wisdom'}
                      </div>
                    </div>

                    {/* Content or Edit form */}
                    {editingPostId === post.id ? (
                      <div className="p-5">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditPost(post.id);
                          }}
                        >
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-slate-900/60 border border-slate-800 rounded-md text-slate-200"
                          />
                          <div className="mt-3 flex gap-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-amber-400 text-slate-900 rounded-md font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditPost}
                              className="px-4 py-2 bg-slate-700 text-slate-200 rounded-md"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="p-5">
                        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
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
                    )}

                    {/* Footer actions */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center gap-4">
                      <motion.button
                        whileTap={{ scale: 1.15 }}
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-2 like-btn ${userHasLiked ? 'text-red-500' : 'text-slate-300 hover:text-amber-300'}`}
                        disabled={!currentUser}
                      >
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-medium">{(post.likedBy || []).length}</span>
                      </motion.button>

                      <button
                        onClick={() => setActiveCommentBox(activeCommentBox === post.id ? null : post.id)}
                        className="flex items-center gap-2 text-slate-300 hover:text-amber-300"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm font-medium">Comment</span>
                      </button>

                      {isAuthor && (
                        <>
                          <button
                            onClick={() => startEditPost(post)}
                            className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-500"
                            title="Edit post"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-500"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}

                      <div className="ml-auto text-xs text-slate-400">
                        {isAuthor ? 'Your post' : ''}
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
                            {/* Add comment */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleCommentSubmit(post.id);
                              }}
                              className="flex gap-2"
                            >
                              <input
                                value={newComments[post.id] || ''}
                                onChange={(e) => setCommentForPost(post.id, e.target.value)}
                                placeholder={userCanPost ? 'Add your comment...' : 'Log in to comment'}
                                className="flex-1 p-2 bg-slate-900/50 border border-slate-800 rounded-md text-slate-200"
                                disabled={!userCanPost}
                              />
                              <motion.button
                                whileTap={{ scale: 1.05 }}
                                className="px-3 py-2 bg-amber-300 text-slate-900 rounded-md"
                                disabled={!((newComments[post.id] || '').trim()) || !userCanPost}
                              >
                                <Send className="w-4 h-4" />
                              </motion.button>
                            </form>

                            {/* Comment list */}
                            {loadingComments ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                              </div>
                            ) : comments.length === 0 ? (
                              <p className="text-sm text-slate-400">No comments yet.</p>
                            ) : (
                              comments.map((c) => (
                                <div key={c.id} className="flex gap-3 items-start">
                                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-200">
                                    {c.authorName?.charAt(0) || 'U'}
                                  </div>
                                  <div className="bg-slate-800/40 p-3 rounded-md w-full">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-semibold text-white">{c.authorName}</div>
                                        <div className="text-xs text-slate-400">
                                          @{c.authorUsername} • {timeAgo(c.timestamp)}
                                        </div>
                                      </div>
                                      {currentUser?.uid === c.authorId && (
                                        <button
                                          onClick={() => handleDeleteComment(post.id, c.id, c.authorId)}
                                          className="text-xs text-red-400 hover:text-red-500"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-300 mt-2">{c.text}</p>
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
      </div>

      {/* Styles */}
      <style jsx>{`
        .pt-safe { padding-top: env(safe-area-inset-top, 12px); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 12px); }

        .hover-glow {
          transition: box-shadow 180ms ease, transform 180ms ease;
        }
        .hover-glow:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(234,179,8,0.12), 0 2px 8px rgba(99,102,241,0.06);
        }

        /* Author link: stronger golden hover glow */
        .author-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 6px 10px;
          border-radius: 9999px;
          text-decoration: none;
          transition: transform 160ms ease, box-shadow 180ms ease, outline-color 160ms ease;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .author-link img {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          transition: transform 160ms ease, box-shadow 180ms ease, filter 180ms ease;
          will-change: transform, box-shadow;
        }

        .author-link:hover,
        .author-link:focus-visible {
          transform: translateY(-2px);
          outline: none;
        }

        .author-link:hover img,
        .author-link:focus-visible img {
          transform: translateY(-2px) scale(1.03);
          box-shadow:
            0 18px 40px rgba(250,204,21,0.18),
            0 6px 18px rgba(250,204,21,0.12),
            0 2px 8px rgba(99,102,241,0.04);
          filter: drop-shadow(0 6px 18px rgba(250,204,21,0.12));
        }

        .author-link:hover h4,
        .author-link:focus-visible h4 {
          text-shadow: 0 2px 10px rgba(250,204,21,0.12);
        }

        .like-btn {
          transition: box-shadow 160ms ease, transform 160ms ease;
          border-radius: 9999px;
          padding: 6px;
        }
        .like-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(239,68,68,0.12);
        }
      `}</style>
    </motion.div>
  );
}
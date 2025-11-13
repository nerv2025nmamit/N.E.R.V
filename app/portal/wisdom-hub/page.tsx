'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Heart,
  Search,
  Tag,
  Send,
  User,
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
  likedBy: string[]; // List of UIDs who liked
  comments: Comment[]; // We'll load this on demand
};

type UserProfile = {
  name: string;
  username: string;
  profilePicUrl: string;
};

// --- Helper Function: Time Ago ---
const timeAgo = (timestamp: any): string => {
  if (!timestamp) return 'just now';
  const date = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
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

// --- Main Page Component ---
export default function WisdomHubPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostHashtags, setNewPostHashtags] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Comment state
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

        // Fetch their profile to "stamp" new posts/comments
        const profilePath = `/artifacts/${appId}/public/data/profiles/${user.uid}`;
        const profileDocRef = doc(db, profilePath);
        const docSnap = await getDoc(profileDocRef);

        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          console.log("User has no profile, using login data");
          const loginData = localStorage.getItem('user');
          const { name } = loginData ? JSON.parse(loginData) : { name: 'Anonymous' };
          setUserProfile({ name: name, username: 'unknown', profilePicUrl: '' });
        }
      } catch (e) {
        console.error("Auth failed:", e);
      }
    };
    setupUser();
  }, []);

  // --- 2. Fetch All Posts in Real-Time ---
  useEffect(() => {
    setLoadingPosts(true);
    const postsPath = `/artifacts/${appId}/public/data/wisdomHubPosts`;
    const q = query(collection(db, postsPath), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsList: Post[] = [];
      snapshot.forEach(doc => {
        postsList.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsList);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoadingPosts(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // --- 3. Fetch Comments for Active Post ---
  useEffect(() => {
    if (!activeCommentBox) {
      setComments([]);
      return; // No post selected, do nothing
    }

    setLoadingComments(true);
    const commentsPath = `/artifacts/${appId}/public/data/wisdomHubPosts/${activeCommentBox}/comments`;
    const q = query(collection(db, commentsPath), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsList: Comment[] = [];
      snapshot.forEach(doc => {
        commentsList.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsList);
      setLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [activeCommentBox]); // Rerun whenever active post changes

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
      likedBy: [], // Start with 0 likes
      comments: [], // Comments will be a subcollection
    };

    try {
      const postsPath = `/artifacts/${appId}/public/data/wisdomHubPosts`;
      await addDoc(collection(db, postsPath), newPost);
      setNewPostContent('');
      setNewPostHashtags('');
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  // --- Handle Liking a Post ---
  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;

    const postRef = doc(db, `/artifacts/${appId}/public/data/wisdomHubPosts/${postId}`);
    const post = posts.find(p => p.id === postId);
    
    if (post) {
      const alreadyLiked = post.likedBy.includes(currentUser.uid);
      try {
        if (alreadyLiked) {
          // Unlike
          await updateDoc(postRef, {
            likedBy: arrayRemove(currentUser.uid)
          });
        } else {
          // Like
          await updateDoc(postRef, {
            likedBy: arrayUnion(currentUser.uid)
          });
        }
      } catch (error) {
        console.error("Error liking post:", error);
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
      timestamp: serverTimestamp(),
    };

    try {
      const commentsPath = `/artifacts/${appId}/public/data/wisdomHubPosts/${postId}/comments`;
      await addDoc(collection(db, commentsPath), newCommentObj);
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // --- Filter and Sort Posts (Memoized for performance) ---
  const filteredPosts = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    if (!lowerSearchTerm) {
      return posts; // Already sorted by date
    }
    
    return posts.filter((post) => {
      const contentMatch = post.content.toLowerCase().includes(lowerSearchTerm);
      const tagMatch = post.hashtags?.some((tag) =>
        tag.toLowerCase().includes(lowerSearchTerm)
      );
      const authorMatch = post.authorName.toLowerCase().includes(lowerSearchTerm) || post.authorUsername.toLowerCase().includes(lowerSearchTerm);
      return contentMatch || tagMatch || authorMatch;
    });
  }, [posts, searchTerm]);
  
  const userCanPost = currentUser && userProfile;

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* --- Header --- */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
          Wisdom Hub
        </h1>
        <p className="text-lg text-slate-400 mt-2 max-w-lg mx-auto">
          The path they have walked before. Now, they come together for your guidance.
        </p>
      </div>

      {/* --- New Post Form --- */}
      <form
        onSubmit={handlePostSubmit}
        className="mb-12 p-6 bg-slate-900/50 border border-amber-500/10 rounded-2xl shadow-xl shadow-black/20"
      >
        <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-3">
          <Feather className="text-amber-400" />
          Share Your Wisdom
        </h2>
        
        <textarea
          placeholder={
            userCanPost
              ? `Share your wisdom, ${userProfile.name}...`
              : 'Create your profile to share wisdom...'
          }
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          rows={4}
          className="w-full p-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
          disabled={!userCanPost}
        />
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
            <input
              type="text"
              placeholder="Tag your post (e.g., #strategy #google)"
              value={newPostHashtags}
              onChange={(e) => setNewPostHashtags(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
              disabled={!userCanPost}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-amber-500/40 group flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newPostContent.trim() || !userCanPost}
          >
            Post Wisdom
            <Send className="w-5 h-5 ml-2" />
          </motion.button>
        </div>
      </form>

      {/* --- Search Bar & Feed Header --- */}
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-4">
          Community Chronicles
        </h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/60" />
          <input
            type="text"
            placeholder="Search chronicles, @users, or #tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {/* --- Post Feed --- */}
      <div className="space-y-6">
        <AnimatePresence>
          {loadingPosts ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
             </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-10 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl"
            >
              <h3 className="text-xl font-semibold text-white">The Hub is Empty</h3>
              <p className="text-slate-400 mt-2">
                {searchTerm
                  ? 'No wisdom matches your search. Broaden your query.'
                  : 'Be the first to share your wisdom and guide others!'}
              </p>
            </motion.div>
          ) : (
            filteredPosts.map((post) => {
              const userHasLiked = currentUser && post.likedBy.includes(currentUser.uid);
              return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorProfilePic || 'https://placehold.co/80x80/1e293b/eab308?text=PIC'}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/80x80/1e293b/eab308?text=PIC' }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {post.authorName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        @{post.authorUsername} • {timeAgo(post.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-5">
                  <p className="text-slate-200 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  
                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.hashtags?.map((tag) => ( 
                      <button
                        key={tag}
                        onClick={() => setSearchTerm(tag)}
                        className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full transition-colors hover:bg-amber-500/20"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post Footer: Likes & Comments */}
                <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex items-center gap-6">
                  <motion.button
                    whileTap={{ scale: 1.2 }}
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      userHasLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                    }`}
                    disabled={!currentUser}
                  >
                    <Heart className={`w-5 h-5 ${userHasLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likedBy.length}</span>
                  </motion.button>
                  <button
                    onClick={() =>
                      setActiveCommentBox(
                        activeCommentBox === post.id ? null : post.id
                      )
                    }
                    className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Comment
                    </span>
                  </button>
                </div>

                {/* Comment Section (Togglable) */}
                <AnimatePresence>
                  {activeCommentBox === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-900/30 overflow-hidden"
                    >
                      <div className="p-5 space-y-4">
                        {/* New Comment Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleCommentSubmit(post.id);
                          }}
                          className="flex gap-3"
                        >
                          <input
                            type="text"
                            placeholder={userCanPost ? "Add your comment..." : "Log in to comment"}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 p-2 bg-slate-800/50 border-2 border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm outline-none focus:border-amber-500"
                            disabled={!userCanPost}
                          />
                          <motion.button
                            whileTap={{ scale: 1.1 }}
                            type="submit"
                            className="p-2 bg-amber-500 text-slate-900 rounded-lg"
                            disabled={!newComment.trim() || !userCanPost}
                          >
                            <Send className="w-4 h-4" />
                          </motion.button>
                        </form>
                        
                        {/* Loading Comments */}
                        {loadingComments && (
                           <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                           </div>
                        )}

                        {/* Existing Comments */}
                        {!loadingComments && comments.length === 0 && (
                          <p className="text-sm text-slate-500 text-center">
                            No comments on this post yet.
                          </p>
                        )}
                        
                        {!loadingComments && comments.length > 0 && (
                          comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-200 text-xs font-bold flex-shrink-0">
                                  {comment.authorName.charAt(0)}
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg w-full">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-white">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      • @{comment.authorUsername} • {timeAgo(comment.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-300">
                                    {comment.text}
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
              )
            }))}
        </AnimatePresence> {/* <-- THIS IS THE FIXED TAG */}
      </div>
    </motion.div>
  );
}
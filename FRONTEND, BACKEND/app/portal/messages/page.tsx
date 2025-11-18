'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Loader2, MessageSquare } from 'lucide-react';
import { db, appId, ensureUserIsSignedIn } from '../../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';

interface ChatRoom {
  id: string;
  otherUserName: string;
  otherUserPic: string;
  lastMessage: string;
  lastTimestamp: Date;
}

const timeAgo = (date: Date): string => {
  if (!date) return 'just now';
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];
  for (const { label, seconds: s } of intervals) {
    const interval = Math.floor(seconds / s);
    if (interval >= 1) return `${interval}${label} ago`;
  }
  return `${seconds}s ago`;
};

export default function MessagesPage() {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const setupInbox = async () => {
      try {
        const user = await ensureUserIsSignedIn();
        setCurrentUserId(user.uid);

        const chatsCollectionPath = `/artifacts/${appId}/public/data/chats`;
        const q = query(
          collection(db, chatsCollectionPath),
          where('participants', 'array-contains', user.uid),
          orderBy('lastTimestamp', 'desc')
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const chatList: ChatRoom[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data() as DocumentData;

              // ✅ Validate participants array
              if (!data.participants || !Array.isArray(data.participants)) {
                console.warn(`Chat ${doc.id} missing participants array`);
                return;
              }

              if (!data.participants.includes(user.uid)) {
                console.warn(`Chat ${doc.id} does not include current user`);
                return;
              }

              const otherUserId = data.participants.find((id: string) => id !== user.uid);
              if (!otherUserId) {
                console.warn(`Chat ${doc.id} has no other participant`);
                return;
              }

              chatList.push({
                id: doc.id,
                otherUserName: data.participantNames?.[otherUserId] || 'Unknown User',
                otherUserPic:
                  data.participantPictures?.[otherUserId] ||
                  'https://placehold.co/80x80/1e293b/eab308?text=?',
                lastMessage: data.lastMessage || '...',
                lastTimestamp: data.lastTimestamp?.toDate?.() || new Date(),
              });
            });

            setChats(chatList);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching chats:', error);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Failed to setup inbox:', error);
        setLoading(false);
      }
    };

    setupInbox();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <Inbox className="w-12 h-12 text-amber-500" />
        <div>
          <h1 className="text-5xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
            Inbox
          </h1>
          <p className="text-lg text-slate-400">Your private conversations.</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {chats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-10 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl"
            >
              <h3 className="text-xl font-semibold text-white">Your Inbox is Empty</h3>
              <p className="text-slate-400 mt-2">
                Go to the "Stroll" page to find a user and send the first message.
              </p>
            </motion.div>
          ) : (
            chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                className="block"
              >
                <Link
                  href={`/portal/messages/${chat.id}`}
                  className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10"
                >
                  <img
                    src={chat.otherUserPic}
                    alt={chat.otherUserName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-700"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://placehold.co/80x80/1e293b/eab308?text=?';
                    }}
                  />
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-lg font-bold text-white font-serif truncate">
                      {chat.otherUserName}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">{chat.lastMessage}</p>
                  </div>
                  <div className="text-xs text-slate-500 self-start">
                    {timeAgo(chat.lastTimestamp)}
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

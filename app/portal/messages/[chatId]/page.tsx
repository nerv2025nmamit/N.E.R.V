'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { db, appId, ensureUserIsSignedIn } from '../../../firebase';
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

interface UserProfile {
  name: string;
  username: string;
  profilePicUrl: string;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function PrivateChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [recipient, setRecipient] = useState<UserProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupChat = async () => {
      try {
        setLoading(true);
        const currentUser = await ensureUserIsSignedIn();
        const senderId = currentUser.uid;
        setCurrentUserId(senderId);

        // firestore path this is for my understanding(in data artifacts then public in it click on chats to get the id)
        const chatDocRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "chats",
          chatId
        );

        await setDoc(
          chatDocRef,
          {
            participants: chatId.split('_'),
            lastTimestamp: serverTimestamp(),
          },
          { merge: true }
        );

        // get id
        const chatParticipants = chatId.split('_');
        const recipientId = chatParticipants.find((id) => id !== senderId);
        if (!recipientId) throw new Error('Invalid chat participants.');

        // path of prof
        const recipientDocRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "profiles",
          recipientId
        );

        const recipientSnap = await getDoc(recipientDocRef);

        if (recipientSnap.exists()) {
          const data = recipientSnap.data() as UserProfile;
          setRecipient({
            name: data.name || data.username || 'Mentor',
            username: data.username || '',
            profilePicUrl:
              data.profilePicUrl ||
              'https://placehold.co/80x80/1e293b/eab308?text=PIC',
          });
        } else {
          setRecipient({
            name: 'Unknown Seeker',
            username: 'unknown',
            profilePicUrl:
              'https://placehold.co/80x80/1e293b/eab308?text=PIC',
          });
        }

        // collecting
        const messagesRef = collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "chats",
          chatId,
          "messages"
        );

        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              msgs.push({
                id: doc.id,
                text: data.text,
                senderId: data.senderId,
                timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
              });
            });
            setMessages(msgs);
            setLoading(false);
            scrollToBottom();
          },
          (error) => {
            console.error('Error subscribing to messages:', error);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Chat setup failed:', error);
        setLoading(false);
      }
    };

    if (chatId) {
      setupChat();
    }
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUserId) return;

    const trimmedMessage = newMessage.trim();

    try {
      // collection path
      const messagesRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "chats",
        chatId,
        "messages"
      );

      await addDoc(messagesRef, {
        text: trimmedMessage,
        senderId: currentUserId,
        timestamp: serverTimestamp(),
      });

      // cht doc
      const chatDocRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "chats",
        chatId
      );

      await setDoc(
        chatDocRef,
        {
          lastMessage: trimmedMessage,
          lastTimestamp: serverTimestamp(),
          participants: chatId.split('_'),
        },
        { merge: true }
      );

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  const recipientName = recipient?.name || 'Fellow Seeker';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[85vh] bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl overflow-hidden"
    >
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-amber-500/10 bg-slate-900/80 sticky top-0 z-10">
        <img
          src={recipient?.profilePicUrl}
          alt={recipientName}
          className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-amber-500"
        />
        <div>
          <h2 className="text-xl font-bold text-white font-serif">{recipientName}</h2>
          <p className="text-sm text-amber-400">@{recipient?.username || 'user'}</p>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <MessageSquare className="w-12 h-12 mb-4 text-amber-500/50" />
            <p className="text-lg">Start your conversation with {recipientName}.</p>
            <p className="text-sm">Wisdom begins with a question.</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, index) => {
              const isSender = msg.senderId === currentUserId;
              const isNewDay =
                index === 0 ||
                msg.timestamp.toDateString() !==
                  messages[index - 1].timestamp.toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {isNewDay && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-center my-4"
                    >
                      <span className="text-xs text-slate-500 px-3 py-1 rounded-full bg-slate-800/70">
                        {msg.timestamp.toLocaleDateString()}
                      </span>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-md ${
                        isSender
                          ? 'bg-amber-600 text-slate-950 rounded-br-none'
                          : 'bg-slate-800 text-white rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <span
                        className={`text-xs mt-1 block ${
                          isSender ? 'text-slate-900/70' : 'text-slate-500'
                        } text-right`}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center p-4 border-t border-amber-500/10 bg-slate-900/80"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-full bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          className="ml-3 p-2 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors"
        >
          <Send className="w-5 h-5 text-slate-900" />
        </button>
      </form>
    </motion.div>
  );
}

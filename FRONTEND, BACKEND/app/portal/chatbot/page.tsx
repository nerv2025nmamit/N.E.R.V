'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, Trash } from 'lucide-react';
import { ensureUserIsSignedIn } from '../../firebase';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// Drona Logo with orange-gold circling ring (only the ring is orange-gold)
const DronaIcon = () => (
  <motion.div
    className="relative w-12 h-12"
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    {/* Ring */}
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        background:
          'conic-gradient(from 0deg, rgba(255,165,0,0.85), rgba(255,215,0,0.95), rgba(255,165,0,0.85))',
        filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.5))',
        padding: '2px',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
    >
      <div className="w-full h-full rounded-full bg-transparent" />
    </motion.div>

    {/* Logo image (no orange-gold, just the ring around it) */}
    <motion.div className="absolute inset-0 rounded-full overflow-hidden shadow-lg border border-indigo-400/40 bg-slate-900">
      <motion.img
        src="/dronalogo.jpg"
        alt="Drona Logo"
        className="w-full h-full object-cover"
        animate={{
          filter: [
            'drop-shadow(0 0 4px rgba(147,197,253,0.35))', // cool sky-blue glow
            'drop-shadow(0 0 8px rgba(167,139,250,0.45))', // soft purple glow
            'drop-shadow(0 0 4px rgba(147,197,253,0.35))',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  </motion.div>
);

const UserIcon = () => (
  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-slate-200">
    <User className="w-6 h-6" />
  </div>
);

export default function DronaAIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Seeker');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupUser = async () => {
      try {
        await ensureUserIsSignedIn();
        const loginData = localStorage.getItem('user');
        const { name } = loginData ? JSON.parse(loginData) : { name: 'Seeker' };
        setUserName(name);
        setMessages([
          {
            id: crypto.randomUUID(),
            role: 'model',
            text: `Greetings, ${name}. I am Drona, your personal guide. Ask me anything and I shall answer.`,
          },
        ]);
      } catch (e) {
        console.error('Auth failed:', e);
      }
    };
    setupUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      const response = await fetch('https://rag-chatbot-1-nerv-gaurav.onrender.com/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text }),
      });

      if (!response.ok) throw new Error('Backend error');

      const data = await response.json();
      const modelResponse = data.answer;

      if (modelResponse) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'model', text: modelResponse },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'model',
            text: 'I received a response, but its format was unexpected. Please try again.',
          },
        ]);
      }
    } catch (error) {
      console.error('API error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          text: 'Sorry, Seeker. I cannot reach the knowledge source right now.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="relative w-full h-[85vh] overflow-hidden">
      {/* Background: starfield + deep blue → purple gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/starfield.jpg"
          alt="Starfield background"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-indigo-900/60 to-purple-900/80" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Chat container */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 flex flex-col h-full rounded-2xl border border-indigo-700/50 shadow-xl overflow-hidden backdrop-blur-md bg-slate-900/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-700/40 bg-slate-900/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <DronaIcon />
            <div>
              <h2 className="text-xl font-bold text-indigo-100 font-serif">Drona AI</h2>
              <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-indigo-100 text-slate-900 hover:bg-white transition"
          >
            <Trash className="w-4 h-4" />
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && <DronaIcon />}
                <div
                  className={`max-w-xs md:max-w-lg p-4 rounded-xl shadow-md break-words ${
                    msg.role === 'user'
                      ? 'bg-indigo-700/70 text-white rounded-br-none'
                      : 'bg-indigo-900/70 text-indigo-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.role === 'user' && <UserIcon />}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
              <DronaIcon />
              <div className="max-w-xs md:max-w-lg p-4 rounded-xl shadow-md bg-indigo-900/70 text-indigo-100 rounded-tl-none">
                <Loader2 className="w-5 h-5 animate-spin text-sky-300" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-indigo-700/40 bg-slate-900/60 flex gap-3 sticky bottom-0"
        >
          <input
            type="text"
            className="flex-1 p-3 bg-indigo-900/60 border-2 border-indigo-700 rounded-xl text-indigo-100 placeholder-indigo-300/70 transition-all duration-300 outline-none focus:border-sky-400"
            placeholder="Ask Drona for guidance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-gradient-to-br from-sky-300 to-indigo-200 text-slate-900 font-bold rounded-full shadow-lg shadow-indigo-200/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-sky-200/40 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 -translate-x-px" />
            )}
          </motion.button>
        </form>

        {/* Scrollbar styling */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #0b1020;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4338ca;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6366f1;
          }
        `}</style>
      </motion.div>
    </div>
  );
}
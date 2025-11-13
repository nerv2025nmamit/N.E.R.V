'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { ensureUserIsSignedIn } from '../../firebase'; // Import auth

// --- Type Definitions ---
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// --- Custom Bot Icon ---
const DronaIcon = () => (
  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-lg">
    <Bot className="w-5 h-5" />
  </div>
);

// --- User Icon ---
const UserIcon = () => (
  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-700 text-slate-200">
    <User className="w-5 h-5" />
  </div>
);

// --- Main Chat Component ---
export default function DronaAIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Seeker');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Load user's name ---
  useEffect(() => {
    const setupUser = async () => {
      try {
        await ensureUserIsSignedIn(); // Make sure user is logged in
        const loginData = localStorage.getItem('user');
        const { name } = loginData ? JSON.parse(loginData) : { name: 'Seeker' };
        setUserName(name);
        
        // Add the first greeting message from Drona
        setMessages([
          {
            id: crypto.randomUUID(),
            role: 'model',
            text: `Greetings, ${name}. I am Drona, your personal Sarthi (guide). Ask me any knowledge you seek on your quest.`
          }
        ]);
        
      } catch (e) {
        console.error("Auth failed:", e);
      }
    };
    setupUser();
  }, []);
  
  // --- Auto-scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handle Sending a Message ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    // --- NEW: Call your friend's backend API ---
    
    // --- FIX: Using the correct URL from your friend ---
    const backendUrl = 'https://rag-chatbot-1-nerv-gaurav.onrender.com/ask';

    // --- FIX: Using the correct payload from your friend ---
    const payload = {
      question: userMessage.text
    };

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // This will catch the 502/404 errors if the backend is down
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // !!! IMPORTANT: Ask your friend what this field is. I am GUESSING 'data.answer'
      // It could be 'data.response', 'data.text', or just 'data'
      const modelResponse = data.answer; 

      if (modelResponse) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          text: modelResponse,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // If 'data.answer' is wrong, this error will fire.
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response structure from backend. Check console.");
      }

    } catch (error) {
      console.error("Backend API call failed:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Apologies, Seeker. My connection to the knowledge source is disrupted. The backend at 'onrender.com' may be offline or the API structure is incorrect.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-[85vh] bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl overflow-hidden"
    >
      {/* --- Chat Header --- */}
      <div className="flex items-center p-4 border-b border-amber-500/10 bg-slate-900/80 sticky top-0 z-10">
        <DronaIcon />
        <div className="ml-3">
          <h2 className="text-xl font-bold text-white font-serif">Drona AI</h2>
          <p className="text-sm text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Online
          </p>
        </div>
      </div>

      {/* --- Message Area --- */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && <DronaIcon />}
              
              <div
                className={`max-w-xs md:max-w-lg p-4 rounded-xl shadow-md ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-white rounded-tl-none'
                }`}
              >
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </p>
              </div>
              
              {msg.role === 'user' && <UserIcon />}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <DronaIcon />
            <div className="max-w-xs md:max-w-lg p-4 rounded-xl shadow-md bg-slate-800 text-white rounded-tl-none">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/80 flex gap-3 sticky bottom-0">
        <input
          type="text"
          className="flex-1 resize-none p-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 transition-all duration-300 outline-none focus:border-amber-500"
          placeholder="Ask Drona for guidance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !input.trim()}
          className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-full shadow-lg shadow-amber-500/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-amber-500/40 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -translate-x-px" />}
        </motion.button>
      </form>
      
      {/* --- Custom Scrollbar CSS --- */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b; /* slate-800 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569; /* slate-600 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #eab308; /* amber-500 */
        }
      `}</style>
    </motion.div>
  );
}
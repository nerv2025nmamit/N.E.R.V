'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export const FieryArrowLogo = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: -20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1, duration: 1, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-center">
        {imgError ? (
          <div className="h-24 w-24 rounded-full bg-slate-800 border-2 border-red-400 flex items-center justify-center">
            <Target className="w-12 h-12 text-red-400" />
          </div>
        ) : (
          <motion.img
            src="/image.jpg"
            alt="Lakshya Archer Logo"
            className="h-24 w-24 rounded-full object-cover border-2 border-red-400 shadow-lg bg-slate-900"
            onError={() => setImgError(true)}
            animate={{
              filter: [
                'drop-shadow(0 0 10px rgba(251,191,36,0.7))',
                'drop-shadow(0 0 16px rgba(251,191,36,1))',
                'drop-shadow(0 0 10px rgba(251,191,36,0.7))',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
     
    </motion.div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number; // numeric
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation?: number;
  opacityStart?: number;
}

// Golden shimmer bubbles
export const GoldenBubbles = () => {
  const [bubbles, setBubbles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 14 + 6,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 4,
      rotation: Math.random() * 360,
      opacityStart: Math.random() * 0.5 + 0.2,
    }));
    setBubbles(generated);
  }, []);

  if (bubbles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-amber-400/70 blur-md"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            rotate: bubble.rotation,
            opacity: bubble.opacityStart,
          }}
          animate={{
            y: [`${bubble.y}%`, `${bubble.y - 100}%`],
            x: [`${bubble.x}%`, `${bubble.x + (Math.random() * 20 - 10)}%`],
            opacity: [bubble.opacityStart!, 0.6, 0],
            scale: [0.8, 1.1, 0.9],
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: bubble.delay,
          }}
        />
      ))}
    </div>
  );
};

// Flame bubble wisps
export const FlameWisps = () => {
  const [wisps, setWisps] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      size: Math.random() * 24 + 12,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 6,
      rotation: Math.random() * 360,
      opacityStart: Math.random() * 0.5 + 0.3,
    }));
    setWisps(generated);
  }, []);

  if (wisps.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      {wisps.map((wisp) => (
        <motion.div
          key={wisp.id}
          className="absolute rounded-full bg-gradient-to-t from-red-500/90 via-orange-400/70 to-yellow-200/50 blur-xl"
          style={{
            width: wisp.size,
            height: wisp.size,
            left: `${wisp.x}%`,
            top: `${wisp.y}%`,
            rotate: wisp.rotation,
            opacity: wisp.opacityStart,
          }}
          animate={{
            y: [`${wisp.y}%`, `${wisp.y - 200}%`],
            x: [`${wisp.x}%`, `${wisp.x + (Math.random() * 30 - 15)}%`],
            opacity: [wisp.opacityStart!, 0.8, 0],
            scale: [0.7, 1.2, 0.8],
          }}
          transition={{
            duration: wisp.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: wisp.delay,
          }}
        />
      ))}
    </div>
  );
};

import React from 'react';
import { FlameWisps, GoldenBubbles } from './Particles'; // adjust path if needed

export function ParticlesWrapper({ hideOnMobile = true }: { hideOnMobile?: boolean }) {
  return (
    <div className={hideOnMobile ? 'hidden md:block pointer-events-none' : 'pointer-events-none'}>
      <FlameWisps />
      <GoldenBubbles />
    </div>
  );
}

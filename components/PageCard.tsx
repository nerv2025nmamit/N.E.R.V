import React from 'react';

export function PageCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full px-4 sm:px-6 md:px-8 max-w-full sm:max-w-3xl mx-auto p-4 sm:p-6 rounded-2xl bg-slate-900/75 backdrop-blur-md overflow-visible ${className}`}>
      {children}
    </div>
  );
}

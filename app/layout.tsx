import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Lakshya Portal',
  description: 'Your flame-bubbles portal homepage',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 font-sans">{children}</body>
    </html>
  );
}

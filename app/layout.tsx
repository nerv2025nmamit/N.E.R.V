import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login Portal',
  description: 'Simple Next.js Login Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/ui/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'System Monitoring Dashboard',
  description: 'Real-time system monitoring dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>{children}</body>
    </html>
  );
} 
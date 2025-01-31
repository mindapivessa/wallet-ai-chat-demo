import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wallet AI Chat Demo',
  description: 'OnchainKit Wallet AI Chat Component Demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} min-h-screen`}>
        <div className="flex min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
} 
import './globals.css';
import Navbar from '@/components/Navbar';
import WaveShaderBackground from '@/components/WaveShaderBackground';
import { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { AuthProvider } from '@/context/AuthContext';

import Link from 'next/link';

export const metadata = {
  title: 'TradeX — B2B Local Marketplace | Maharashtra Industrial Hubs',
  description: 'Connect with local manufacturers, MIDC suppliers, vendors, and industrial distributors across Maharashtra faster.',
  keywords: 'B2B Marketplace, Maharashtra MIDC, Pune manufacturers, Nashik suppliers, RFQ platform, Indian industrial directory',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  const initialUser = currentUser
    ? {
        id: currentUser.userId,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      }
    : null;

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col text-slate-900 relative">
        {/* Animated WebGL Shader Background */}
        <WaveShaderBackground opacity={0.75} />
        <AuthProvider initialUser={initialUser}>
          <Navbar />
          <main className="flex-1 relative z-0">{children}</main>
          <footer className="bg-white/60 backdrop-blur-md border-t border-slate-200/60 py-6 text-center text-xs text-slate-500 relative z-10">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>TradeX MVP 1.0 — Empowering Indian Local B2B Commerce</span>
              <div className="flex items-center gap-4 text-xs">
                <Link href="/privacy" className="hover:text-sky-700 transition">Privacy Policy</Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-sky-700 transition">Terms of Service</Link>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

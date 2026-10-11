'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Navbar } from '@/components/Navbar';
import { ProfileOverlay } from '@/components/ProfileOverlay';
import { MessageOverlay } from '@/components/MessageOverlay';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    // Tunggu proses restore sesi (via refresh cookie) selesai dulu sebelum memutuskan redirect
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [isInitialized, user, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-guyub-krem">
        <img src="/logo.png" alt="Logo" className="mb-3 h-16 w-16" />
        <p className="font-body text-guyub-bambuDark">Memuat…</p>
      </div>
    );
  }

   return (
    <div className="flex min-h-screen flex-col bg-guyub-krem">
      <Navbar />
      <ProfileOverlay />
      <MessageOverlay />
      <div className="guyub-pattern flex-1">
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

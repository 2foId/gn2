'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Navbar } from '@/components/Navbar';
import { ProfileOverlay } from '@/components/ProfileOverlay';
import { MessageOverlay } from '@/components/MessageOverlay';
import { PenggerakOnly } from '@/components/PenggerakOnly';
import { SlotSorotan } from '@/components/SlotSorotan';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    // Tunggu proses restore sesi (via refresh cookie) selesai dulu sebelum memutuskan redirect
    if (isInitialized && !user) {
      router.replace('/login');
    }
    if (isInitialized && user && !user.onboardingDone) {
      router.replace('/onboarding');
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
        <main className="mx-auto max-w-6xl px-6 py-8">
          {user.role === 'PELAJAR' && (pathname?.startsWith('/dashboard/umkm') || pathname?.startsWith('/dashboard/acara'))
            ? <PenggerakOnly />
            : children}
        </main>
        {(user.role === 'PENGGERAK' || user.role === 'ADMIN') && !pathname?.startsWith('/dashboard/wasiat') && (
          <div className="mx-auto max-w-6xl px-6 py-4 flex justify-end">
            <SlotSorotan />
          </div>
        )}
      </div>
    </div>
  );
}

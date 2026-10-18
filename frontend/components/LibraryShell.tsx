'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Navbar } from '@/components/Navbar';
import { ProfileOverlay } from '@/components/ProfileOverlay';
import { MessageOverlay } from '@/components/MessageOverlay';

export function LibraryShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
    if (user && !user.onboardingDone) router.replace('/onboarding');
  }, [isInitialized, user, router]);

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-guyub-krem dark:bg-stone-950"><p className="font-body text-guyub-bambuDark dark:text-stone-100">Memuat…</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-guyub-krem dark:bg-stone-950">
      <Navbar />
      <ProfileOverlay />
      <MessageOverlay />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {user.role === 'PENGGERAK' ? (
          <section className="max-w-xl rounded-xl border border-guyub-gula bg-white p-6 dark:bg-stone-900">
            <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Pustaka tidak tersedia untuk peran Penggerak.</h1>
          </section>
        ) : children}
      </main>
    </div>
  );
}
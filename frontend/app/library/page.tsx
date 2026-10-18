'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Navbar } from '@/components/Navbar';
import { ProfileOverlay } from '@/components/ProfileOverlay';
import { MessageOverlay } from '@/components/MessageOverlay';

interface LibraryCategory {
  category: string;
  links: { name: string; url: string }[];
}

export default function LibraryPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
    if (user && !user.onboardingDone) router.replace('/onboarding');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user?.onboardingDone) return;
    api.get('/library/links')
      .then((response) => setCategories(response.data))
      .catch(() => setError('Tautan pustaka gagal dimuat.'))
      .finally(() => setLoading(false));
  }, [user?.id, user?.onboardingDone]);

  return (
    <div className="flex min-h-screen flex-col bg-guyub-krem dark:bg-stone-950">
      <Navbar />
      <ProfileOverlay />
      <MessageOverlay />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah dark:text-amber-300">Belajar dan membaca</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-guyub-bambuDark dark:text-stone-100">Pustaka</h1>
        <p className="mt-3 max-w-2xl font-body text-sm text-stone-700 dark:text-stone-200">Jelajahi jurnal, buku, arsip, dan koleksi perpustakaan digital.</p>
        {loading && <p className="mt-8 font-body text-sm text-stone-700 dark:text-stone-200">Memuat pustaka…</p>}
        {error && <p role="alert" className="mt-8 font-body text-sm text-red-800 dark:text-red-300">{error}</p>}
        {!loading && !error && (
          <div className="mt-8 space-y-8">
            {categories.map((category) => (
              <section key={category.category} className="border-t border-guyub-bambu/25 pt-5">
                <h2 className="font-display text-xl font-semibold text-guyub-bambuDark dark:text-stone-100">{category.category}</h2>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {category.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border border-guyub-bambuDark bg-white px-4 py-2 font-body text-sm font-medium text-guyub-bambuDark transition hover:bg-guyub-krem dark:border-stone-400 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
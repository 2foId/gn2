'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, type Role } from '@/lib/auth-store';
import { UserAvatar } from '@/components/UserIdentity';
import { BingkaiStore } from '@/components/BingkaiStore';

const roleMenus: Record<Role, { href: string; label: string }[]> = {
  PELAJAR: [
    { href: '/dashboard/wasiat', label: 'Wasiat Ngapak' },
    { href: '/dashboard/peta', label: 'Peta Butuh Guyub' },
    { href: '/pustaka', label: 'Pustaka' },
  ],
  PENGGERAK: [
    { href: '/dashboard/wasiat', label: 'Wasiat Ngapak' },
    { href: '/dashboard/peta', label: 'Peta Butuh Guyub' },
    { href: '/dashboard/umkm', label: 'UMKM Dibantu' },
    { href: '/dashboard/acara', label: 'Guyub Acara' },
    { href: '/dashboard/dampak', label: 'Dampak' },
  ],
  ADMIN: [
    { href: '/dashboard/wasiat', label: 'Wasiat Ngapak' },
    { href: '/dashboard/peta', label: 'Peta Butuh Guyub' },
    { href: '/pustaka', label: 'Pustaka' },
    { href: '/dashboard/umkm', label: 'UMKM Dibantu' },
    { href: '/dashboard/acara', label: 'Guyub Acara' },
    { href: '/dashboard/dampak', label: 'Dampak' },
  ],
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [currency, setCurrency] = useState(0);
  const [bingkaiStoreOpen, setBingkaiStoreOpen] = useState(false);
  const [bingkaiGaya, setBingkaiGaya] = useState<string | null>(null);
  const updateUser = useAuthStore((s) => s.updateUser);
  const visibleMenu = user ? roleMenus[user.role] : [];

  useEffect(() => {
    if (!user) {
      setCurrency(0);
      return;
    }
    let active = true;
    const loadCurrency = async () => {
      try {
        const [levelRes, bingkaiRes] = await Promise.all([
          api.get('/users/me/level'),
          api.get('/bingkai'),
        ]);
        if (active) {
          setCurrency(levelRes.data.currency ?? 0);
          const items = bingkaiRes.data.items;
          const activeBingkai = items.find((b: any) => b.dipasang);
          if (activeBingkai && activeBingkai.gaya !== bingkaiGaya) {
            setBingkaiGaya(activeBingkai.gaya);
            updateUser({ bingkaiGaya: activeBingkai.gaya });
          }
        }
      } catch {
        if (active) setCurrency(0);
      }
    };
    loadCurrency();
    window.addEventListener('guyub:level-updated', loadCurrency);
    return () => {
      active = false;
      window.removeEventListener('guyub:level-updated', loadCurrency);
    };
  }, [user?.id]);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearSession();
      router.push('/');
    }
  }

  return (
    <header className="border-b border-guyub-bambu/15 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard/peta" className="flex items-center gap-2 font-display text-lg font-semibold text-guyub-bambuDark">
          Guyub Ngapak
          <img src="/logo.png" alt="Logo" className="h-6 w-6" />
        </Link>

        <nav className="hidden gap-1 md:flex">
          {visibleMenu.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 font-body text-sm font-medium transition ${active
                  ? 'bg-guyub-bambuDark text-white'
                  : 'text-stone-600 hover:bg-guyub-krem'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/faq"
            aria-label="Pusat Bantuan"
            className="rounded-full p-2 text-guyub-bambuDark transition hover:bg-guyub-krem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
              <path d="M12 17h.01" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('guyub:open-messages'))}
            aria-label="Pesan"
            className="rounded-full p-2 text-guyub-bambuDark transition hover:bg-guyub-krem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </button>
          <button type="button" onClick={() => user && window.dispatchEvent(new CustomEvent('guyub:open-profile', { detail: { userId: user.id } }))} className="flex items-center gap-2 text-right">
            {user && <UserAvatar user={{ ...user, bingkaiGaya }} size="sm" />}
            {user && (
              <>
                <button type="button" onClick={() => setBingkaiStoreOpen(true)} aria-label="Buka toko bingkai" className="inline-flex items-center gap-1.5 rounded-full bg-guyub-krem px-3 py-1 font-body text-xs font-bold text-guyub-bambuDark"><img src="/icons/segitiga.svg" alt="" className="h-4 w-4 dark:brightness-0 dark:invert" />{currency.toLocaleString('id-ID')}</button>
                <div>
                  <p className="font-body text-sm font-medium text-stone-800 hover:underline">{user?.nama}</p>
                  <p className="font-body text-xs uppercase tracking-wide text-guyub-tanah">{user?.role === 'ADMIN' ? 'Admin' : user?.role === 'PENGGERAK' ? 'Penggerak' : 'Pelajar'}</p>
                </div>
              </>
            )}
          </button>
          {user && <BingkaiStore isOpen={bingkaiStoreOpen} onClose={() => setBingkaiStoreOpen(false)} />}
          <button
            onClick={handleLogout}
            className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm font-medium text-stone-600 transition hover:border-guyub-merahBata hover:text-guyub-merahBata"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Nav mobile */}
      <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {visibleMenu.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-body text-sm font-medium transition ${active ? 'bg-guyub-bambuDark text-white' : 'bg-guyub-krem text-stone-600'
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

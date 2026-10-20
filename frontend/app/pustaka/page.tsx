'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { LibraryShell } from '@/components/LibraryShell';
import { LibraryNotesPanel } from '@/components/LibraryNotesPanel';
import { LocalRegionPanel } from '@/components/pustaka/LocalRegionPanel';
import { LiterasiSearchPanel } from '@/components/pustaka/LiterasiSearchPanel';
import { librarySources, type LibrarySourceName } from '@/lib/library-sources';

type PustakaTab = 'jelajah' | 'berita' | 'catatan' | 'sumber';

const tabs: { value: PustakaTab; label: string }[] = [
  { value: 'jelajah', label: 'Jelajah Tempat' },
  { value: 'berita', label: 'Berita Terbaru' },
  { value: 'catatan', label: 'Catatan Rujukan' },
  { value: 'sumber', label: 'Pencarian Sumber' },
];

interface LibraryCategory {
  category: string;
  links: { name: string; url: string }[];
}

export default function PustakaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const queryTab = searchParams.get('tab');
  const [tab, setTab] = useState<PustakaTab>('jelajah');
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [linksError, setLinksError] = useState('');

  useEffect(() => {
    const validTab = tabs.some((candidate) => candidate.value === queryTab);
    setTab(validTab ? queryTab as PustakaTab : 'jelajah');
  }, [queryTab]);

  useEffect(() => {
    if (!user?.onboardingDone || user.role === 'PENGGERAK') return;
    api.get('/pustaka/links')
      .then((response) => setCategories(response.data))
      .catch(() => setLinksError('Tautan pustaka belum dapat dimuat.'));
  }, [user?.id, user?.role, user?.onboardingDone]);

  function selectTab(value: PustakaTab) {
    setTab(value);
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
  }

  return (
    <>
      {user?.role === 'PENGGERAK' && (
        <div className="min-h-screen bg-guyub-krem px-6 py-12">
          <h1 className="font-display text-3xl font-semibold text-guyub-bambuDark dark:text-stone-100">Pustaka</h1>
          <p className="mt-4 font-body text-sm text-stone-600 dark:text-stone-300">
            Fitur ini tidak tersedia untuk peran Penggerak.
          </p>
        </div>
      )}
      {!user || user?.role !== 'PENGGERAK' && (
        <LibraryShell>
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah dark:text-amber-300">Belajar dan membaca</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-guyub-bambuDark dark:text-stone-100">Pustaka</h1>
      <div role="tablist" aria-label="Bagian Pustaka" className="mt-6 flex gap-2 overflow-x-auto border-b border-guyub-bambu/25 pb-2">
        {tabs.map((item) => <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={tab === item.value}
          aria-controls={`pustaka-panel-${item.value}`}
          onClick={() => selectTab(item.value)}
          className={`min-h-10 shrink-0 rounded-full px-4 py-2 font-body text-sm font-medium transition ${tab === item.value ? 'bg-guyub-bambuDark text-white' : 'text-stone-700 hover:bg-guyub-bambu/10 dark:text-stone-200 dark:hover:bg-stone-800'}`}
        >{item.label}</button>)}
      </div>

      <div id={`pustaka-panel-${tab}`} role="tabpanel" className="mt-6 min-w-0">
        {tab === 'jelajah' && <LocalRegionPanel />}
        {(tab === 'berita' || tab === 'sumber') && <LiterasiSearchPanel />}
        {tab === 'catatan' && <LibraryNotesPanel />}
      </div>

      {tab === 'sumber' && <section className="mt-10 border-t border-guyub-bambu/25 pt-5">
        <h2 className="font-display text-xl font-semibold text-guyub-bambuDark dark:text-stone-100">Tautan pustaka</h2>
        {linksError && <p role="alert" className="mt-3 font-body text-sm text-red-800 dark:text-red-300">{linksError}</p>}
        <div className="mt-3 space-y-5">
          {categories.map((category) => <section key={category.category}>
            <h3 className="font-body text-sm font-semibold text-stone-700 dark:text-stone-200">{category.category}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {category.links.map((link) => <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-guyub-bambuDark bg-white px-4 py-2 font-body text-sm font-medium text-guyub-bambuDark hover:bg-guyub-krem dark:border-stone-400 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800">{link.name}</a></li>)}
            </ul>
          </section>)}
        </div>
      </section>}
    </LibraryShell>
      )}
    </>
  );
}
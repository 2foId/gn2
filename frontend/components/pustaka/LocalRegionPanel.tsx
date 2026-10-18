'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RegionCombobox } from './RegionCombobox';

interface LocalArticle {
  id: string;
  judul: string;
  ringkasan: string;
  sumber: string;
  tautan: string;
  createdAt: string;
}

interface LocalRegion {
  id: string;
  slug: string;
  nama: string;
  status: 'AKTIF' | 'SEGERA_HADIR';
  ringkasan: string | null;
  pertanyaanPemantik: string | null;
  articles: LocalArticle[];
}

export function LocalRegionPanel() {
  const [regions, setRegions] = useState<LocalRegion[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/pustaka/daerah')
      .then((response) => setRegions(response.data))
      .catch(() => setError('Daftar wilayah belum dapat dimuat.'))
      .finally(() => setLoading(false));
  }, []);

  const selected = regions.find((region) => region.slug === selectedSlug) ?? null;

  return (
    <section className="min-w-0">
      <h2 className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Jelajah Tempat</h2>
      <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">Pilih kabupaten/kota untuk melihat bahan bacaan yang sudah dikurasi.</p>
      <div className="mt-5 max-w-xl">
        <RegionCombobox regions={regions} value={selectedSlug} onChange={setSelectedSlug} loading={loading} />
      </div>
      {error && <p role="alert" className="mt-5 font-body text-sm text-red-800 dark:text-red-300">{error}</p>}
      {!loading && !error && !selected && <p className="mt-5 font-body text-sm text-stone-600 dark:text-stone-300">Pilih wilayah untuk melihat detail.</p>}
      {selected && <section aria-live="polite" className="mt-6 max-w-3xl border-t border-guyub-bambu/25 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-guyub-bambuDark dark:text-stone-100">{selected.nama}</h3>
          <span className="rounded-full border border-guyub-bambu/30 px-3 py-1 font-body text-xs font-medium text-stone-700 dark:border-stone-500 dark:text-stone-200">{selected.status === 'AKTIF' ? 'Aktif' : 'Segera hadir'}</span>
        </div>
        {selected.status === 'SEGERA_HADIR' ? <p className="mt-3 font-body text-sm text-stone-700 dark:text-stone-200">Segera hadir</p> : <>
          {selected.ringkasan && <p className="mt-3 font-body text-sm text-stone-700 dark:text-stone-200">{selected.ringkasan}</p>}
          {selected.pertanyaanPemantik && <div className="mt-4 rounded-lg border-l-4 border-guyub-gula bg-white px-4 py-3 dark:bg-stone-900">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah dark:text-amber-300">Pertanyaan pemantik</p>
            <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">{selected.pertanyaanPemantik}</p>
          </div>}
          <h4 className="mt-6 font-display text-lg font-semibold text-guyub-bambuDark dark:text-stone-100">Artikel terverifikasi</h4>
          {!selected.articles.length ? <p className="mt-2 font-body text-sm text-stone-600 dark:text-stone-300">Belum ada artikel terverifikasi.</p> : <div className="mt-2 divide-y divide-guyub-bambu/20">
            {selected.articles.map((article) => <article key={article.id} className="py-4">
              <a href={article.tautan} target="_blank" rel="noopener noreferrer" className="font-display text-lg font-semibold text-guyub-bambuDark underline dark:text-stone-100">{article.judul}</a>
              <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">{article.ringkasan}</p>
              <p className="mt-2 font-body text-xs text-stone-600 dark:text-stone-300">Sumber: {article.sumber}</p>
            </article>)}
          </div>}
        </>}
      </section>}
    </section>
  );
}
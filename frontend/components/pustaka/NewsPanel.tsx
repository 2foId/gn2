'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useEffect } from 'react';
import { RegionCombobox, type RegionOption } from './RegionCombobox';

interface NewsItem {
  title: string;
  snippet: string;
  source: string;
  date: string;
  link: string;
}

type Order = 'terbaru' | 'terlama' | 'relevan';

function responseMessage(error: any) {
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : message ?? 'Berita sedang tidak tersedia. Coba lagi nanti.';
}

export function NewsPanel() {
  const [q, setQ] = useState('');
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [selectedRegionSlug, setSelectedRegionSlug] = useState('');
  const [regionsError, setRegionsError] = useState(false);
  const [urutan, setUrutan] = useState<Order>('terbaru');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [message, setMessage] = useState('Berita belum tersedia.');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.get('/pustaka/daerah')
      .then((response) => setRegions(response.data.map((region: RegionOption) => ({ slug: region.slug, nama: region.nama }))))
      .catch(() => setRegionsError(true))
      .finally(() => setRegionsLoading(false));
  }, []);

  async function search(targetPage = 1, append = false, order = urutan, regionSlug = selectedRegionSlug) {
    if (regionsLoading || regionsError || regions.length === 0) return;
    const regionName = regions.find((region) => region.slug === regionSlug)?.nama ?? '';
    setLoading(true);
    setSearched(true);
    try {
      const response = await api.get('/pustaka/berita', {
        params: { q: q.trim(), kabupaten: regionName, urutan: order, halaman: targetPage },
      });
      const result = response.data;
      setItems((current) => append ? [...current, ...result.items] : result.items);
      setPage(result.halaman);
      setHasMore(result.hasMore);
      setIsMock(result.isMock === true);
      setMessage(result.message ?? (result.items.length ? '' : 'Tidak ada berita yang cocok.'));
    } catch (requestError) {
      setItems(append ? items : []);
      setHasMore(false);
      setIsMock(false);
      setMessage(responseMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void search(1, false);
  }

  function changeRegion(slug: string) {
    setSelectedRegionSlug(slug);
    void search(1, false, urutan, slug);
  }

  return (
    <section className="min-w-0">
      <h2 className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Berita Terbaru</h2>
      <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">Berita dicari di server; hasil yang ditampilkan menyertakan atribusi sumber.</p>
      <form onSubmit={submit} className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)_auto_auto]">
        <label className="sr-only" htmlFor="news-query">Kata kunci berita</label>
        <input id="news-query" maxLength={80} value={q} onChange={(event) => setQ(event.target.value)} placeholder="Topik berita" className="min-w-0 rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100" />
        <RegionCombobox regions={regions} value={selectedRegionSlug} onChange={changeRegion} allLabel="Seluruh Jawa Tengah" loading={regionsLoading} label="Kabupaten/kota" />
        <div className="min-w-0">
          <label htmlFor="news-order" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Urutkan</label>
          <select id="news-order" value={urutan} onChange={(event) => {
          const value = event.target.value as Order;
          setUrutan(value);
          if (searched) void search(1, false, value);
          }} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100">
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
            <option value="relevan">Relevan</option>
          </select>
        </div>
        <button type="submit" disabled={loading || regionsLoading || regionsError || regions.length === 0} className="self-end rounded-full bg-guyub-bambuDark px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Mencari…' : 'Cari berita'}</button>
      </form>
      {regionsError && <p role="alert" className="mt-3 font-body text-sm text-red-800 dark:text-red-300">Daftar kabupaten belum tersedia.</p>}
      {!regionsLoading && !regionsError && regions.length === 0 && <p className="mt-3 font-body text-sm text-stone-700 dark:text-stone-200">Daftar kabupaten belum tersedia.</p>}
      {isMock && <span className="mt-4 inline-flex rounded-full border border-guyub-gula px-3 py-1 font-body text-xs font-medium text-stone-700 dark:text-stone-200">Data contoh</span>}
      {message && <p role="status" className="mt-6 font-body text-sm text-stone-700 dark:text-stone-200">{message}</p>}
      {!!items.length && <div className="mt-5 divide-y divide-guyub-bambu/20 border-y border-guyub-bambu/20">
        {items.map((item, index) => <article key={`${item.link}-${index}`} className="py-5">
          <h3 className="font-display text-lg font-semibold leading-snug"><a href={item.link} target="_blank" rel="noopener noreferrer" className="text-guyub-bambuDark underline dark:text-stone-100">{item.title}</a></h3>
          <p className="mt-2 font-body text-sm text-stone-700 dark:text-stone-200">{item.snippet}</p>
          <p className="mt-2 font-body text-xs text-stone-600 dark:text-stone-300">{item.source}{item.date ? ` · ${item.date}` : ''}</p>
        </article>)}
      </div>}
      {hasMore && <button type="button" disabled={loading} onClick={() => void search(page + 1, true)} className="mt-5 rounded-full border border-guyub-bambuDark px-5 py-2 font-body text-sm font-semibold text-guyub-bambuDark disabled:opacity-50 dark:border-stone-400 dark:text-stone-100">{loading ? 'Memuat…' : 'Muat lagi'}</button>}
    </section>
  );
}
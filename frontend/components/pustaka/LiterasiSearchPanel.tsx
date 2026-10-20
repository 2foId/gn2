'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface LiterasiItem {
  title: string;
  snippet: string;
  source: string;
  date: string;
  link: string;
  engine?: string;
}

type Sumber = 'semua' | 'scholar' | 'berita';
type Urutan = 'relevan' | 'terbaru';

const SUMBER_OPSI: { value: Sumber; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'scholar', label: 'Jurnal dan Buku' },
  { value: 'berita', label: 'Berita' },
];

const URUTAN_OPSI: { value: Urutan; label: string }[] = [
  { value: 'relevan', label: 'Relevan' },
  { value: 'terbaru', label: 'Terbaru' },
];

function engineLabel(engine: string | undefined): string {
  if (engine === 'google_scholar') return 'Jurnal/Buku';
  if (engine === 'google_news') return 'Berita';
  return 'Sumber';
}

export function LiterasiSearchPanel() {
  const [q, setQ] = useState('');
  const [sumber, setSumber] = useState<Sumber>('semua');
  const [urutan, setUrutan] = useState<Urutan>('relevan');
  const [items, setItems] = useState<LiterasiItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(
    async (targetPage = 1, append = false) => {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        const response = await api.get('/pustaka/cari', {
          params: { q: q.trim(), sumber, urutan, halaman: targetPage },
        });
        const result = response.data;
        setItems((current) => (append ? [...current, ...result.items] : result.items));
        setPage(result.halaman ?? targetPage);
        setHasMore(result.hasMore ?? false);
        if (!result.items.length && !append) {
          setError('Tidak ada hasil yang cocok.');
        }
      } catch (requestError: any) {
        const message = requestError.response?.data?.message;
        setError(Array.isArray(message) ? message.join('. ') : message ?? 'Pencarian sedang tidak tersedia. Coba lagi nanti.');
        setItems(append ? items : []);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [q, sumber, urutan, items],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void search(1, false);
  }

  function changeSumber(value: Sumber) {
    setSumber(value);
    void search(1, false);
  }

  function changeUrutan(value: Urutan) {
    setUrutan(value);
    if (searched) void search(1, false);
  }

  return (
    <section className="min-w-0">
      <h2 className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Pencarian Literasi</h2>
      <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">
        Hasil dicari di server melalui SerpAPI. Kunci API tidak dikirim ke browser.
      </p>
      <form onSubmit={submit} className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(14rem,0.8fr)_minmax(12rem,0.6fr)_auto_auto]">
        <label className="sr-only" htmlFor="literasi-query">Kata kunci</label>
        <input
          id="literasi-query"
          maxLength={80}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Kata kunci pencarian…"
          className="min-w-0 rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
        <div className="min-w-0">
          <label htmlFor="literasi-sumber" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Sumber</label>
          <select
            id="literasi-sumber"
            value={sumber}
            onChange={(event) => changeSumber(event.target.value as Sumber)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          >
            {SUMBER_OPSI.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="literasi-urutan" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Urutkan</label>
          <select
            id="literasi-urutan"
            value={urutan}
            onChange={(event) => changeUrutan(event.target.value as Urutan)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          >
            {URUTAN_OPSI.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="self-end rounded-full bg-guyub-bambuDark px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Mencari…' : 'Cari'}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 font-body text-sm text-red-800 dark:text-red-300">{error}</p>}
      {!searched && !loading && !error && (
        <p className="mt-5 font-body text-sm text-stone-600 dark:text-stone-300">
          Masukkan kata kunci untuk mencari konten literasi.
        </p>
      )}
      {searched && !loading && !items.length && !error && (
        <p className="mt-5 font-body text-sm text-stone-600 dark:text-stone-300">
          Tidak ada hasil yang cocok.
        </p>
      )}
      {!!items.length && (
        <div className="mt-5 divide-y divide-guyub-bambu/20 border-y border-guyub-bambu/20">
          {items.map((item, index) => (
            <article key={`${item.link}-${index}`} className="py-5">
              <h3 className="font-display text-lg font-semibold leading-snug">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-guyub-bambuDark underline dark:text-stone-100"
                >
                  {item.title}
                </a>
              </h3>
              <p className="mt-2 font-body text-sm text-stone-700 dark:text-stone-200">{item.snippet}</p>
              <p className="mt-2 font-body text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1">
                <span>{item.source}</span>
                {item.date && <span>· {item.date}</span>}
                <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-guyub-krem/50 px-2 py-0.5 font-body text-[10px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  {engineLabel(item.engine)}
                </span>
              </p>
            </article>
          ))}
        </div>
      )}
      {hasMore && !loading && items.length && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void search(page + 1, true)}
          className="mt-5 rounded-full border border-guyub-bambuDark px-5 py-2 font-body text-sm font-semibold text-guyub-bambuDark disabled:opacity-50 dark:border-stone-400 dark:text-stone-100"
        >
          Muat lagi
        </button>
      )}
    </section>
  );
}

'use client';

import { useState } from 'react';
import { librarySources, type LibrarySourceName } from '@/lib/library-sources';

export function SourceSearchPanel() {
  const [source, setSource] = useState<LibrarySourceName>('Google Scholar');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  function search(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Masukkan kata kunci pencarian.');
      return;
    }
    setError('');
    const url = librarySources[source].url.replace('{q}', encodeURIComponent(trimmed));
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="max-w-3xl">
      <h2 className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Pencarian Sumber</h2>
      <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">Pencarian dibuka di situs sumber. Hasil tidak diambil atau disimpan oleh Guyub Ngapak.</p>
      <form onSubmit={search} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="sr-only" htmlFor="source-search-query">Kata kunci</label>
        <input id="source-search-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kata kunci atau judul" className="min-w-0 rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100" />
        <label className="sr-only" htmlFor="source-search-provider">Sumber</label>
        <select id="source-search-provider" value={source} onChange={(event) => setSource(event.target.value as LibrarySourceName)} className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100">
          {(Object.keys(librarySources) as LibrarySourceName[]).map((name) => <option key={name}>{name}</option>)}
        </select>
        <button type="submit" className="rounded-full bg-guyub-bambuDark px-5 py-2.5 font-body text-sm font-semibold text-white">Cari</button>
      </form>
      {error && <p role="alert" className="mt-3 font-body text-sm text-red-800 dark:text-red-300">{error}</p>}
    </section>
  );
}
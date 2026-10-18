'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface KabRow {
  kabupaten: string;
  bantuanSelesai: number;
  jamTerkonfirmasi: number;
  umkmTerbantu: number;
}

export function DampakKabupaten() {
  const [rows, setRows] = useState<KabRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/dampak/kabupaten')
      .then((response) => { if (active) setRows(response.data); })
      .catch(() => { if (active) setError('Dampak per kabupaten belum dapat dimuat.'); });
    return () => { active = false; };
  }, []);

  if (error) return <p role="alert" className="rounded-xl border border-red-800 bg-white p-5 font-body text-sm text-red-800 dark:border-red-400 dark:bg-stone-900 dark:text-red-300">{error}</p>;

  const maxJam = Math.max(1, ...rows.map((r) => r.jamTerkonfirmasi));

  return (
    <section aria-labelledby="kab-heading" className="mt-8">
      <h2 id="kab-heading" className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Dampak per kabupaten/kota</h2>
      <p className="mt-2 font-body text-xs text-stone-600 dark:text-stone-300">Data per kabupaten hanya menampilkan wilayah dengan minimal 3 data.</p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.kabupaten} className="rounded-lg border border-guyub-bambu/20 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
            <div className="flex items-center justify-between gap-3">
              <span className="font-body text-sm font-semibold text-guyub-bambuDark dark:text-stone-100">{r.kabupaten}</span>
              <span className="font-body text-xs tabular-nums text-stone-700 dark:text-stone-200">{r.jamTerkonfirmasi} jam</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
              <div className="h-full rounded-full bg-guyub-bambuDark dark:bg-guyub-gula" style={{ width: `${(r.jamTerkonfirmasi / maxJam) * 100}%` }} />
            </div>
            <p className="mt-2 font-body text-xs text-stone-600 dark:text-stone-300">
              Bantuan selesai: {r.bantuanSelesai} · UMKM terbantu: {r.umkmTerbantu}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

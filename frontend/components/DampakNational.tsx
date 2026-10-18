'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ImpactSummary {
  bantuanSelesai: number;
  jamTerkonfirmasi: number;
  jamMenungguKonfirmasi: number;
  portofolioTerbit: number;
  wasiatDibaca: number;
  kuisDiselesaikan: number;
  ratingRataRata: number;
  penggunaAktifPerMinggu: number;
  trenMingguan: {
    mingguMulai: string;
    bantuanSelesai: number;
    jamTerkonfirmasi: number;
    portofolioTerbit: number;
    kuisDiselesaikan: number;
    penggunaAktif: number;
  }[];
}

const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

export function DampakNational() {
  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/dampak/ringkasan')
      .then((response) => { if (active) setSummary(response.data); })
      .catch(() => { if (active) setError('Ringkasan dampak belum dapat dimuat.'); });
    return () => { active = false; };
  }, []);

  if (error) return <p role="alert" className="rounded-xl border border-red-800 bg-white p-5 font-body text-sm text-red-800 dark:border-red-400 dark:bg-stone-900 dark:text-red-300">{error}</p>;
  if (!summary) return <p className="font-body text-sm text-stone-700 dark:text-stone-200">Memuat ringkasan dampak…</p>;

  const indicators = [
    { label: 'Bantuan selesai', value: numberFormat.format(summary.bantuanSelesai) },
    { label: 'Jam kontribusi terkonfirmasi', value: `${numberFormat.format(summary.jamTerkonfirmasi)} jam` },
    { label: 'Portofolio terbit', value: numberFormat.format(summary.portofolioTerbit) },
    { label: 'Wasiat dibaca', value: numberFormat.format(summary.wasiatDibaca) },
    { label: 'Kuis diselesaikan', value: numberFormat.format(summary.kuisDiselesaikan) },
    { label: 'Rating rata-rata', value: numberFormat.format(summary.ratingRataRata) },
    { label: 'Pengguna aktif minggu ini', value: numberFormat.format(summary.penggunaAktifPerMinggu) },
  ];

  const trendFields: { key: keyof ImpactSummary['trenMingguan'][number]; label: string }[] = [
    { key: 'bantuanSelesai', label: 'Bantuan selesai' },
    { key: 'jamTerkonfirmasi', label: 'Jam terkonfirmasi' },
    { key: 'portofolioTerbit', label: 'Portofolio' },
    { key: 'kuisDiselesaikan', label: 'Kuis' },
    { key: 'penggunaAktif', label: 'Pengguna aktif' },
  ];
  const maxTrend = Math.max(1, ...summary.trenMingguan.flatMap((week) => trendFields.map((field) => Number(week[field.key]))));

  return (
    <main className="space-y-7 pb-8">
      <header className="border-b border-guyub-bambu/25 pb-5">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah dark:text-amber-300">Dampak nasional</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-guyub-bambuDark dark:text-stone-100">Dampak Guyub Ngapak</h1>
        <p className="mt-2 max-w-3xl font-body text-sm text-stone-700 dark:text-stone-200">Ringkasan kontribusi komunitas secara nasional. Tidak ada rincian berdasarkan kabupaten.</p>
      </header>

      <section aria-label="Indikator dampak" className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((indicator) => <article key={indicator.label} className="min-w-0 border-b border-guyub-bambu/20 py-5">
          <p className="font-body text-sm text-stone-700 dark:text-stone-200">{indicator.label}</p>
          <p className="mt-2 break-words font-display text-3xl font-semibold tabular-nums text-guyub-bambuDark dark:text-stone-100">{indicator.value}</p>
        </article>)}
        <article className="min-w-0 border-b border-guyub-gula py-5">
          <p className="font-body text-sm text-stone-700 dark:text-stone-200">Jam menunggu konfirmasi</p>
          <p className="mt-2 break-words font-display text-3xl font-semibold tabular-nums text-guyub-tanah dark:text-amber-300">{numberFormat.format(summary.jamMenungguKonfirmasi)} jam</p>
          <p className="mt-2 font-body text-xs text-stone-600 dark:text-stone-300">Tidak dijumlahkan ke total jam terkonfirmasi.</p>
        </article>
      </section>

      <p className="rounded-lg border-l-4 border-guyub-gula bg-white px-4 py-3 font-body text-sm text-stone-800 dark:bg-stone-900 dark:text-stone-100">
        Jam kontribusi hanya dihitung setelah dikonfirmasi oleh peminta bantuan.
      </p>

      <section aria-labelledby="impact-trend-heading" className="border-t border-guyub-bambu/25 pt-5">
        <h2 id="impact-trend-heading" className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Tren mingguan</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {summary.trenMingguan.map((week) => <li key={week.mingguMulai} className="min-w-0 rounded-lg border border-guyub-bambu/20 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
            <p className="font-body text-xs font-semibold text-stone-700 dark:text-stone-200">{new Date(`${week.mingguMulai}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
            <div className="mt-3 space-y-2">
              {trendFields.map((field) => {
                const value = Number(week[field.key]);
                return <div key={field.key} title={`${field.label}: ${numberFormat.format(value)}`}>
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"><div className="h-full rounded-full bg-guyub-bambuDark dark:bg-guyub-gula" style={{ width: `${Math.max(value > 0 ? 5 : 0, value / maxTrend * 100)}%` }} /></div>
                </div>;
              })}
            </div>
            <p className="mt-2 font-body text-xs tabular-nums text-stone-600 dark:text-stone-300">{numberFormat.format(week.bantuanSelesai)} bantuan · {numberFormat.format(week.jamTerkonfirmasi)} jam</p>
          </li>)}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {trendFields.map((field) => <li key={field.key} className="inline-flex items-center gap-2 font-body text-xs text-stone-700 dark:text-stone-200"><span className="h-2 w-2 rounded-full bg-guyub-bambuDark dark:bg-guyub-gula" />{field.label}</li>)}
        </ul>
      </section>
    </main>
  );
}
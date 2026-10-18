'use client';

export function PenggerakOnly() {
  return (
    <section className="mx-auto max-w-xl rounded-xl border border-guyub-gula bg-white p-7 dark:bg-stone-900">
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Akses fitur</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Fitur ini tidak tersedia untuk peran Pelajar.</h1>
      <p className="mt-3 font-body text-sm text-stone-700 dark:text-stone-200">
        UMKM Dibantu dan Guyub Acara hanya tersedia untuk Penggerak.
      </p>
    </section>
  );
}
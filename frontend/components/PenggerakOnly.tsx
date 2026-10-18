'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export function PenggerakOnly() {
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function changeRole() {
    setLoading(true);
    setError('');
    try {
      await api.patch('/users/me/profile', { role: 'PENGGERAK' });
      const response = await api.post('/auth/refresh');
      setSession(response.data.user, response.data.accessToken);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Peran gagal diubah. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-guyub-gula bg-white p-7 dark:bg-stone-900">
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Akses peran</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Fitur ini khusus Penggerak</h1>
      <p className="mt-3 font-body text-sm text-stone-700 dark:text-stone-200">
        Ubah peran akunmu ke Penggerak untuk menggunakan UMKM Dibantu dan Guyub Acara.
      </p>
      {error && <p role="alert" className="mt-4 font-body text-sm text-guyub-merahBata">{error}</p>}
      <button
        type="button"
        onClick={() => void changeRole()}
        disabled={loading}
        className="mt-5 rounded-full bg-guyub-bambuDark px-5 py-2.5 font-body text-sm font-semibold text-white transition hover:bg-guyub-bambu disabled:opacity-60"
      >
        {loading ? 'Mengubah peran…' : 'Ubah peran ke Penggerak'}
      </button>
    </section>
  );
}
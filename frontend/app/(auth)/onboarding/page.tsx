'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, type Role } from '@/lib/auth-store';

const pelajarFeatures = [
  'Wasiat Ngapak',
  'Peta Butuh Guyub',
  'Pustaka',
  'Tantangan literasi Jawa Tengah',
  'XP dan level',
];

const penggerakFeatures = [
  ...pelajarFeatures,
  'UMKM Dibantu',
  'Guyub Acara',
  'Verifikasi kebutuhan di peta',
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setSession = useAuthStore((state) => state.setSession);
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
    if (user?.onboardingDone) router.replace('/dashboard/peta');
  }, [isInitialized, user, router]);

  async function chooseRole(role: 'PELAJAR' | 'PENGGERAK') {
    setLoadingRole(role);
    setError('');
    try {
      await api.post('/users/onboarding', { role });
      const response = await api.post('/auth/refresh');
      setSession(response.data.user, response.data.accessToken);
      router.replace('/dashboard/peta');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Pilihan peran gagal disimpan. Coba lagi.');
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <main className="min-h-screen bg-guyub-krem px-5 py-10 dark:bg-stone-950 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah dark:text-amber-300">Guyub Ngapak</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-guyub-bambuDark dark:text-stone-100">Pilih peranmu</h1>
        <p className="mt-3 max-w-2xl font-body text-base text-stone-700 dark:text-stone-200">
          Peran menentukan fitur yang tersedia. Kamu bisa mengubahnya nanti dari fitur khusus Penggerak.
        </p>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-700 bg-white px-4 py-3 font-body text-sm text-red-800 dark:bg-stone-900 dark:text-red-300">{error}</p>}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RoleCard
            title="Pelajar"
            description="Belajar, membaca, dan ikut tantangan literasi Jawa Tengah."
            available={pelajarFeatures}
            unavailable={['UMKM Dibantu', 'Guyub Acara']}
            loading={loadingRole === 'PELAJAR'}
            disabled={loadingRole !== null}
            onChoose={() => void chooseRole('PELAJAR')}
          />
          <RoleCard
            title="Penggerak"
            description="Gunakan seluruh fitur untuk belajar dan menggerakkan kegiatan bersama."
            available={penggerakFeatures}
            unavailable={[]}
            loading={loadingRole === 'PENGGERAK'}
            disabled={loadingRole !== null}
            onChoose={() => void chooseRole('PENGGERAK')}
          />
        </div>
      </div>
    </main>
  );
}

function RoleCard({
  title,
  description,
  available,
  unavailable,
  loading,
  disabled,
  onChoose,
}: {
  title: string;
  description: string;
  available: string[];
  unavailable: string[];
  loading: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-guyub-gula bg-white p-6 dark:bg-stone-900">
      <h2 className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">{title}</h2>
      <p className="mt-2 font-body text-sm text-stone-700 dark:text-stone-200">{description}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-body text-sm font-semibold text-guyub-bambuDark dark:text-stone-100">Tersedia</h3>
          <ul className="mt-2 space-y-1.5 font-body text-sm text-stone-700 dark:text-stone-200">
            {available.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-body text-sm font-semibold text-guyub-bambuDark dark:text-stone-100">Belum tersedia</h3>
          <ul className="mt-2 space-y-1.5 font-body text-sm text-stone-600 dark:text-stone-300">
            {unavailable.length ? unavailable.map((feature) => <li key={feature}>{feature}</li>) : <li>Tidak ada</li>}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={onChoose}
        disabled={disabled}
        className="mt-6 rounded-full bg-guyub-bambuDark px-5 py-2.5 font-body text-sm font-semibold text-white transition hover:bg-guyub-bambu disabled:opacity-60"
      >
        {loading ? 'Menyimpan…' : `Pilih ${title}`}
      </button>
    </section>
  );
}
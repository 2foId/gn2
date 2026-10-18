'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, type Role } from '@/lib/auth-store';
import { emptyProfileEditValues, ProfileEditForm, type ProfileEditValues } from '@/components/ProfileEditForm';

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

const bidangPilihan = ['Kesehatan', 'Pendidikan', 'Ekonomi', 'Lingkungan', 'Sosial', 'Teknologi', 'Budaya'];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setSession = useAuthStore((state) => state.setSession);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ageInput, setAgeInput] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [bidang, setBidang] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
    if (user?.onboardingDone) router.replace('/dashboard/peta');
  }, [isInitialized, user, router]);

  async function saveAge(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const parsedAge = Number(ageInput);
    if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 30) {
      setError('Umur harus antara 13 dan 30 tahun.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/users/onboarding/age', { age: parsedAge });
      setAge(response.data.age);
      setRole(response.data.role);
      setStep(2);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Umur gagal disimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding(values: ProfileEditValues) {
    if (!role || age === null) return;
    if (role === 'PENGGERAK' && !bidang) {
      setError('Pilih bidang sebelum menyelesaikan onboarding.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { phone, ...profileFields } = values;
      await api.patch('/users/me/profile', {
        ...profileFields,
        ...(role === 'PENGGERAK' ? { phone: phone ? `+62${phone.replace(/\D/g, '')}` : null } : {}),
        tanggalLahir: values.tanggalLahir || undefined,
        ketersediaan: values.ketersediaan || undefined,
      });
      if (role === 'PENGGERAK') await api.post('/users/onboarding/bidang', { bidang });
      await api.post('/users/onboarding/selesai');
      const response = await api.post('/auth/refresh');
      setSession(response.data.user, response.data.accessToken);
      router.replace('/dashboard/peta');
    } catch (requestError: any) {
      const message = requestError.response?.data?.message;
      setError(Array.isArray(message) ? message.join('. ') : message ?? 'Onboarding gagal diselesaikan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const initialProfile = {
    ...emptyProfileEditValues(user?.nama ?? ''),
    bio: user?.bio ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    keahlian: user?.keahlian ?? [],
    ketersediaan: user?.ketersediaan ?? '',
    tanggalLahir: user?.tanggalLahir ? new Date(user.tanggalLahir).toISOString().slice(0, 10) : '',
  };

  return (
    <main className="flex min-h-screen flex-col bg-guyub-krem px-5 py-8 dark:bg-stone-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center">
        <div className="w-full">
        {step > 1 && <button type="button" onClick={() => { setError(''); setStep(step === 3 ? 2 : 1); }} aria-label="Kembali ke langkah sebelumnya" className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-guyub-bambuDark bg-white text-guyub-bambuDark transition hover:bg-guyub-krem dark:border-stone-400 dark:bg-stone-900 dark:text-stone-100">
          <img src="/icons/panah-kiri.svg" alt="" aria-hidden="true" className="h-5 w-5 dark:brightness-0 dark:invert" />
        </button>}
        <p className="text-center font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah dark:text-amber-300">Guyub Ngapak</p>
        <h1 className="mt-2 text-center font-display text-3xl font-semibold text-guyub-bambuDark dark:text-stone-100">{step === 1 ? 'Berapa umurmu?' : step === 2 ? 'Peranmu di Guyub Ngapak' : 'Lengkapi profilmu'}</h1>
        {error && step !== 3 && <p role="alert" className="mt-5 rounded-lg border border-red-700 bg-white px-4 py-3 font-body text-sm text-red-800 dark:bg-stone-900 dark:text-red-300">{error}</p>}

        {step === 1 && <form onSubmit={saveAge} className="mx-auto mt-8 max-w-sm space-y-4">
          <label htmlFor="onboarding-age" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Umur (13–30 tahun)</label>
          <input id="onboarding-age" type="number" inputMode="numeric" min={13} max={30} step={1} required value={ageInput} onChange={(event) => setAgeInput(event.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100" />
          <button type="submit" disabled={loading} className="rounded-full bg-guyub-bambuDark px-6 py-2.5 font-body text-sm font-semibold text-white hover:bg-guyub-bambu disabled:opacity-60">{loading ? 'Menyimpan…' : 'Lanjut'}</button>
        </form>}

        {step === 2 && role && age !== null && <div className="mx-auto mt-8 max-w-xl">
          <RoleCard
            title={role === 'PELAJAR' ? 'Pelajar' : 'Penggerak'}
            description={role === 'PELAJAR' ? 'Belajar, membaca, dan ikut tantangan literasi Jawa Tengah.' : 'Gunakan seluruh fitur untuk belajar dan menggerakkan kegiatan bersama.'}
            available={role === 'PELAJAR' ? pelajarFeatures : penggerakFeatures}
            unavailable={role === 'PELAJAR' ? ['UMKM Dibantu', 'Guyub Acara'] : []}
            loading={loading}
            disabled={loading}
            onChoose={() => { setError(''); setStep(3); }}
          />
        </div>}

        {role && <div className={`mx-auto mt-6 w-full max-w-2xl ${step === 3 ? '' : 'hidden'}`} aria-hidden={step !== 3}>
          <ProfileEditForm
            key={`${user?.id}-${role}`}
            initialValues={initialProfile}
            role={role}
            onSubmit={finishOnboarding}
            submitLabel={loading ? 'Menyelesaikan…' : 'Selesai'}
            error={error}
            onAvatarUploaded={(avatarUrl) => updateUser({ avatarUrl })}
          >
            {role === 'PENGGERAK' && <div>
              <label htmlFor="onboarding-bidang" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Bidang Penggerak <span className="text-guyub-merahBata">Wajib</span></label>
              <select id="onboarding-bidang" required value={bidang} onChange={(event) => setBidang(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
                <option value="">Pilih bidang</option>
                {bidangPilihan.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>}
          </ProfileEditForm>
        </div>}
        </div>
      </div>
      <nav aria-label="Langkah onboarding" className="mx-auto mt-10 flex w-full max-w-5xl items-center justify-center gap-3 pb-2">
        {[1, 2, 3].map((stepNumber) => <span key={stepNumber} aria-label={`Langkah ${stepNumber}${step === stepNumber ? ', aktif' : ''}`} className={`h-2.5 w-2.5 rounded-full ${step === stepNumber ? 'bg-guyub-bambuDark dark:bg-guyub-gula' : 'border border-guyub-bambuDark bg-transparent dark:border-stone-400'}`} />)}
      </nav>
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
          <h3 className="font-body text-sm font-semibold text-guyub-bambuDark dark:text-stone-100">Tidak tersedia</h3>
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
        {loading ? 'Menyimpan…' : 'Lanjut'}
      </button>
    </section>
  );
}
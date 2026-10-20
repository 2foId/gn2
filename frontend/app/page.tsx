'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const fitur = [
  {
    nama: 'Peta Butuh Guyub',
    deskripsi: 'Lihat kebutuhan warga secara real-time di peta dan nyatakan kesediaan membantu.',
  },
  {
    nama: 'Wasiat Ngapak',
    deskripsi: 'Simak resep, kerajinan, dan petuah hidup dari warga senior Purbalingga.',
  },
  {
    nama: 'UMKM Dibantu',
    deskripsi: 'Bantu UMKM lokal naik kelas dengan keterampilan yang kamu punya.',
  },
  {
    nama: 'Guyub Acara',
    deskripsi: 'Koordinasi kerja bakti, ronda, dan sedekah bumi jadi lebih rapi.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized) {
      setLoading(true);
      return;
    }
    setLoading(false);
    if (!user) return;
    if (!user.onboardingDone) {
      router.replace('/onboarding');
    } else {
      router.replace('/dashboard/peta');
    }
  }, [user, isInitialized, router]);

  if (loading) {
    return (
      <main className="landing-page relative min-h-screen overflow-hidden bg-guyub-krem">
        <div className="flex min-h-screen items-center justify-center">
          <p className="font-body text-sm text-stone-600 dark:text-stone-300">Memuat sesi…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="landing-page relative min-h-screen overflow-hidden bg-guyub-krem">
      {/* Layer gambar terpisah dari konten: ukuran diperkecil (bukan bg-cover/fit-to-screen)
          dan diberi fade melingkar ke semua sisi lewat CSS mask-image, sehingga tepi
          gambar melebur ke warna background krem, bukan cuma gradient atas-bawah. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: '80%',
          backgroundPosition: 'center 72%',
          WebkitMaskImage:
            'radial-gradient(ellipse 55% 50% at center, black 35%, transparent 75%)',
          maskImage:
            'radial-gradient(ellipse 55% 50% at center, black 35%, transparent 75%)',
        }}
      />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="flex items-center gap-2 font-display text-xl font-semibold text-guyub-bambuDark">
            Guyub Ngapak
            <img src="/logo.png" alt="Logo" className="h-6 w-6" />
          </span>
          <nav className="flex gap-3">
            <Link
              href="/login"
              className="rounded-full border border-guyub-bambuDark px-5 py-2 text-sm font-medium text-guyub-bambuDark transition hover:scale-105 hover:bg-guyub-bambuDark hover:text-white"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-guyub-bambuDark px-5 py-2 text-sm font-medium text-white transition hover:scale-105 hover:bg-guyub-bambu"
            >
              Daftar
            </Link>
          </nav>
        </header>

        <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center">
          <p className="font-body text-sm uppercase tracking-widest text-guyub-tanah">
            Kearifan lokal Purbalingga
          </p>
          <h1 className="mt-4 font-hero text-4xl leading-tight text-guyub-bambuDark md:text-6xl">
            Alus settinge. Kepenak ngodene.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-body text-lg text-stone-700">
            Satu tempat untuk memetakan kebutuhan warga, berbagi wasiat leluhur,
            membantu UMKM tetangga, dan mengoordinasi kerja bakti — dengan cara
            ngapak yang guyub.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-guyub-gula px-7 py-3 text-lg font-body font-semibold text-guyub-bambuDark shadow-sm transition duration-200 hover:scale-105 hover:brightness-95"
            >
              Mulai Sekarang
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-5 md:grid-cols-3">
            {fitur.map((f) => (
              <div
                key={f.nama}
                className="rounded-2xl border-2 border-yellow-400 bg-white p-6 shadow-sm"
              >
                <h3 className="font-display text-lg font-semibold text-guyub-bambuDark">
                  {f.nama}
                </h3>
                <p className="text-[19px]">{f.deskripsi}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

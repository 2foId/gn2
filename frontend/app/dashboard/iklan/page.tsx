'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

interface MyIklanItem {
  id: string;
  judul: string;
  deskripsi: string;
  bidang: string;
  kabupatenKota: string;
  fotoUrl: string | null;
  status: string;
  jumlahRevisi: number;
  mulaiAt: string | null;
  berakhirAt: string | null;
  dibuatAt: string;
}

export default function MyIklanPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<MyIklanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/iklan/saya');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const allowed = user?.role === 'PENGGERAK' || user?.role === 'ADMIN';
    if (!allowed) {
      router.push('/dashboard/peta');
      return;
    }
    load();
  }, [user, router, load]);

  if (!user || (user.role !== 'PENGGERAK' && user.role !== 'ADMIN')) return null;

  const active = list.some((i) => i.status === 'MENUNGGU' || i.status === 'DISETUJUI');

  return (
    <div className="min-h-screen bg-guyub-krem">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">Iklan Saya</h1>
          <Link href="/dashboard/peta" className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 hover:bg-stone-100">Kembali ke Dashboard</Link>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 mb-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-guyub-bambuDark">Tentang Sorotan</h2>
          <p className="mt-2 font-body text-sm text-stone-600">
            Sorotan adalah iklan kartu penggerak yang tayang di peta dan halaman dashboard. Biaya paket:
            <strong className="font-medium text-guyub-bambuDark">1000 currency</strong> untuk durasi
            <strong className="font-medium text-guyub-bambuDark">3 hari</strong> dengan kuota 100 tayangan per hari.
            Setiap pengguna hanya boleh memiliki <strong className="font-medium text-guyub-bambuDark">1 iklan aktif</strong>
            sekaligus (DRAFT, MENUNGGU, atau DISETUJUI).
          </p>
          {active && (
            <p className="mt-3 font-body text-sm text-guyub-merahBata">
              Anda sudah memiliki iklan aktif. Selesaikan, tarik, atau tunggu iklan berakhir sebelum membuat baru.
            </p>
          )}
        </section>

        <div className="space-y-4">
          {loading ? (
            <p className="font-body text-sm text-stone-500">Memuat…</p>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border-2 border-stone-200 bg-white p-8 text-center shadow-sm">
              <p className="font-body text-sm text-stone-500 mb-4">Belum ada iklan.</p>
              <Link
                href="/dashboard/iklan/buat"
                className="rounded-full bg-guyub-bambuDark px-6 py-2.5 font-body text-sm font-semibold text-white hover:bg-guyub-bambu"
              >
                Buat iklan pertama
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-guyub-bambuDark">Daftar Iklan</h2>
              <div className="space-y-3">
                {list.map((iklan) => (
                  <div key={iklan.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-body text-xs font-bold px-2 py-0.5 rounded ${iklan.status === 'DISETUJUI' ? 'bg-guyub-gula/10 text-guyub-bambuDark' : iklan.status === 'MENUNGGU' ? 'bg-stone-100 text-stone-600' : 'bg-stone-100 text-stone-500'}`}>
                            {iklan.status === 'MENUNGGU' ? 'Menunggu' : iklan.status === 'DISETUJUI' ? 'Disetujui' : iklan.status === 'DITOLAK' ? 'Ditolak' : iklan.status === 'DITARIK' ? 'Ditarik' : iklan.status === 'BERAKHIR' ? 'Berakhir' : 'Draf'}
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-semibold text-guyub-bambuDark line-clamp-1">{iklan.judul}</h3>
                        <p className="mt-1 font-body text-xs text-stone-600 line-clamp-2">{iklan.deskripsi}</p>
                        <p className="mt-1 font-body text-xs text-stone-500">{iklan.bidang} · {iklan.kabupatenKota}</p>
                        {iklan.mulaiAt && iklan.berakhirAt && (
                          <p className="mt-1 font-body text-xs text-stone-500">
                            Tayang {new Date(iklan.mulaiAt).toLocaleDateString('id-ID')} s.d. {new Date(iklan.berakhirAt).toLocaleDateString('id-ID')}
                          </p>
                        )}
                        {iklan.jumlahRevisi > 0 && (
                          <p className="mt-1 font-body text-xs text-stone-500">Revisi: {iklan.jumlahRevisi}x</p>
                        )}
                      </div>
                      <div className="ml-3 flex flex-col gap-1">
                        <Link
                          href={`/dashboard/umkm/portfolio/${iklan.id}`}
                          className="w-full rounded-full border border-stone-300 px-3 py-1.5 font-body text-xs text-stone-700 hover:bg-stone-50 text-center"
                        >
                          Lihat
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

interface AdminIklanItem {
  id: string;
  judul: string;
  deskripsi: string;
  bidang: string;
  kabupatenKota: string;
  fotoUrl: string | null;
  status: string;
  pemilik: {
    id: string;
    nama: string;
    phone: string | null;
    kabupatenKota: string | null;
    dusun: string | null;
  };
  moderasi: Array<{
    id: string;
    keputusan: string;
    alasan: string | null;
    createdAt: string;
    admin: { id: string; nama: string };
  }>;
  dibuatAt: string;
  diperbaruiAt: string;
}

export default function AdminIklanPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<AdminIklanItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBidang, setFilterBidang] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const bidangList = [
    'Kesehatan', 'Pendidikan', 'Ekonomi', 'Lingkungan', 'Sosial', 'Teknologi', 'Budaya',
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/admin/iklan?${params.toString()}`);
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    load();
  }, [user, router, load]);

  if (user?.role !== 'ADMIN') return null;

  const filtered = list.filter((i) => {
    if (filterBidang && i.bidang !== filterBidang) return false;
    if (search && !i.judul.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-guyub-krem">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-semibold text-guyub-bambuDark">Moderasi Iklan</h1>
          <Link href="/dashboard/peta" className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 hover:bg-stone-100">Kembali ke Dashboard</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="font-body text-xs text-stone-500 uppercase tracking-wide">Status</p>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm focus:border-guyub-bambuDark"
            >
              <option value="">Semua</option>
              <option value="DRAFT">Draf</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="DITARIK">Ditarik</option>
              <option value="BERAKHIR">Berakhir</option>
            </select>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="font-body text-xs text-stone-500 uppercase tracking-wide">Bidang</p>
            <select
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm focus:border-guyub-bambuDark"
            >
              <option value="">Semua</option>
              {bidangList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col">
            <p className="font-body text-xs text-stone-500 uppercase tracking-wide mb-1">Pencarian Judul</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm focus:border-guyub-bambuDark"
              placeholder="Cari judul iklan…"
            />
          </div>
        </div>
        {loading ? (
          <p className="font-body text-sm text-stone-500">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="font-body text-sm text-stone-500">Tidak ada iklan.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((iklan) => (
              <div key={iklan.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-body text-xs font-bold px-2 py-0.5 rounded ${iklan.status === 'DISETUJUI' ? 'bg-guyub-gula/10 text-guyub-bambuDark' : iklan.status === 'MENUNGGU' ? 'bg-stone-100 text-stone-600' : 'bg-stone-100 text-stone-500'}`}>
                        {iklan.status === 'MENUNGGU' ? 'Menunggu' : iklan.status === 'DISETUJUI' ? 'Disetujui' : iklan.status === 'DITOLAK' ? 'Ditolak' : iklan.status === 'DITARIK' ? 'Ditarik' : iklan.status === 'BERAKHIR' ? 'Berakhir' : 'Draf'}
                      </span>
                      {iklan.fotoUrl && (
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider">Foto</span>
                      )}
                    </div>
                    <h3 className="font-display text-sm font-semibold text-guyub-bambuDark line-clamp-1">{iklan.judul}</h3>
                    <p className="mt-1 font-body text-xs text-stone-600 line-clamp-2">{iklan.deskripsi}</p>
                    <p className="mt-1 font-body text-xs text-stone-500">{iklan.bidang} · {iklan.kabupatenKota}</p>
                    <p className="mt-1 font-body text-xs text-stone-500">{iklan.pemilik.nama}</p>
                    {iklan.pemilik.phone && <p className="font-body text-xs text-stone-500">{iklan.pemilik.phone}</p>}
                    <p className="mt-1 font-body text-xs text-stone-500">Dibuat {new Date(iklan.dibuatAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="ml-3 flex flex-col gap-1">
                    <Link
                      href={`/admin/iklan/${iklan.id}`}
                      className="w-full rounded-full border border-stone-300 px-3 py-1.5 font-body text-xs text-stone-700 hover:bg-stone-50 text-center"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
                {iklan.moderasi.length > 0 && (
                  <div className="mt-3 border-t border-stone-100 pt-3 space-y-2">
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-stone-500">Riwayat Moderasi</p>
                    {iklan.moderasi.map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <span className="font-body text-xs text-stone-500">{m.admin.nama}</span>
                        <span className="font-body text-xs font-medium">{m.keputusan}</span>
                        {m.alasan && <span className="font-body text-xs text-stone-500">{m.alasan}</span>}
                        <span className="font-body text-xs text-stone-400">{new Date(m.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

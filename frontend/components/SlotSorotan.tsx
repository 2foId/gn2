'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface SorotanIklan {
  id: string;
  judul: string;
  deskripsi: string;
  bidang: string;
  kabupatenKota: string;
  fotoUrl: string | null;
  pemilik: {
    id: string;
    nama: string;
    kabupatenKota: string | null;
  };
  kuotaHarian: number;
  tayangHariIni: number;
}

export function SlotSorotan() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const [iklan, setIklan] = useState<SorotanIklan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAllowed = role === 'PENGGERAK' || role === 'ADMIN';

  useEffect(() => {
    if (!isAllowed) {
      setIklan(null);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ data: SorotanIklan } | SorotanIklan>('/iklan/tayang');
        const data = res.data;
        const iklanData = (data as any).data ?? data;
        if (active && iklanData) {
          setIklan(iklanData);
          try {
            await api.post(`/iklan/tayang/${iklanData.id}/tayang`);
          } catch {
            // gagal catat tayangan tidak mengganggu tampilan
          }
        }
      } catch (err: any) {
        if (active) {
          if (err.response?.status === 403) {
            setIklan(null);
          } else {
            setError('Gagal memuat sorotan.');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [isAllowed]);

  function handleKlik() {
    if (!iklan) return;
    api.post(`/iklan/tayang/${iklan.id}/klik`).catch(() => {});
  }

  if (!isAllowed || (!iklan && !loading && !error)) return null;

  return (
    <div className="w-[320px] rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-guyub-krem">
        <span className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-bambuDark">Sorotan</span>
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center bg-stone-100">
          <span className="font-body text-sm text-stone-500">Memuat…</span>
        </div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center bg-stone-100">
          <span className="font-body text-sm text-guyub-merahBata">{error}</span>
        </div>
      ) : iklan ? (
        <div className="p-3" onClick={handleKlik} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleKlik(); }}>
          {iklan.fotoUrl && (
            <div className="aspect-[16/9] overflow-hidden rounded-lg mb-2 bg-stone-100">
              <img src={iklan.fotoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h3 className="font-display text-sm font-semibold text-guyub-bambuDark line-clamp-1">{iklan.judul}</h3>
          <p className="mt-1 font-body text-xs text-stone-600 line-clamp-2">{iklan.deskripsi}</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="font-body text-xs text-stone-500">{iklan.pemilik.nama}</span>
            <span className="font-body text-xs text-stone-400">·</span>
            <span className="font-body text-xs text-stone-500">{iklan.kabupatenKota ?? '-'}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

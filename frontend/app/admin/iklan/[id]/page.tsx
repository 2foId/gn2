'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

interface AdminIklanDetail {
  id: string;
  judul: string;
  deskripsi: string;
  bidang: string;
  kabupatenKota: string;
  fotoUrl: string | null;
  status: string;
  alasanTolak: string | null;
  catatanRevisi: string | null;
  jumlahRevisi: number;
  mulaiAt: string | null;
  berakhirAt: string | null;
  kuotaHarian: number;
  dibuatAt: string;
  diperbaruiAt: string;
  pemilik: {
    id: string;
    nama: string;
    phone: string | null;
    kabupatenKota: string | null;
    dusun: string | null;
    role: string;
  };
  moderasi: Array<{
    id: string;
    keputusan: string;
    alasan: string | null;
    createdAt: string;
    admin: { id: string; nama: string };
  }>;
  transaksi: Array<{
    id: string;
    jumlah: number;
    tipe: string;
    createdAt: string;
  }>;
  tayangan: Array<{
    id: string;
    tanggal: string;
    tayang: number;
    klik: number;
  }>;
}

export default function AdminIklanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [iklan, setIklan] = useState<AdminIklanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewTheme, setPreviewTheme] = useState<'LIGHT' | 'DARK'>('LIGHT');
  const [decision, setDecision] = useState<'SETUJUI' | 'TOLAK' | 'REVISI' | 'TARIK' | null>(null);
  const [reason, setReason] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    load();
  }, [user, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/iklan/${params.id}`);
      setIklan(res.data);
    } catch {
      router.push('/admin/iklan');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') return null;
  if (loading) return <p className="font-body text-sm text-stone-500">Memuat…</p>;
  if (!iklan) return null;

  const aktif = iklan.status === 'MENUNGGU' || iklan.status === 'DISETUJUI';
  const canDecide = iklan.status === 'MENUNGGU' || iklan.status === 'REVISI' || iklan.status === 'DISETUJUI';

  async function submitKeputusan() {
    if (!decision) return;
    if (decision === 'TOLAK' && !reason.trim()) {
      setMessage('Alasan wajib diisi untuk penolakan.');
      return;
    }
    if (decision === 'REVISI' && !revisionNote.trim()) {
      setMessage('Catatan revisi wajib diisi.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      if (!iklan) return;
      const iklanId = iklan.id;
      const payload: any = { keputusan: decision };
      if (decision === 'TOLAK') payload.alasan = reason.trim();
      if (decision === 'REVISI') payload.catatanRevisi = revisionNote.trim();
      await api.post(`/admin/iklan/${iklanId}/keputusan`, payload);
      setMessage('Keputusan disimpan.');
      setTimeout(() => load(), 800);
    } catch (err: any) {
      const m = err.response?.data?.message;
      setMessage(Array.isArray(m) ? m.join('. ') : m ?? 'Gagal menyimpan keputusan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-guyub-krem">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/iklan" className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 hover:bg-stone-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Kembali
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-guyub-krem">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-bambuDark">Sorotan</span>
              </div>
              <div className="p-4">
                {iklan.fotoUrl && (
                  <div className="aspect-[16/9] overflow-hidden rounded-lg mb-2 bg-stone-100">
                    <img src={iklan.fotoUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className={`font-display text-sm font-semibold line-clamp-1 ${previewTheme === 'DARK' ? 'text-white' : 'text-guyub-bambuDark'}`}>{iklan.judul}</h3>
                <p className={`mt-1 font-body text-xs line-clamp-2 ${previewTheme === 'DARK' ? 'text-stone-300' : 'text-stone-600'}`}>{iklan.deskripsi}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className={`font-body text-xs ${previewTheme === 'DARK' ? 'text-stone-400' : 'text-stone-500'}`}>{iklan.pemilik.nama}</span>
                  <span className={`font-body text-xs ${previewTheme === 'DARK' ? 'text-stone-500' : 'text-stone-400'}`}>·</span>
                  <span className={`font-body text-xs ${previewTheme === 'DARK' ? 'text-stone-400' : 'text-stone-500'}`}>{iklan.kabupatenKota}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Status</p>
              <p className="font-body text-sm text-stone-700">
                {iklan.status === 'MENUNGGU' ? 'Menunggu Persetujuan' : iklan.status === 'DISETUJUI' ? 'Disetujui' : iklan.status === 'DITOLAK' ? 'Ditolak' : iklan.status === 'DITARIK' ? 'Ditarik' : iklan.status === 'BERAKHIR' ? 'Berakhir' : 'Draf'}
              </p>
              {iklan.jumlahRevisi > 0 && <p className="mt-1 font-body text-xs text-stone-500">Jumlah Revisi: {iklan.jumlahRevisi}</p>}
              {iklan.mulaiAt && iklan.berakhirAt && (
                <p className="mt-1 font-body text-xs text-stone-500">Tayang {new Date(iklan.mulaiAt).toLocaleDateString('id-ID')} s.d. {new Date(iklan.berakhirAt).toLocaleDateString('id-ID')}</p>
              )}
              {iklan.alasanTolak && <p className="mt-1 font-body text-xs text-guyub-merahBata">Alasan Tolak: {iklan.alasanTolak}</p>}
              {iklan.catatanRevisi && <p className="mt-1 font-body text-xs text-stone-600">Catatan Revisi: {iklan.catatanRevisi}</p>}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Data Pemilik</p>
              <p className="font-body text-sm text-stone-700">{iklan.pemilik.nama}</p>
              <p className="mt-1 font-body text-xs text-stone-500">{iklan.pemilik.role}</p>
              {iklan.pemilik.phone && <p className="mt-1 font-body text-xs text-stone-600">WhatsApp: {iklan.pemilik.phone}</p>}
              {iklan.pemilik.kabupatenKota && <p className="mt-1 font-body text-xs text-stone-600">{iklan.pemilik.kabupatenKota}</p>}
              {iklan.pemilik.dusun && <p className="mt-1 font-body text-xs text-stone-600">{iklan.pemilik.dusun}</p>}
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Riwayat Moderasi</p>
              {iklan.moderasi.length === 0 && (
                <p className="font-body text-sm text-stone-500">Belum ada riwayat.</p>
              )}
              {iklan.moderasi.map((m) => (
                <div key={m.id} className="mt-3 rounded-lg border border-stone-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-xs font-semibold text-stone-700">{m.admin.nama}</span>
                    <span className={`font-body text-xs font-bold px-2 py-0.5 rounded ${m.keputusan === 'SETUJUI' ? 'bg-guyub-gula/10 text-guyub-bambuDark' : 'bg-stone-100 text-stone-500'}`}>{m.keputusan}</span>
                  </div>
                  {m.alasan && <p className="font-body text-xs text-stone-600">{m.alasan}</p>}
                  <p className="mt-1 font-body text-xs text-stone-400">{new Date(m.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Riwayat Transaksi</p>
              {iklan.transaksi.length === 0 && (
                <p className="font-body text-sm text-stone-500">Belum ada transaksi.</p>
              )}
              {iklan.transaksi.map((t) => (
                <div key={t.id} className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-body text-stone-600">{t.tipe === 'BELI' ? 'Pembelian' : 'Pengembalian'}</span>
                  <span className="font-body text-stone-700">{t.tipe === 'BELI' ? '-' : '+'}{t.jumlah}</span>
                  <span className="font-body text-stone-400">{new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Tayangan 7 Hari Terakhir</p>
              {iklan.tayangan.length === 0 && (
                <p className="font-body text-sm text-stone-500">Belum ada tayangan.</p>
              )}
              {iklan.tayangan.map((t) => (
                <div key={t.id} className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-body text-stone-600">{new Date(t.tanggal).toLocaleDateString('id-ID')}</span>
                  <span className="font-body text-stone-700">Tayang {t.tayang} · Klik {t.klik}</span>
                </div>
              ))}
            </div>
            {canDecide && (
              <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Keputusan Moderasi</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDecision('SETUJUI'); setMessage(null); }}
                    disabled={submitting || !aktif}
                    className={`flex-1 rounded-full px-3 py-2 font-body text-xs font-medium transition ${!aktif || decision === 'SETUJUI' || submitting ? 'bg-guyub-gula text-guyub-bambuDark' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDecision('TOLAK'); setMessage(null); }}
                    disabled={submitting || !aktif}
                    className={`flex-1 rounded-full px-3 py-2 font-body text-xs font-medium transition ${!aktif || decision === 'TOLAK' || submitting ? 'bg-guyub-merahBata text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                  >
                    Tolak
                  </button>
                </div>
                {(decision === 'TOLAK' || decision === 'REVISI') && (
                  <div className="space-y-2">
                    <label className="font-body text-xs text-stone-600 block">{decision === 'TOLAK' ? 'Alasan Penolakan' : 'Catatan Revisi'}</label>
                    <textarea
                      value={decision === 'TOLAK' ? reason : revisionNote}
                      onChange={(e) => { if (decision === 'TOLAK') setReason(e.target.value); else setRevisionNote(e.target.value); }}
                      rows={2}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm focus:border-guyub-bambuDark"
                      placeholder={decision === 'TOLAK' ? 'Masukkan alasan penolakan…' : 'Masukkan catatan revisi…'}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={submitKeputusan}
                  disabled={submitting || !decision || (decision === 'TOLAK' && !reason.trim()) || (decision === 'REVISI' && !revisionNote.trim())}
                  className="w-full rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Memproses…' : 'Simpan Keputusan'}
                </button>
                {message && <p className="mt-2 font-body text-sm text-guyub-bambuDark">{message}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

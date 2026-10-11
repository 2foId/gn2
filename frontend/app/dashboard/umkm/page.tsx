'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserIdentity } from '@/components/UserIdentity';

interface UmkmItem {
  id: string;
  namaUsaha: string;
  kebutuhan: string;
  deskripsi: string;
  status: string;
  pemilikId: string;
  pemilik: { id: string; nama: string; avatarUrl?: string | null };
  responses?: { id: string; pesan: string; penolong: { id: string; nama: string; avatarUrl?: string | null } }[];
  _count?: { responses: number };
}

export default function UmkmPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<UmkmItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pesan, setPesan] = useState('');
  const [responError, setResponError] = useState<string | null>(null);
  const [deleteUmkmId, setDeleteUmkmId] = useState<string | null>(null);
  const [form, setForm] = useState({ namaUsaha: '', kebutuhan: '', deskripsi: '' });

  const loadData = useCallback(async () => {
    const res = await api.get('/umkm');
    setItems(res.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/umkm', form);
    setShowForm(false);
    setForm({ namaUsaha: '', kebutuhan: '', deskripsi: '' });
    loadData();
  }

  async function toggleExpand(item: UmkmItem) {
    if (expanded === item.id) {
      setExpanded(null);
      return;
    }
    const res = await api.get(`/umkm/${item.id}`);
    setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)));
    setExpanded(item.id);
  }

  async function handleRespon(id: string) {
    if (!pesan.trim()) return;
    setResponError(null);
    try {
      await api.post(`/umkm/${id}/respon`, { pesan });
      setPesan('');
      const res = await api.get(`/umkm/${id}`);
      setItems((prev) => prev.map((i) => (i.id === id ? res.data : i)));
    } catch (err: any) {
      setResponError(err.response?.data?.message ?? 'Gagal mengirim respon.');
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    await api.patch(`/umkm/${id}/status`, { status });
    loadData();
  }

  async function confirmDeleteUmkm() {
    if (!deleteUmkmId) return;
    try {
      await api.delete(`/umkm/${deleteUmkmId}`);
      setDeleteUmkmId(null);
      loadData();
    } catch (err: any) {
      setDeleteUmkmId(null);
      throw err;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">UMKM Dibantu</h1>
          <p className="font-body text-sm text-stone-600">
            Warga berketerampilan membantu UMKM lokal naik kelas.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm font-medium text-white hover:bg-guyub-bambu"
        >
          {showForm ? 'Batal' : '+ Pasang Kebutuhan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Nama Usaha</label>
            <input
              required
              value={form.namaUsaha}
              onChange={(e) => setForm({ ...form, namaUsaha: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
            />
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">
              Kebutuhan (mis. "butuh bantuan foto produk")
            </label>
            <input
              required
              value={form.kebutuhan}
              onChange={(e) => setForm({ ...form, kebutuhan: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
            />
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Deskripsi</label>
            <textarea
              required
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-guyub-gula px-6 py-2 font-body font-medium text-guyub-bambuDark hover:brightness-95"
          >
            Pasang Kebutuhan
          </button>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {items.slice().sort((a, b) => (a.status === 'SELESAI' ? 1 : 0) - (b.status === 'SELESAI' ? 1 : 0)).map((item) => (
          <div key={item.id} className={`rounded-xl bg-white p-5 shadow-sm${item.status === 'SELESAI' ? ' guyub-stripes' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold text-guyub-bambuDark">{item.namaUsaha}</p>
                <UserIdentity user={item.pemilik} />
                <p className="font-body text-sm font-medium text-guyub-tanah">{item.kebutuhan}</p>
                <p className="mt-1 font-body text-sm text-stone-600">{item.deskripsi}</p>
              </div>
              <span className={`relative z-10 shrink-0 rounded-full px-3 py-1 font-body text-xs font-medium ${item.status === 'DIBUKA' ? 'bg-guyub-krem text-guyub-bambuDark' : 'bg-guyub-gula text-guyub-bambuDark'}`}>
                {item.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => toggleExpand(item)}
                className="font-body text-sm font-medium text-guyub-bambuDark underline"
              >
                {expanded === item.id ? 'Sembunyikan' : `Lihat respon (${item._count?.responses ?? 0})`}
              </button>
              {user?.id === item.pemilikId && item.status !== 'SELESAI' && (
                <button
                  onClick={() => handleUpdateStatus(item.id, 'SELESAI')}
                  className="rounded-full bg-guyub-gula px-4 py-1.5 font-body text-sm font-medium text-guyub-bambuDark hover:brightness-95"
                >
                  Tandai Selesai
                </button>
              )}
              {(user?.id === item.pemilikId || user?.role === 'ADMIN' || user?.role === 'RELAWAN') && (
                <button
                  type="button"
                  onClick={() => setDeleteUmkmId(item.id)}
                  className="inline-flex items-center gap-1 font-body text-sm text-guyub-merahBata underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                  Hapus
                </button>
              )}
            </div>

            {expanded === item.id && (
              <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                {item.responses?.map((r) => (
                  <div key={r.id} className="rounded-lg bg-guyub-krem p-3">
                    <UserIdentity user={r.penolong} />
                    <p className="font-body text-sm text-stone-600">{r.pesan}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Tawarkan bantuan Anda…"
                    className="flex-1 rounded-lg border border-stone-300 px-4 py-2 font-body text-sm"
                  />
                  <button
                    onClick={() => handleRespon(item.id)}
                    className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm text-white hover:bg-guyub-bambu"
                  >
                    Kirim
                  </button>
                </div>
                {responError && <p className="mt-2 font-body text-xs text-guyub-merahBata">{responError}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
      {deleteUmkmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border-2 border-guyub-gula bg-white p-6 text-center shadow-2xl">
            <h2 className="font-display text-xl font-semibold text-guyub-bambuDark">Hapus kebutuhan UMKM?</h2>
            <p className="mt-2 font-body text-sm text-stone-600">Kebutuhan ini akan dihapus secara permanen.</p>
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" onClick={() => setDeleteUmkmId(null)} className="rounded-full border border-stone-300 px-5 py-2 font-body text-sm text-stone-600">Batal</button>
              <button type="button" onClick={confirmDeleteUmkm} className="rounded-full bg-guyub-merahBata px-5 py-2 font-body text-sm text-white">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

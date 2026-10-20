'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { KabupatenSelect } from '@/components/KabupatenSelect';

interface MyIklanItem {
  id: string;
  judul: string;
  deskripsi: string;
  bidang: string;
  kabupatenKota: string;
  fotoUrl: string | null;
  status: string;
  dibuatAt: string;
}

const BIDANG_LIST = [
  'Kesehatan', 'Pendidikan', 'Ekonomi', 'Lingkungan', 'Sosial', 'Teknologi', 'Budaya',
];

export default function BuatIklanPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<MyIklanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    bidang: '',
    kabupatenKota: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.judul.trim()) newErrors.judul = 'Judul wajib diisi.';
    else if (form.judul.trim().length > 40) newErrors.judul = 'Judul maksimal 40 karakter.';
    if (!form.deskripsi.trim()) newErrors.deskripsi = 'Deskripsi wajib diisi.';
    else if (form.deskripsi.trim().length > 140) newErrors.deskripsi = 'Deskripsi maksimal 140 karakter.';
    if (!form.bidang) newErrors.bidang = 'Bidang wajib dipilih.';
    if (!form.kabupatenKota) newErrors.kabupatenKota = 'Kabupaten/kota wajib dipilih.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (active) {
      setMessage('Anda sudah memiliki iklan aktif. Selesaikan, tarik, atau tunggu iklan berakhir sebelum membuat baru.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post('/iklan', {
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        bidang: form.bidang,
        kabupatenKota: form.kabupatenKota,
      });
      setMessage('Draf iklan disimpan.');
      setForm({ judul: '', deskripsi: '', bidang: '', kabupatenKota: '' });
      setErrors({});
      await load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setMessage(Array.isArray(msg) ? msg.join('. ') : msg ?? 'Gagal menyimpan draf iklan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-guyub-krem">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/iklan" className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 hover:bg-stone-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Kembali
          </Link>
          {active && (
            <span className="inline-flex items-center gap-1 rounded-full bg-guyub-merahBata/10 px-3 py-1 font-body text-xs font-medium text-guyub-merahBata">
              Iklan aktif
            </span>
          )}
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 mb-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-guyub-bambuDark">Buat Iklan Baru</h2>
          <p className="mt-2 font-body text-sm text-stone-600">
            Buat draf iklan kartu penggerak. Setelah draf, ajukan untuk meninjau. Biaya paket <strong className="font-medium text-guyub-bambuDark">1000 currency</strong> untuk durasi <strong className="font-medium text-guyub-bambuDark">3 hari</strong> dengan kuota 100 tayangan per hari.
          </p>
          {active && (
            <p className="mt-3 font-body text-sm text-guyub-merahBata">
              Anda sudah memiliki iklan aktif. Selesaikan, tarik, atau tunggu iklan berakhir sebelum membuat baru.
            </p>
          )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Judul (maks 40 karakter)</label>
            <input
              required
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className={`mt-1 w-full rounded-lg border px-3 py-2 font-body text-sm ${errors.judul ? 'border-guyub-merahBata' : 'border-stone-300'} focus:border-guyub-bambuDark`}
              placeholder="Judul iklan"
            />
            {errors.judul && <p className="mt-1 font-body text-xs text-guyub-merahBata">{errors.judul}</p>}
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Deskripsi (maks 140 karakter)</label>
            <textarea
              required
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className={`mt-1 w-full rounded-lg border px-3 py-2 font-body text-sm ${errors.deskripsi ? 'border-guyub-merahBata' : 'border-stone-300'} focus:border-guyub-bambuDark`}
              placeholder="Deskripsi iklan"
            />
            <p className="mt-1 font-body text-xs text-stone-500 text-right">{form.deskripsi.length}/140</p>
            {errors.deskripsi && <p className="mt-1 font-body text-xs text-guyub-merahBata">{errors.deskripsi}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Bidang</label>
              <select
                required
                value={form.bidang}
                onChange={(e) => setForm({ ...form, bidang: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm focus:border-guyub-bambuDark"
              >
                <option value="">Pilih bidang</option>
                {BIDANG_LIST.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.bidang && <p className="mt-1 font-body text-xs text-guyub-merahBata">{errors.bidang}</p>}
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Kabupaten/Kota</label>
              <KabupatenSelect
                value={form.kabupatenKota}
                onChange={(value) => setForm({ ...form, kabupatenKota: value })}
                required
                error={errors.kabupatenKota}
              />
              {errors.kabupatenKota && <p className="mt-1 font-body text-xs text-guyub-merahBata">{errors.kabupatenKota}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || active}
              className={`flex-1 rounded-full px-6 py-2 font-body text-sm font-medium transition ${submitting || active ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-guyub-bambuDark text-white hover:bg-guyub-bambu'}`}
            >
              {submitting ? 'Menyimpan…' : active ? 'Iklan Aktif' : 'Simpan Draf'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/iklan')}
              className="rounded-full border border-stone-300 px-6 py-2 font-body text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Batal
            </button>
          </div>
          {message && <p className="mt-3 font-body text-sm text-guyub-bambuDark">{message}</p>}
        </form>
      </div>
    </div>
  );
}

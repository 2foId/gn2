'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { SkillChip, skillLabel } from '@/components/SkillChip';

interface UmkmNeed {
  id: string;
  namaUsaha: string;
  category: string;
}

interface UmkmResponse {
  id: string;
  pesan: string;
  penolong: { id: string; nama: string };
  need: UmkmNeed;
}

export default function PortfolioFormPage({ params }: { params: { responseId: string } }) {
  const user = useAuthStore((s) => s.user);
  const [response, setResponse] = useState<UmkmResponse | null>(null);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/umkm/${response?.need?.id ?? ''}`);
        // We need the response detail; fetch via the need detail which includes responses
      } catch {
        // ignore
      }
    }
    // Fetch response detail from the need page is complex; instead fetch directly if endpoint exists.
    // For now, load via the expanded data passed from parent is not possible in App Router.
    // We'll fetch the response via a dedicated approach below.
  }, []);

  async function loadResponse() {
    try {
      // Try to get the response from the need detail. Since we don't have needId here,
      // we fetch all needs and find the response. This is a fallback.
      const res = await api.get('/umkm');
      const items: any[] = res.data;
      for (const item of items) {
        const found = (item.responses ?? []).find((r: any) => r.id === params.responseId);
        if (found) {
          setResponse({
            id: found.id,
            pesan: found.pesan,
            penolong: found.penolong,
            need: {
              id: item.id,
              namaUsaha: item.namaUsaha,
              category: item.category,
            },
          });
          setForm((current) => ({ ...current, category: item.category }));
          break;
        }
      }
    } catch {
      setError('Gagal memuat data kebutuhan.');
    }
  }

  useEffect(() => {
    loadResponse();
  }, []);

  function handleBeforeImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format gambar harus JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 2 MB.');
      return;
    }
    setBeforeImage(file);
    setBeforePreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleAfterImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format gambar harus JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 2 MB.');
      return;
    }
    setAfterImage(file);
    setAfterPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!beforeImage || !afterImage) {
      setError('Kedua gambar (Sebelum dan Sesudah) wajib diunggah.');
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      setError('Judul dan deskripsi wajib diisi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('beforeImage', beforeImage);
      data.append('afterImage', afterImage);
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('category', form.category);
      await api.post(`/umkm/responses/${params.responseId}/portfolio`, data);
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join('. ') : message ?? 'Gagal menyimpan portofolio.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-2xl border-2 border-guyub-gula bg-white p-8 shadow-sm text-center">
          <h2 className="font-display text-xl font-semibold text-guyub-bambuDark mb-2">Portofolio Berhasil Ditambahkan</h2>
          <p className="font-body text-sm text-stone-600 mb-4">Terima kasih atas kontribusi Anda.</p>
          <Link href="/dashboard/umkm" className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm font-medium text-white hover:bg-guyub-bambu">
            Kembali ke Daftar Kebutuhan
          </Link>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="font-body text-sm text-stone-600">Memuat data kebutuhan…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <nav className="mb-6">
        <Link href="/dashboard/umkm" className="font-body text-sm text-guyub-bambuDark hover:underline">&larr; Kembali ke Daftar Kebutuhan</Link>
      </nav>
      <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark mb-2">Tambah Portofolio</h1>
      <p className="font-body text-sm text-stone-600 mb-6">
        Respons: <span className="font-medium">{response.pesan}</span> untuk <span className="font-medium">{response.need.namaUsaha}</span>
      </p>

      {error && <p className="mb-4 font-body text-sm text-guyub-merahBata">{error}</p>}

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Gambar Sebelum</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBeforeImage}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm"
            />
            {beforePreview && (
              <img src={beforePreview} alt="Sebelum" className="mt-2 h-32 w-32 object-cover rounded-lg border border-stone-200" />
            )}
            <p className="mt-1 font-body text-xs text-stone-500">JPG, PNG, WEBP maksimal 2 MB</p>
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Gambar Sesudah</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAfterImage}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm"
            />
            {afterPreview && (
              <img src={afterPreview} alt="Sesudah" className="mt-2 h-32 w-32 object-cover rounded-lg border border-stone-200" />
            )}
            <p className="mt-1 font-body text-xs text-stone-500">JPG, PNG, WEBP maksimal 2 MB</p>
          </div>
        </div>
        <div>
          <label className="block font-body text-sm font-medium text-stone-700">Judul</label>
          <input
            required
            maxLength={80}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
            placeholder="Mis. Pemasaran Media Sosial untuk Toko Batik"
          />
          <p className="mt-1 font-body text-xs text-stone-500">Maksimal 80 karakter</p>
        </div>
        <div>
          <label className="block font-body text-sm font-medium text-stone-700">Deskripsi</label>
          <textarea
            required
            maxLength={500}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
            placeholder="Ceritakan pekerjaan yang telah Anda selesaikan…"
          />
          <p className="mt-1 font-body text-xs text-stone-500">Maksimal 500 karakter</p>
        </div>
        <div>
          <label className="block font-body text-sm font-medium text-stone-700">Kategori Keterampilan</label>
          <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-2 py-1">
            <SkillChip value={form.category} />
          </div>
          <p className="mt-1 font-body text-xs text-stone-500">Diambil otomatis dari kategori kebutuhan.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-guyub-gula px-6 py-2 font-body font-medium text-guyub-bambuDark hover:brightness-95 disabled:opacity-60"
        >
          {loading ? 'Menyimpan…' : 'Simpan Portofolio'}
        </button>
      </form>
    </div>
  );
}

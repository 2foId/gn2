'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { format, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { MapPin } from '@/components/MapView';
import { UserAvatar, UserIdentity } from '@/components/UserIdentity';
import { ConfirmDialog } from '@/components/ConfirmDialog';

// Leaflet butuh window/document, jadi di-load hanya di client (tidak di-SSR)
const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] items-center justify-center rounded-xl bg-white">
      <p className="font-body text-sm text-stone-500">Memuat peta…</p>
    </div>
  ),
});

const KATEGORI = [
  { value: 'MEDIS', label: 'Medis', icon: '+' },
  { value: 'KERUSAKAN_RUMAH', label: 'Renovasi Rumah', icon: '⌂' },
  { value: 'TENAGA_KERJA', label: 'Tenaga Kerja', icon: '💼' },
  { value: 'LAINNYA', label: 'Lainnya', icon: '…' },
] as const;

const PREFERENSI_RELAWAN = [
  { value: 'SEMUA', label: 'Siapa saja', description: 'Terbuka untuk semua warga', icon: '/icons/semua.svg' },
  { value: 'PEMUDA_18_30', label: 'Pemuda 18–30', description: 'Diutamakan Penggerak usia 18–30 tahun', icon: '/icons/pemuda.svg' },
  { value: 'BERPENGALAMAN', label: 'Berpengalaman', description: 'Diutamakan Penggerak dengan keahlian yang relevan', icon: '/icons/berpengalaman.svg' },
] as const;

function getKategoriLabel(value: string) {
  return KATEGORI.find((k) => k.value === value)?.label || value.replace('_', ' ');
}

interface BantuanItem extends MapPin {
  deskripsi: string;
  alamat?: string;
  _count?: { kesediaanBantu: number };
  pembuat: { id: string; nama: string; avatarUrl?: string | null };
  preferensiRelawan: string;
  cocokPreferensi: boolean;
  dibutuhkanSebelum?: string | null;
  selesaiAt?: string | null;
  kesediaanBantu?: { user: { id: string; nama: string; avatarUrl?: string | null } }[];
}

export default function PetaPage() {
  const user = useAuthStore((s) => s.user);
  const isVerifikator = user?.role === 'PENGGERAK' || user?.role === 'ADMIN';

  const [pins, setPins] = useState<BantuanItem[]>([]);
  const [antrian, setAntrian] = useState<BantuanItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [kesediaanStatus, setKesediaanStatus] = useState<Record<string, 'AKTIF' | 'DIBATALKAN'>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'AKTIF' | 'INAKTIF'>('AKTIF');
  const [preferensiFilter, setPreferensiFilter] = useState<'SEMUA' | 'PEMUDA_18_30' | 'BERPENGALAMAN'>('SEMUA');
  const [deleteBantuanId, setDeleteBantuanId] = useState<string | null>(null);
  const [confirmBantuId, setConfirmBantuId] = useState<string | null>(null);
  const [confirmBatalId, setConfirmBatalId] = useState<string | null>(null);
  const [batalFormId, setBatalFormId] = useState<string | null>(null);
  const [batalAlasan, setBatalAlasan] = useState('');
  const [batalError, setBatalError] = useState<string | null>(null);
  const [menuKesediaanId, setMenuKesediaanId] = useState<string | null>(null);
  const [cancelledTooltipId, setCancelledTooltipId] = useState<string | null>(null);

  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'LAINNYA',
    latitude: '-7.3886',
    longitude: '109.3639',
    alamat: '',
    dibutuhkanSebelum: '',
    preferensiRelawan: 'SEMUA',
  });

  const selectedLocation: [number, number] = [parseFloat(form.latitude), parseFloat(form.longitude)];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { preferensi: preferensiFilter };
      const petaRes = await api.get('/bantuan/peta', { params });
      setPins(petaRes.data);
      if (user) {
        const ownOffers = await api.get('/bantuan/saya/kesediaan');
        setKesediaanStatus(Object.fromEntries(ownOffers.data.map((offer: { requestId: string; status: 'AKTIF' | 'DIBATALKAN' }) => [offer.requestId, offer.status])));
      }

      if (isVerifikator) {
        const antrianRes = await api.get('/bantuan/verifikasi', { params });
        setAntrian(antrianRes.data.filter((i: BantuanItem) => i.status === 'MENUNGGU_VERIFIKASI'));
      }
    } finally {
      setLoading(false);
    }
  }, [isVerifikator, preferensiFilter, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!cancelledTooltipId) return;
    const timeout = window.setTimeout(() => setCancelledTooltipId(null), 3000);
    const handleOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest(`[data-cancelled-card="${cancelledTooltipId}"]`)) {
        setCancelledTooltipId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [cancelledTooltipId]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const allErrors = validateForm();
    setTouched({ judul: true, deskripsi: true, alamat: true, latitude: true, longitude: true, kategori: true, tenggat: true });
    if (Object.keys(allErrors).length > 0) {
      return;
    }
    try {
      await api.post('/bantuan', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        dibutuhkanSebelum: form.dibutuhkanSebelum ? new Date(form.dibutuhkanSebelum).toISOString() : undefined,
      });
      setMessage('Permintaan bantuan berhasil dikirim, menunggu verifikasi Penggerak.');
      setShowForm(false);
      setForm({ judul: '', deskripsi: '', kategori: 'LAINNYA', latitude: '-7.3886', longitude: '109.3639', alamat: '', dibutuhkanSebelum: '', preferensiRelawan: 'SEMUA' });
      setTouched({});
      setErrors({});
      loadData();
    } catch (err: any) {
      setMessage(err.response?.data?.message);
      setConfirmBantuId(null);
    }
  }

  async function handleVerifikasi(id: string, disetujui: boolean) {
    await api.patch(`/bantuan/${id}/verifikasi?disetujui=${disetujui}`);
    loadData();
  }

  async function handleKesediaan(id: string) {
    try {
      await api.post(`/bantuan/${id}/kesediaan`, {});
      setKesediaanStatus((current) => ({ ...current, [id]: 'AKTIF' }));
      setMessage('Terima kasih, kesediaan Anda telah dicatat.');
      setConfirmBantuId(null);
      await loadData();
    } catch (err: any) {
      setMessage(err.response?.data?.message);
    }
  }

  async function handleBatalKesediaan() {
    if (!batalFormId || batalAlasan.trim().length < 10 || batalAlasan.trim().length > 500) return;
    setBatalError(null);
    try {
      await api.post(`/bantuan/${batalFormId}/batal-kesediaan`, { alasan: batalAlasan.trim() });
      setKesediaanStatus((current) => ({ ...current, [batalFormId]: 'DIBATALKAN' }));
      setBatalFormId(null);
      setBatalAlasan('');
      setMessage('Pembatalan bantuan berhasil dikirim.');
      await loadData();
    } catch (err: any) {
      setBatalError(err.response?.data?.message);
    }
  }

  async function handleSelesai(id: string) {
    await api.patch(`/bantuan/${id}/selesai`);
    setMessage('Permintaan bantuan telah ditandai selesai.');
    loadData();
  }

  async function confirmDeleteBantuan() {
    if (!deleteBantuanId) return;
    try {
      await api.delete(`/bantuan/${deleteBantuanId}`);
      setDeleteBantuanId(null);
      loadData();
    } catch (err: any) {
      setDeleteBantuanId(null);
      throw err;
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    if (!form.judul.trim()) newErrors.judul = 'Judul wajib diisi';
    if (form.deskripsi.length < 10) newErrors.deskripsi = 'Minimal 10 karakter';
    if (!form.alamat.trim()) newErrors.alamat = 'Alamat wajib diisi';
    if (!form.dibutuhkanSebelum) newErrors.tenggat = 'Tenggat wajib diisi.';
    setErrors(newErrors);
    return newErrors;
  }

  function handleFieldBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  }

  function handleFieldChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const newErrors = { ...errors };
      if (field === 'judul' && !value.trim()) newErrors.judul = 'Judul wajib diisi';
      else if (field === 'judul') delete newErrors.judul;
      if (field === 'deskripsi' && value.length < 10) newErrors.deskripsi = 'Minimal 10 karakter';
      else if (field === 'deskripsi') delete newErrors.deskripsi;
      if (field === 'alamat' && !value.trim()) newErrors.alamat = 'Alamat wajib diisi';
      else if (field === 'alamat') delete newErrors.alamat;
      setErrors(newErrors);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">
            Peta Butuh Guyub
          </h1>
          <p className="font-body text-sm text-stone-600">
            Kebutuhan warga secara real-time di wilayah Purbalingga.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="relative z-30 rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm font-medium text-white hover:bg-guyub-bambu"
        >
          {showForm ? 'Batal' : '+ Buat Permintaan'}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg bg-guyub-gula/20 px-4 py-3 font-body text-sm text-guyub-bambuDark">
          {message}
        </div>
      )}

      {showForm && <div className="fixed inset-0 z-20 bg-black/55" aria-hidden="true" onClick={() => setShowForm(false)} />}

      {showForm && (
        <form onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()} className="relative z-30 mt-6 space-y-4 rounded-2xl border-2 border-guyub-gula bg-white p-6 shadow-2xl">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Judul</label>
              <input
                required
                value={form.judul}
                onChange={(e) => handleFieldChange('judul', e.target.value)}
                onBlur={() => handleFieldBlur('judul')}
                className={`mt-1 w-full rounded-lg border px-4 py-2 font-body ${touched.judul ? (errors.judul ? 'border-red-500' : 'border-green-500') : 'border-stone-300'}`}
              />
              {touched.judul && errors.judul && <p className="mt-1 text-xs text-red-600">{errors.judul}</p>}
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              >
                {KATEGORI.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Deskripsi</label>
            <textarea
              required
              minLength={10}
              rows={2}
              value={form.deskripsi}
              onChange={(e) => handleFieldChange('deskripsi', e.target.value)}
              onBlur={() => handleFieldBlur('deskripsi')}
              className={`mt-1 w-full rounded-lg border px-4 py-2 font-body ${touched.deskripsi ? (errors.deskripsi ? 'border-red-500' : 'border-green-500') : 'border-stone-300'}`}
            />
            {touched.deskripsi && errors.deskripsi && <p className="mt-1 text-xs text-red-600">{errors.deskripsi}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Latitude terpilih</label>
              <input
                required
                readOnly
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Longitude terpilih</label>
              <input
                required
                readOnly
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Alamat/Tempat</label>
              <input
                required
                value={form.alamat}
                onChange={(e) => handleFieldChange('alamat', e.target.value)}
                onBlur={() => handleFieldBlur('alamat')}
                className={`mt-1 w-full rounded-lg border px-4 py-2 font-body ${touched.alamat ? (errors.alamat ? 'border-red-500' : 'border-green-500') : 'border-stone-300'}`}
              />
              {touched.alamat && errors.alamat && <p className="mt-1 text-xs text-red-600">{errors.alamat}</p>}
            </div>
          </div>
          <div className="max-w-sm">
            <label className="block font-body text-sm font-medium text-stone-700">Tenggat (tanggal dan jam) <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              required
              value={form.dibutuhkanSebelum}
              onChange={(event) => {
                setForm({ ...form, dibutuhkanSebelum: event.target.value });
                setErrors((current) => ({ ...current, tenggat: event.target.value ? '' : 'Tenggat wajib diisi.' }));
              }}
              className={`mt-1 w-full rounded-lg border px-4 py-2 font-body ${errors.tenggat ? 'border-red-500' : 'border-stone-300'}`}
            />
            {!form.dibutuhkanSebelum && <p className="mt-1 font-body text-xs text-guyub-merahBata">Tenggat wajib diisi.</p>}
          </div>
          <fieldset>
            <legend className="font-body text-sm font-medium text-stone-700">Siapa yang kamu harapkan membantu?</legend>
            <div className="mt-3 grid gap-5 md:grid-cols-3">
              {PREFERENSI_RELAWAN.map((choice) => {
                const selected = form.preferensiRelawan === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setForm({ ...form, preferensiRelawan: choice.value })}
                    className={`flex min-h-28 items-start gap-3 rounded-2xl border-2 p-4 text-left transition duration-200 hover:shadow-sm ${selected ? 'border-guyub-gula bg-yellow-50 shadow-sm' : 'border-stone-200 bg-white'}`}
                  >
                    <img src={choice.icon} alt="" className="h-6 w-6 shrink-0" />
                    <span>
                      <span className="block font-body text-sm font-semibold text-guyub-bambuDark">{choice.label}</span>
                      <span className="mt-1 block font-body text-xs text-stone-600">{choice.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={!form.dibutuhkanSebelum}
            className="rounded-full bg-guyub-gula px-6 py-2 font-body font-medium text-guyub-bambuDark hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Kirim Permintaan
          </button>
        </form>
      )}

      <div className="relative z-30 mt-6 overflow-hidden rounded-xl">
        {showForm && <p className="mb-2 rounded-lg bg-guyub-gula px-4 py-2 font-body text-sm text-guyub-bambuDark">Klik peta untuk memilih titik, atau geser pin target ke lokasi yang tepat. <span className="underline font-bold italic">Hanya bisa memilih dalam kabupaten Purbalingga.</span></p>}
        {!showForm && <p className="mb-2 font-body text-xs text-stone-500">Ukuran peta dapat diubah dengan menarik sudut kanan bawah.</p>}
        <div className="mb-3 flex h-10 w-fit items-center rounded-full border border-stone-300 bg-white p-1">
          {[
            { value: 'SEMUA', label: 'Semua Penggerak' },
            { value: 'PEMUDA_18_30', label: 'Pemuda 18–30' },
            { value: 'BERPENGALAMAN', label: 'Berpengalaman' },
          ].map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => setPreferensiFilter(choice.value as typeof preferensiFilter)}
              className={`h-full rounded-full px-4 font-body text-xs font-medium transition duration-200 ${preferensiFilter === choice.value ? 'bg-guyub-bambuDark text-white' : 'border border-stone-300 bg-white text-stone-600'}`}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <MapView
          pins={pins}
          selectionMode={showForm}
          selectedLocation={selectedLocation}
          onLocationSelect={(latitude, longitude) => setForm((current) => ({
            ...current,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }))}
        />
      </div>

      {
        isVerifikator && antrian.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold text-guyub-bambuDark">
              Antrian Verifikasi ({antrian.length})
            </h2>
            <div className="mt-3 space-y-3">
              {antrian.map((item) => (
                <div key={item.id} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-body font-semibold text-stone-800">{item.judul}</p>
                      <p className="font-body text-sm text-stone-600">{item.deskripsi}</p>
                      <p className="mt-1 font-body text-xs uppercase tracking-wide text-guyub-tanah">
                        {getKategoriLabel(item.kategori)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleVerifikasi(item.id, true)}
                        className="rounded-full bg-guyub-bambuDark px-4 py-1.5 font-body text-sm text-white hover:bg-guyub-bambu"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => handleVerifikasi(item.id, false)}
                        className="rounded-full border border-guyub-merahBata px-4 py-1.5 font-body text-sm text-guyub-merahBata hover:bg-guyub-merahBata/10"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      <div className="mt-8">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-guyub-bambuDark">
            Daftar Kebutuhan
          </h2>
          <div className="flex rounded-full border border-stone-300 bg-white p-1">
            <button
              onClick={() => setFilter('AKTIF')}
              className={`rounded-full px-4 py-1.5 font-body text-xs font-medium transition ${filter === 'AKTIF' ? 'bg-guyub-gula text-guyub-bambuDark' : 'text-stone-600 hover:text-guyub-bambuDark'}`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilter('INAKTIF')}
              className={`rounded-full px-4 py-1.5 font-body text-xs font-medium transition ${filter === 'INAKTIF' ? 'bg-guyub-gula text-guyub-bambuDark' : 'text-stone-600 hover:text-guyub-bambuDark'}`}
            >
              Inaktif
            </button>
          </div>
        </div>
        {loading ? (
          <p className="mt-3 font-body text-sm text-stone-500">Memuat…</p>
        ) : (() => {
          const filtered = pins.filter((item) => filter === 'AKTIF' ? ['AKTIF', 'DIPROSES'].includes(item.status) : ['SELESAI', 'DITOLAK'].includes(item.status));
          if (filtered.length === 0) {
            return <p className="mt-3 font-body text-sm text-stone-500">{filter === 'AKTIF' ? 'Belum ada kebutuhan aktif.' : 'Belum ada kebutuhan inaktif.'}</p>;
          }
          return (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {filtered.map((item) => {
                const kategoriObj = KATEGORI.find((k) => k.value === item.kategori) || KATEGORI[3];
                const isCreator = user?.id === item.pembuat?.id;
                const hasClickedKesediaan = !!kesediaanStatus[item.id] || !!item.kesediaanBantu?.some((k) => k.user.id === user?.id);
                const isCancelled = kesediaanStatus[item.id] === 'DIBATALKAN';
                return (
                  <div
                    key={item.id}
                    data-cancelled-card={isCancelled ? item.id : undefined}
                    onMouseEnter={() => isCancelled && setCancelledTooltipId(item.id)}
                    onClick={() => isCancelled && setCancelledTooltipId(item.id)}
                    className={`group relative rounded-2xl bg-white p-4 shadow-sm ${item.status === 'SELESAI' ? 'opacity-60' : ''} ${isCancelled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${kesediaanStatus[item.id] === 'AKTIF' ? 'guyub-neon-glow border-2 border-yellow-400' : 'border border-green-600/40'}`}
                  >
                    {isCancelled && <div className={`absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-lg bg-stone-900 px-3 py-2 font-body text-sm text-white dark:bg-stone-100 dark:text-stone-900 ${cancelledTooltipId === item.id ? 'visible' : 'invisible'} group-hover:visible`} role="tooltip">Anda tidak bisa membantu permintaan ini.</div>}
                    <div className="mb-2 flex items-center justify-start gap-2">
                      {kesediaanStatus[item.id] === 'AKTIF' && <div className="relative">
                        <button type="button" aria-label="Menu kesediaan bantuan" aria-expanded={menuKesediaanId === item.id} onClick={() => setMenuKesediaanId(menuKesediaanId === item.id ? null : item.id)} className="rounded-full px-2 text-xl leading-none text-guyub-bambuDark hover:bg-guyub-krem">⋮</button>
                        {menuKesediaanId === item.id && <div className="absolute left-0 top-full z-20 mt-1 min-w-40 rounded-xl border border-stone-300 bg-white p-1 shadow-lg"><button type="button" onClick={() => { setMenuKesediaanId(null); setConfirmBatalId(item.id); }} className="w-full rounded-lg px-3 py-2 text-left font-body text-sm text-guyub-merahBata hover:bg-guyub-krem">Batalkan bantuan</button></div>}
                      </div>}
                      <span className={`rounded-md px-2 py-1 font-body text-xs font-medium uppercase text-white ${item.status === 'SELESAI' ? 'bg-red-500' : item.status === 'AKTIF' ? 'bg-green-400' : 'bg-guyub-bambuDark'}`}>STATUS: {item.status.replace('_', ' ')}</span>
                    </div>
                    <div className="absolute right-3 top-3 flex items-center">
                      {item.kesediaanBantu?.slice(0, 4).map((supporter, index) => <div key={supporter.user.id} className={index ? '-ml-2' : ''}><UserAvatar user={supporter.user} size="sm" /></div>)}
                      {(item._count?.kesediaanBantu ?? 0) > 4 && <span className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border border-yellow-400 bg-gray-300 text-[10px] font-semibold text-black">+{(item._count?.kesediaanBantu ?? 0) - 4}</span>}
                    </div>
                    <p className="font-body font-semibold text-stone-800">{item.judul}</p>
                    <UserIdentity user={item.pembuat} />
                    <p className="font-body text-sm text-stone-600">{item.deskripsi}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {(() => {
                        const preference = PREFERENSI_RELAWAN.find((entry) => entry.value === item.preferensiRelawan) ?? PREFERENSI_RELAWAN[0];
                        return <span className="inline-flex items-center gap-1.5 rounded-full bg-guyub-krem px-3 py-1 font-body text-xs font-semibold text-guyub-bambuDark"><img src={preference.icon} alt="" className="h-4 w-4 dark:brightness-0 dark:invert" />{preference.label}</span>;
                      })()}
                      {item.dibutuhkanSebelum && (() => {
                        const parsedDeadline = parseISO(item.dibutuhkanSebelum);
                        return isValid(parsedDeadline) ? <span className="font-body text-xs text-stone-600">Tenggat: {format(parsedDeadline, 'dd MMM yyyy, HH:mm', { locale: id })}</span> : null;
                      })()}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-body text-xs uppercase tracking-wide text-guyub-tanah">
                        {getKategoriLabel(item.kategori)} · {item._count?.kesediaanBantu ?? 0} orang bersedia
                      </span>
                      {item.dibutuhkanSebelum && <DeadlineCountdown deadline={item.dibutuhkanSebelum} />}
                      <div className="flex items-center gap-2">
                        {isCreator && item.status !== 'SELESAI' && item.status !== 'DITOLAK' && (
                          <button
                            onClick={() => handleSelesai(item.id)}
                            className="rounded-full bg-guyub-bambu px-3 py-1.5 font-body text-xs font-medium text-white hover:bg-guyub-bambuDark"
                          >
                            Tandai Selesai
                          </button>
                        )}
                        {!hasClickedKesediaan && !kesediaanStatus[item.id] && (item.status === 'AKTIF' || item.status === 'DIPROSES') && (
                          <button
                            onClick={() => setConfirmBantuId(item.id)}
                            className="rounded-full bg-yellow-400 px-4 py-1.5 font-body text-xs font-semibold text-guyub-bambuDark hover:bg-yellow-300"
                          >
                            Bersedia Bantu
                          </button>
                        )}
                        {(isCreator || user?.role === 'ADMIN' || user?.role === 'PENGGERAK') && (item.status === 'SELESAI' || item.status === 'DITOLAK') && (
                          <button
                            type="button"
                            onClick={() => setDeleteBantuanId(item.id)}
                            className="inline-flex items-center gap-1 font-body text-xs text-guyub-merahBata underline"
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
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      {deleteBantuanId && <ConfirmDialog
        title="Hapus permintaan bantuan?"
        message="Permintaan ini akan dihapus secara permanen."
        confirmLabel="Hapus"
        confirmClassName="rounded-full bg-guyub-merahBata px-5 py-2 font-body text-sm text-white"
        onCancel={() => setDeleteBantuanId(null)}
        onConfirm={() => void confirmDeleteBantuan()}
      />}
      {confirmBantuId && <ConfirmDialog
        title="Konfirmasi kesediaan"
        message="Yakin ingin bersedia membantu permintaan ini?"
        onCancel={() => setConfirmBantuId(null)}
        onConfirm={() => void handleKesediaan(confirmBantuId)}
      />}
      {confirmBatalId && <ConfirmDialog
        title="Konfirmasi pembatalan"
        message="Yakin ingin membatalkan bantuan ini?"
        onCancel={() => setConfirmBatalId(null)}
        onConfirm={() => { setBatalFormId(confirmBatalId); setConfirmBatalId(null); setBatalAlasan(''); setBatalError(null); }}
      />}
      {batalFormId && <div className="fixed inset-0 z-[71] flex items-center justify-center bg-black/55 px-6" role="dialog" aria-modal="true" aria-labelledby="batal-bantuan-title">
        <form onSubmit={(event) => { event.preventDefault(); void handleBatalKesediaan(); }} className="w-full max-w-lg rounded-2xl border-2 border-yellow-400 bg-white p-6 shadow-2xl">
          <h2 id="batal-bantuan-title" className="font-display text-xl font-semibold text-guyub-bambuDark">Jelaskan alasan kamu tidak bisa membantu</h2>
          <textarea required minLength={10} maxLength={500} rows={5} value={batalAlasan} onChange={(event) => setBatalAlasan(event.target.value)} className="mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 font-body text-sm" />
          <div className="mt-1 flex items-center justify-between">
            <span className="font-body text-xs text-stone-500">{batalAlasan.length}/500 · minimal 10 karakter</span>
            {batalError && <p role="alert" className="font-body text-sm text-guyub-merahBata">{batalError}</p>}
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => { setBatalFormId(null); setBatalError(null); }} className="rounded-full border border-stone-300 px-5 py-2 font-body text-sm text-stone-600">Tutup</button>
            <button type="submit" disabled={batalAlasan.trim().length < 10 || batalAlasan.trim().length > 500} className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Kirim dan Batalkan</button>
          </div>
        </form>
      </div>}
    </div >
  );
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = new Date(deadline).getTime() - now;
  if (remaining <= 0) return <span className="rounded-md bg-green-400 px-2 py-1 font-body text-xs font-bold text-guyub-bambuDark">Aktif</span>;
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const label = `${days} hari ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return <span className="rounded-md bg-yellow-300 px-2 py-1 font-body text-xs font-bold text-guyub-bambuDark">{label}</span>;
}

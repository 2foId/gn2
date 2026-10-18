'use client';

import { useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/UserIdentity';
import { SkillChip } from '@/components/SkillChip';
import { KabupatenSelect } from '@/components/KabupatenSelect';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '');

const skills = [
  { value: 'FOTO_PRODUK', label: 'Foto Produk' },
  { value: 'DESAIN', label: 'Desain' },
  { value: 'PEMASARAN_MEDSOS', label: 'Pemasaran Media Sosial' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'PEMBUKUAN', label: 'Pembukuan' },
  { value: 'VIDEO_PENDEK', label: 'Video Pendek' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export interface ProfileEditValues {
  nama: string;
  phone: string;
  kabupatenKota: string;
  bio: string;
  avatarUrl: string;
  keahlian: string[];
  ketersediaan: string;
  tanggalLahir: string;
}

export function emptyProfileEditValues(nama = ''): ProfileEditValues {
  return { nama, phone: '', kabupatenKota: '', bio: '', avatarUrl: '', keahlian: [], ketersediaan: '', tanggalLahir: '' };
}

export function ProfileEditForm({
  initialValues,
  role,
  onSubmit,
  onCancel,
  onAvatarUploaded,
  submitLabel = 'Simpan',
  error,
  children,
}: {
  initialValues: ProfileEditValues;
  role: string;
  onSubmit: (values: ProfileEditValues) => Promise<void>;
  onCancel?: () => void;
  onAvatarUploaded?: (avatarUrl: string) => void;
  submitLabel?: string;
  error?: string | null;
  children?: ReactNode;
}) {
  const [form, setForm] = useState(initialValues);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touchedKabupaten, setTouchedKabupaten] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kabupatenError = role === 'PENGGERAK' && touchedKabupaten && !form.kabupatenKota ? 'Kabupaten/kota wajib diisi' : '';
  const canSubmit = !saving && !avatarLoading && form.nama.length <= 20 && !kabupatenError;

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setAvatarError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Pilih foto berformat JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Ukuran foto maksimal 2 MB.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarLoading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const response = await api.post('/users/avatar', data);
      setForm((current) => ({ ...current, avatarUrl: response.data.avatarUrl }));
      onAvatarUploaded?.(response.data.avatarUrl);
      URL.revokeObjectURL(preview);
      setAvatarPreview(null);
    } catch (uploadError: any) {
      setAvatarError(uploadError.response?.data?.message ?? 'Foto profil gagal diunggah. Coba file JPG, PNG, atau WEBP maksimal 2 MB.');
    } finally {
      setAvatarLoading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  const userForAvatar = { id: 'profile-edit', nama: form.nama || initialValues.nama || '?', avatarUrl: form.avatarUrl };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="relative">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Pratinjau foto profil" className="h-16 w-16 rounded-full border border-guyub-gula object-cover" />
          ) : form.avatarUrl ? (
            <img src={`${API_ORIGIN}${form.avatarUrl}`} alt="Foto profil" className="h-16 w-16 rounded-full border border-guyub-gula object-cover" />
          ) : (
            <UserAvatar user={userForAvatar} size="lg" />
          )}
          <button
            type="button"
            aria-label="Unggah foto profil"
            title="Unggah foto profil"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-guyub-bambuDark bg-white text-guyub-bambuDark transition hover:bg-guyub-krem dark:border-stone-400 dark:bg-stone-800 dark:text-stone-100"
          >
            <img src="/icons/pensil.svg" alt="" aria-hidden="true" className="h-4 w-4 dark:brightness-0 dark:invert" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadAvatar(event.target.files?.[0])} className="sr-only" />
        </div>
        {avatarLoading && <p className="font-body text-sm text-stone-600 dark:text-stone-300">Mengunggah foto…</p>}
      </div>
      {avatarError && <p role="alert" className="font-body text-sm text-red-800 dark:text-red-300">{avatarError}</p>}
      <div>
        <label htmlFor="profile-edit-name" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Nama</label>
        <input id="profile-edit-name" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={20} required className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100" placeholder="Nama" />
        <p className={`mt-1 text-right font-body text-xs ${form.nama.length > 20 ? 'text-guyub-merahBata' : 'text-stone-500'}`}>{form.nama.length}/20</p>
        {form.nama.length > 20 && <p role="alert" className="font-body text-sm text-guyub-merahBata">Nama melebihi 20 karakter. Perbaiki nama sebelum menyimpan.</p>}
      </div>
      {role === 'PENGGERAK' && <div>
        <label htmlFor="profile-edit-phone" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Nomor WhatsApp</label>
        <div className="mt-1 flex rounded-lg border border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800">
          <span className="inline-flex items-center border-r border-stone-300 px-3 font-body text-stone-700 dark:border-stone-600 dark:text-stone-200">+62</span>
          <input id="profile-edit-phone" inputMode="numeric" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13) })} maxLength={13} className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2 font-body text-stone-800 outline-none dark:text-stone-100" placeholder="8123456789" />
        </div>
        <p className="mt-1 font-body text-xs text-stone-600 dark:text-stone-300">Opsional. Dipakai agar orang bisa menghubungimu lewat WhatsApp.</p>
      </div>}
      <KabupatenSelect
        value={form.kabupatenKota}
        onChange={(value) => setForm({ ...form, kabupatenKota: value })}
        onBlur={() => setTouchedKabupaten(true)}
        label="Kabupaten/Kota"
        required={role === 'PENGGERAK'}
        error={kabupatenError}
      />
      <textarea aria-label="Bio" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength={280} className="min-h-28 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100" placeholder="Bio singkat" />
      <section className="space-y-3 rounded-xl border border-guyub-gula bg-white p-4 dark:bg-stone-900">
        <h3 className="font-display text-lg font-semibold text-guyub-bambuDark dark:text-stone-100">Keahlian &amp; Ketersediaan</h3>
        <div>
          <label htmlFor="profile-edit-birthdate" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Tanggal lahir (tidak ditampilkan ke orang lain)</label>
          <input id="profile-edit-birthdate" type="date" value={form.tanggalLahir} onChange={(event) => setForm({ ...form, tanggalLahir: event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body" />
        </div>
        <div>
          <p className="font-body text-sm font-medium text-stone-700 dark:text-stone-200">Keahlian <span className="font-normal text-stone-500">({form.keahlian.length}/10)</span></p>
          <div className="mt-1 flex flex-wrap gap-2">
            {form.keahlian.map((skill) => <SkillChip key={skill} value={skill} selected onToggle={() => setForm((current) => ({ ...current, keahlian: current.keahlian.filter((item) => item !== skill) }))} />)}
            {form.keahlian.length < 10 && <select value="" aria-label="Tambah keahlian" onChange={(event) => {
              const value = event.target.value;
              if (value && !form.keahlian.includes(value)) setForm((current) => ({ ...current, keahlian: [...current.keahlian, value] }));
              event.target.value = '';
            }} className="rounded-lg border border-stone-300 px-3 py-1.5 font-body text-xs">
              <option value="">+ Tambah keterampilan</option>
              {skills.map((skill) => <option key={skill.value} value={skill.value}>{skill.label}</option>)}
            </select>}
          </div>
        </div>
        <div>
          <label htmlFor="profile-edit-availability" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Ketersediaan</label>
          <textarea id="profile-edit-availability" value={form.ketersediaan} onChange={(event) => setForm({ ...form, ketersediaan: event.target.value })} maxLength={200} rows={2} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body" placeholder="contoh: Sabtu pagi, Minggu sore" />
          <p className="mt-1 text-right font-body text-xs text-stone-500">{form.ketersediaan.length}/200</p>
        </div>
      </section>
      {children}
      {error && <p role="alert" className="font-body text-sm text-guyub-merahBata">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={canSubmit} className="rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Menyimpan…' : submitLabel}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 dark:border-stone-500 dark:text-stone-100">Batal</button>}
      </div>
    </form>
  );
}
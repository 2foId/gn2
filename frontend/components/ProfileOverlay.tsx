'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserAvatar } from '@/components/UserIdentity';
import { SkillChip, skillLabel } from '@/components/SkillChip';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { emptyProfileEditValues, ProfileEditForm, type ProfileEditValues } from '@/components/ProfileEditForm';
import { SlotSorotan } from '@/components/SlotSorotan';
import type { ThemePreference } from '@/lib/auth-store';

interface Profile {
    id: string;
    nama: string;
    phone?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    dusun?: string | null;
    kabupatenKota?: string | null;
    role: string;
    keahlian?: string[];
    ketersediaan?: string | null;
    kategoriUsia?: 'PEMUDA_18_30' | 'DEWASA' | null;
    themePreference?: ThemePreference;
    createdAt: string;
    bingkaiAktifId?: string | null;
    bingkaiDimiliki?: Array<{ id: string; kode: string; nama: string; gaya: string; bingkaiId?: string }>;
  }

interface ProfileNote {
    id: string;
    isi: string;
    updatedAt: string;
}

interface LevelInfo {
    level: number;
    xpTotal: number;
    xpSaatIni: number;
    xpDibutuhkan: number;
    persen: number;
}

const KATEGORI_KETERAMPILAN: { value: string; label: string }[] = [
    { value: 'FOTO_PRODUK', label: 'Foto Produk' },
    { value: 'DESAIN', label: 'Desain' },
    { value: 'PEMASARAN_MEDSOS', label: 'Pemasaran Media Sosial' },
    { value: 'MARKETPLACE', label: 'Marketplace' },
    { value: 'PEMBUKUAN', label: 'Pembukuan' },
    { value: 'VIDEO_PENDEK', label: 'Video Pendek' },
    { value: 'LAINNYA', label: 'Lainnya' },
];

export function ProfileOverlay() {
    const currentUser = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const setThemePreference = useAuthStore((state) => state.setThemePreference);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<ProfileNote[]>([]);
    const [noteText, setNoteText] = useState('');
    const [showNoteEditor, setShowNoteEditor] = useState(false);
    const [themeError, setThemeError] = useState<string | null>(null);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [ratings, setRatings] = useState<{ avgScore: number; jumlahUlasan: number; ulasan: any[] } | null>(null);
    const [ratingsLoading, setRatingsLoading] = useState(false);
    const [bingkaiInventory, setBingkaiInventory] = useState<Array<{ id: string; kode: string; nama: string; gaya: string; dimiliki: boolean; dipasang: boolean }> | null>(null);
    const [myIklan, setMyIklan] = useState<Array<{ id: string; judul: string; deskripsi: string; bidang: string; kabupatenKota: string; fotoUrl: string | null; status: string; mulaiAt: string | null; berakhirAt: string | null; jumlahRevisi: number; dibuatAt: string }> | null>(null);
    const [iklanLoading, setIklanLoading] = useState(false);
    const [draftForm, setDraftForm] = useState({ judul: '', deskripsi: '', bidang: '', kabupatenKota: '' });
    const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
    const [previewTheme, setPreviewTheme] = useState<'LIGHT' | 'DARK'>('LIGHT');
    const [showPreview, setShowPreview] = useState(false);
    const [iklanMessage, setIklanMessage] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [iklanActionLoading, setIklanActionLoading] = useState(false);
    const [copyText, setCopyText] = useState<string | null>(null);
    const [copyConfirm, setCopyConfirm] = useState<string | null>(null);

    useEffect(() => {
        async function openProfile(event: Event) {
            const userId = (event as CustomEvent<{ userId: string }>).detail.userId;
            const response = await api.get(userId === currentUser?.id ? '/users/me/profile' : `/users/${userId}`);
            const data = response.data as Profile;
            setProfile(data);
            if (userId === currentUser?.id) {
                const levelResponse = await api.get('/users/me/level');
                setLevelInfo(levelResponse.data);
                try {
                    const bingkaiResponse = await api.get('/bingkai');
                    setBingkaiInventory(bingkaiResponse.data.items);
                } catch {
                    setBingkaiInventory(null);
                }
                try {
                    await loadMyIklan();
                } catch {
                    setMyIklan(null);
                }
            } else {
                setLevelInfo(null);
                setBingkaiInventory(null);
                setMyIklan(null);
            }
            setEditing(false);
            setError(null);
            setThemeError(null);
            const notesResponse = await api.get(`/users/${userId}/notes`);
            setNotes(notesResponse.data);
            setNoteText('');
            setShowNoteEditor(false);

            // Muat portofolio Penggerak (hanya yang dipublikasikan)
            try {
                setPortfolioLoading(true);
                const portfolioResponse = await api.get(`/volunteers/${userId}/portfolio`);
                setPortfolios(Array.isArray(portfolioResponse.data) ? portfolioResponse.data : []);
            } catch {
                setPortfolios([]);
            } finally {
                setPortfolioLoading(false);
            }

            // Muat rating profil
            try {
                setRatingsLoading(true);
                const ratingsResponse = await api.get(`/users/${userId}/ratings`);
                setRatings(ratingsResponse.data);
            } catch {
                setRatings(null);
            } finally {
                setRatingsLoading(false);
            }
        }
        window.addEventListener('guyub:open-profile', openProfile);
        return () => window.removeEventListener('guyub:open-profile', openProfile);
    }, [currentUser?.id]);

    async function saveProfile(values: ProfileEditValues) {
        try {
            const { phone, ...profileFields } = values;
            const response = await api.patch('/users/me/profile', {
                ...profileFields,
                ...(profile?.role === 'PENGGERAK' ? { phone: phone ? `+62${phone.replace(/\D/g, '')}` : null } : {}),
                ketersediaan: values.ketersediaan || undefined,
            });
            setProfile(response.data);
            updateUser(response.data);
            setEditing(false);
            setError(null);
        } catch (err: any) {
            const message = err.response?.data?.message;
            setError(Array.isArray(message) ? message.join('. ') : message ?? 'Profil gagal disimpan.');
        }
    }

    async function changeTheme(theme: ThemePreference) {
        const previous = currentUser?.themePreference ?? 'LIGHT';
        if (theme === previous) return;
        setThemePreference(theme);
        setThemeError(null);
        try {
            const response = await api.patch('/users/me/theme', { theme });
            setThemePreference(response.data.themePreference);
            setProfile((current) => current ? { ...current, themePreference: response.data.themePreference } : current);
            updateUser({ themePreference: response.data.themePreference });
        } catch (err: any) {
            setThemePreference(previous);
            const message = err.response?.data?.message;
            setThemeError(Array.isArray(message) ? message.join('. ') : message);
        }
    }

    async function toggleBingkai(bingkaiId: string | null) {
        try {
            const res = await api.patch('/users/me/bingkai', { bingkaiId: bingkaiId });
            const profileRes = await api.get('/users/me/profile');
            setProfile(profileRes.data);
            updateUser({ bingkaiAktif: profileRes.data.bingkaiAktifId });
            const bingkaiRes = await api.get('/bingkai');
            setBingkaiInventory(bingkaiRes.data.items);
        } catch (err: any) {
            const message = err.response?.data?.message;
            setError(Array.isArray(message) ? message.join('. ') : message ?? 'Gagal mengubah bingkai.');
        }
    }

    async function loadMyIklan() {
        if (!isMine) return;
        setIklanLoading(true);
        try {
            const res = await api.get('/iklan/saya');
            setMyIklan(Array.isArray(res.data) ? res.data : []);
        } catch {
            setMyIklan(null);
        } finally {
            setIklanLoading(false);
        }
    }

    function handleDraftChange(field: string, value: string) {
        setDraftForm((prev) => ({ ...prev, [field]: value }));
        setDraftErrors((prev) => ({ ...prev, [field]: '' }));
    }

    function validateDraft(): boolean {
        const errors: Record<string, string> = {};
        const { judul, deskripsi, bidang, kabupatenKota } = draftForm;
        if (!judul.trim()) errors.judul = 'Judul wajib diisi.';
        else if (judul.trim().length > 40) errors.judul = 'Judul maksimal 40 karakter.';
        if (!deskripsi.trim()) errors.deskripsi = 'Deskripsi wajib diisi.';
        else if (deskripsi.trim().length > 140) errors.deskripsi = 'Deskripsi maksimal 140 karakter.';
        if (!bidang) errors.bidang = 'Bidang wajib dipilih.';
        if (!kabupatenKota) errors.kabupatenKota = 'Kabupaten/Kota wajib dipilih.';
        setDraftErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function simpanDraf() {
        if (!validateDraft()) return;
        setIklanActionLoading(true);
        setIklanMessage(null);
        try {
            await api.post('/iklan', draftForm);
            setDraftForm({ judul: '', deskripsi: '', bidang: '', kabupatenKota: '' });
            setShowPreview(false);
            await loadMyIklan();
            setIklanMessage('Disimpan.');
        } catch (err: any) {
            const message = err.response?.data?.message;
            setIklanMessage(Array.isArray(message) ? message.join('. ') : message ?? 'Gagal menyimpan draf.');
        } finally {
            setIklanActionLoading(false);
        }
    }

    async function ajukanIklan() {
        if (!validateDraft()) return;
        const aktif = myIklan?.some((i) => i.status === 'MENUNGGU' || i.status === 'DISETUJUI');
        if (aktif) {
            setShowConfirmDialog(true);
            return;
        }
        setIklanActionLoading(true);
        setIklanMessage(null);
        try {
            const res = await api.post('/iklan', draftForm);
            await api.post(`/iklan/${res.data.id}/ajukan`);
            setDraftForm({ judul: '', deskripsi: '', bidang: '', kabupatenKota: '' });
            setShowPreview(false);
            await loadMyIklan();
            setIklanMessage('Diajukan. Sedang ditinjau. Belum tayang.');
        } catch (err: any) {
            const message = err.response?.data?.message;
            setIklanMessage(Array.isArray(message) ? message.join('. ') : message ?? 'Gagal mengajukan.');
        } finally {
            setIklanActionLoading(false);
        }
    }

    async function copySummary(portfolio: any) {
        const deskripsi = (portfolio.description || '').slice(0, 300);
        const namaUsaha = portfolio.umkmNeed?.namaUsaha ?? '-';
        const text = [
            `Judul: ${portfolio.title}`,
            `Kategori: ${skillLabel(portfolio.category)}`,
            `Deskripsi: ${deskripsi}`,
            `Usaha: ${namaUsaha}`,
            `Tautan: ${window.location.origin}/volunteer/${portfolio.volunteerId}/portfolio`,
        ].join('\n\n');
        setCopyText(text);
        setError(null);
        try {
            await navigator.clipboard.writeText(text);
            setCopyConfirm('Tersalin');
            setTimeout(() => setCopyConfirm(null), 2000);
        } catch {
            setError('Gagal menyalin ringkasan. Salin teks di bawah secara manual.');
        }
    }

    async function downloadCard(portfolio: any) {
        setError(null);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 627;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('Gagal membuat kanvas.');
                return;
            }

            ctx.fillStyle = '#F7F2E9';
            ctx.fillRect(0, 0, 1200, 627);

            let fotoLoaded = false;
            if (portfolio.afterImageUrl) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = portfolio.afterImageUrl;
                await new Promise<void>((resolve) => {
                    img.onload = () => { fotoLoaded = true; resolve(); };
                    img.onerror = () => resolve();
                });
                if (fotoLoaded) {
                    const fotoWidth = 480;
                    const fotoHeight = 320;
                    const sx = 0;
                    const sy = 0;
                    const sw = img.width;
                    const sh = Math.round((sw * fotoHeight) / fotoWidth);
                    const sx2 = Math.max(0, Math.round((img.height - sh) / 2));
                    ctx.drawImage(img, sx, sx2, sw, sh, 40, 140, fotoWidth, fotoHeight);
                }
            }

            ctx.fillStyle = '#2A4A32';
            ctx.font = 'bold 40px "Helvetica Now Display Cn Med", sans-serif';
            ctx.fillText(portfolio.title, 560, 180);
            ctx.font = '24px "Helvetica Now Display Cn Med", sans-serif';
            ctx.fillText(`Kategori: ${skillLabel(portfolio.category)}`, 560, 240);
            ctx.fillText(`Usaha: ${portfolio.umkmNeed?.namaUsaha ?? '-'}`, 560, 290);
            ctx.fillText(`Penggerak: ${currentUser?.nama ?? '-'}`, 560, 340);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/png');
            });
            if (!blob) {
                setError('Gagal membuat berkas kartu.');
                return;
            }
            const url = URL.createObjectURL(blob);
            const slug = (portfolio.title || 'portofolio').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const link = document.createElement('a');
            link.download = `portofolio-${slug}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
        setError('Gagal mengunduh kartu.');
        }
    }

    async function saveNote(event: React.FormEvent) {
        event.preventDefault();
        if (!profile || !noteText.trim()) return;
        const response = await api.post(`/users/${profile.id}/notes`, { isi: noteText.trim() });
        setNotes((current) => [response.data, ...current]);
        setNoteText('');
        setShowNoteEditor(false);
    }

    if (!profile) return null;

    const isMine = profile.id === currentUser?.id;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-4 sm:items-center sm:px-6" role="dialog" aria-modal="true" onClick={() => setProfile(null)}>
            <section className="w-full max-w-5xl min-w-0 rounded-2xl border border-guyub-gula bg-white p-6 shadow-sm" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center gap-4">
                    <UserAvatar user={{ ...profile, bingkaiGaya: bingkaiInventory?.find((b) => b.id === profile.bingkaiAktifId)?.gaya ?? null }} size="lg" />
                    <div><h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-guyub-bambuDark">{profile.nama}<img src="/logo.png" alt="Logo" className="h-5 w-5" /></h2>{profile.kategoriUsia === 'PEMUDA_18_30' && <span className="mt-1 inline-flex rounded-full bg-guyub-gula px-3 py-1 font-body text-xs font-semibold text-guyub-bambuDark">Pemuda 18–30</span>}<p className="font-body text-xs uppercase tracking-wide text-guyub-tanah">{profile.role}</p></div>
                </div>
                <div className="mt-5 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="min-w-0">
                {profile.keahlian && profile.keahlian.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {profile.keahlian.map((skill) => (
                            <SkillChip key={skill} value={skill} />
                        ))}
                    </div>
                )}
                {profile.ketersediaan && <p className="mt-2 font-body text-sm text-stone-600">Ketersediaan: {profile.ketersediaan}</p>}
                <p className="mt-2 font-body text-sm text-stone-500">Bergabung {new Date(profile.createdAt).toLocaleDateString('id-ID')}</p>
                {isMine && <div className="mt-4">
                    <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Tema tampilan</p>
                    <div className="inline-flex rounded-full bg-guyub-krem p-1">
                        <button type="button" aria-label="Gunakan tema terang" aria-pressed={(currentUser?.themePreference ?? 'LIGHT') === 'LIGHT'} onClick={() => void changeTheme('LIGHT')} className={`rounded-full p-2 transition duration-200 ${(currentUser?.themePreference ?? 'LIGHT') === 'LIGHT' ? 'bg-guyub-gula' : ''}`}><img src="/icons/matahari.svg" alt="" className={`h-5 w-5 ${(currentUser?.themePreference ?? 'LIGHT') === 'LIGHT' ? '' : 'dark:brightness-0 dark:invert'}`} /></button>
                        <button type="button" aria-label="Gunakan tema gelap" aria-pressed={currentUser?.themePreference === 'DARK'} onClick={() => void changeTheme('DARK')} className={`rounded-full p-2 transition duration-200 ${currentUser?.themePreference === 'DARK' ? 'bg-guyub-gula' : ''}`}><img src="/icons/bulan.svg" alt="" className={`h-5 w-5 ${currentUser?.themePreference === 'DARK' ? '' : 'dark:brightness-0 dark:invert'}`} /></button>
                    </div>
                    {themeError && <p role="alert" className="mt-2 font-body text-sm text-guyub-merahBata">{themeError}</p>}
                </div>}
                {isMine && <div className="mt-4">
                    <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Tampilan profil</p>
                    {bingkaiInventory ? bingkaiInventory.length === 0 ? (
                        <p className="font-body text-sm text-stone-500">Belum ada bingkai. Buka toko dari badge currency di navbar.</p>
                    ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {bingkaiInventory.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => toggleBingkai(b.dipasang ? null : b.id)}
                                    className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 font-body text-xs transition ${b.dipasang ? 'bg-guyub-gula border-guyub-gula text-guyub-bambuDark' : 'border-stone-200 bg-white text-stone-600 hover:bg-guyub-krem'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${b.dipasang ? 'border-guyub-gula' : 'border-stone-300'} border flex items-center justify-center mb-1`}>
                                        <span className="text-[10px]">{b.nama.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <span className="leading-none">{b.dipasang ? 'Pasang' : 'Pasang'}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="font-body text-sm text-stone-500">Memuat bingkai…</p>
                    )}
                </div>}
                {isMine && <div className="mt-4">
                    <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Iklan Saya</p>
                    {myIklan === null ? (
                        <p className="font-body text-sm text-stone-500">Memuat iklan…</p>
                    ) : (
                        <>
                            {myIklan.length === 0 && (
                                <p className="font-body text-sm text-stone-500">Belum ada iklan. Buat draf iklan kartu penggerak di bawah.</p>
                            )}
                            {myIklan.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {myIklan.map((iklan) => {
                                        const aktif = iklan.status === 'MENUNGGU' || iklan.status === 'DISETUJUI';
                                        return (
                                            <div key={iklan.id} className="rounded-lg border border-stone-200 p-3 bg-white">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-body text-xs font-semibold text-stone-800 line-clamp-1">{iklan.judul}</span>
                                                    <span className={`font-body text-xs font-bold px-2 py-0.5 rounded ${aktif ? 'bg-guyub-gula/10 text-guyub-bambuDark' : 'bg-stone-100 text-stone-500'}`}>
                                                        {iklan.status === 'MENUNGGU' ? 'Meninjau' : iklan.status === 'DISETUJUI' ? 'Disetujui' : iklan.status === 'DITOLAK' ? 'Ditolak' : iklan.status === 'DITARIK' ? 'Ditarik' : iklan.status === 'BERAKHIR' ? 'Berakhir' : 'Draf'}
                                                    </span>
                                                </div>
                                                <p className="font-body text-xs text-stone-600 line-clamp-1">{iklan.deskripsi}</p>
                                                <p className="mt-1 font-body text-xs text-stone-500">{iklan.bidang} · {iklan.kabupatenKota}</p>
                                                {aktif && (
                                                    <p className="mt-1 font-body text-xs text-guyub-bambuDark font-medium">Iklan aktif. Tidak dapat membuat iklan baru sampai iklan ini berakhir atau ditarik.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
                                <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Buat Draf Iklan</p>
                                <div className="space-y-2">
                                    <div>
                                        <label className="font-body text-xs text-stone-600 block mb-1">Judul (maks 40 karakter)</label>
                                        <input
                                            type="text"
                                            value={draftForm.judul}
                                            onChange={(e) => handleDraftChange('judul', e.target.value)}
                                            className={`w-full rounded-lg border px-3 py-2 font-body text-sm ${draftErrors.judul ? 'border-guyub-merahBata' : 'border-stone-300'} focus:border-guyub-bambuDark focus:ring-1 focus:ring-guyub-bambuDark`}
                                            placeholder="Judul iklan"
                                        />
                                        {draftErrors.judul && <p className="mt-1 font-body text-xs text-guyub-merahBata">{draftErrors.judul}</p>}
                                    </div>
                                    <div>
                                        <label className="font-body text-xs text-stone-600 block mb-1">Deskripsi (maks 140 karakter)</label>
                                        <textarea
                                            value={draftForm.deskripsi}
                                            onChange={(e) => handleDraftChange('deskripsi', e.target.value)}
                                            rows={3}
                                            className={`w-full rounded-lg border px-3 py-2 font-body text-sm ${draftErrors.deskripsi ? 'border-guyub-merahBata' : 'border-stone-300'} focus:border-guyub-bambuDark focus:ring-1 focus:ring-guyub-bambuDark`}
                                            placeholder="Deskripsi iklan"
                                        />
                                        <p className="mt-1 font-body text-xs text-stone-500 text-right">{draftForm.deskripsi.length}/140</p>
                                        {draftErrors.deskripsi && <p className="mt-1 font-body text-xs text-guyub-merahBata">{draftErrors.deskripsi}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="font-body text-xs text-stone-600 block mb-1">Bidang</label>
                                            <select
                                                value={draftForm.bidang}
                                                onChange={(e) => handleDraftChange('bidang', e.target.value)}
                                                className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm focus:border-guyub-bambuDark focus:ring-1 focus:ring-guyub-bambuDark"
                                            >
                                                <option value="">Pilih bidang</option>
                                                <option value="Kesehatan">Kesehatan</option>
                                                <option value="Pendidikan">Pendidikan</option>
                                                <option value="Ekonomi">Ekonomi</option>
                                                <option value="Lingkungan">Lingkungan</option>
                                                <option value="Sosial">Sosial</option>
                                                <option value="Teknologi">Teknologi</option>
                                                <option value="Budaya">Budaya</option>
                                            </select>
                                            {draftErrors.bidang && <p className="mt-1 font-body text-xs text-guyub-merahBata">{draftErrors.bidang}</p>}
                                        </div>
                                        <div>
                                            <label className="font-body text-xs text-stone-600 block mb-1">Kabupaten/Kota</label>
                                            <select
                                                value={draftForm.kabupatenKota}
                                                onChange={(e) => handleDraftChange('kabupatenKota', e.target.value)}
                                                className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm focus:border-guyub-bambuDark focus:ring-1 focus:ring-guyub-bambuDark"
                                            >
                                                <option value="">Pilih kabupaten</option>
                                                <option value="Cilacap">Cilacap</option>
                                                <option value="Banyumas">Banyumas</option>
                                                <option value="Purbalingga">Purbalingga</option>
                                                <option value="Banjarnegara">Banjarnegara</option>
                                                <option value="Kebumen">Kebumen</option>
                                                <option value="Purworejo">Purworejo</option>
                                                <option value="Wonosobo">Wonosobo</option>
                                                <option value="Magelang">Magelang</option>
                                                <option value="Boyolali">Boyolali</option>
                                                <option value="Klaten">Klaten</option>
                                                <option value="Sukoharjo">Sukoharjo</option>
                                                <option value="Wonogiri">Wonogiri</option>
                                                <option value="Karanganyar">Karanganyar</option>
                                                <option value="Sragen">Sragen</option>
                                                <option value="Grobogan">Grobogan</option>
                                                <option value="Blora">Blora</option>
                                                <option value="Rembang">Rembang</option>
                                                <option value="Pati">Pati</option>
                                                <option value="Kudus">Kudus</option>
                                                <option value="Jepara">Jepara</option>
                                                <option value="Demak">Demak</option>
                                                <option value="Semarang">Semarang</option>
                                                <option value="Temanggung">Temanggung</option>
                                                <option value="Kendal">Kendal</option>
                                                <option value="Batang">Batang</option>
                                                <option value="Pekalongan">Pekalongan</option>
                                                <option value="Pemalang">Pemalang</option>
                                                <option value="Tegal">Tegal</option>
                                                <option value="Brebes">Brebes</option>
                                                <option value="Kota Magelang">Kota Magelang</option>
                                                <option value="Kota Surakarta">Kota Surakarta</option>
                                                <option value="Kota Salatiga">Kota Salatiga</option>
                                                <option value="Kota Semarang">Kota Semarang</option>
                                                <option value="Kota Pekalongan">Kota Pekalongan</option>
                                                <option value="Kota Tegal">Kota Tegal</option>
                                            </select>
                                            {draftErrors.kabupatenKota && <p className="mt-1 font-body text-xs text-guyub-merahBata">{draftErrors.kabupatenKota}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={simpanDraf}
                                            disabled={iklanActionLoading}
                                            className="w-full rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {iklanActionLoading ? 'Menyimpan…' : 'Simpan Draf'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowPreview(true); }}
                                            disabled={iklanActionLoading || Object.keys(draftErrors).length > 0}
                                            className="w-full rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Pratinjau
                                        </button>
                                    </div>
                                    {iklanMessage && <p className="mt-2 font-body text-sm text-guyub-bambuDark">{iklanMessage}</p>}
                                </div>
                            </div>
                            {showPreview && (
                                <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
                                    <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-guyub-tanah">Pratinjau</p>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-body text-xs text-stone-600">Tema:</span>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewTheme('LIGHT')}
                                            className={`rounded-full px-3 py-1 font-body text-xs transition ${previewTheme === 'LIGHT' ? 'bg-guyub-gula text-guyub-bambuDark' : 'bg-stone-200 text-stone-600'}`}
                                        >
                                            Terang
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewTheme('DARK')}
                                            className={`rounded-full px-3 py-1 font-body text-xs transition ${previewTheme === 'DARK' ? 'bg-guyub-gula text-guyub-bambuDark' : 'bg-stone-200 text-stone-600'}`}
                                        >
                                            Gelap
                                        </button>
                                    </div>
                                    <div className={`w-[320px] rounded-xl border border-stone-200 overflow-hidden shadow-sm ${previewTheme === 'DARK' ? 'bg-stone-900' : 'bg-white'}`}>
                                        <div className="flex items-center justify-between px-3 py-2 bg-guyub-krem">
                                            <span className="font-body text-xs font-semibold uppercase tracking-wide text-guyub-bambuDark">Sorotan</span>
                                        </div>
                                        <div className="p-3">
                                            <h3 className={`font-display text-sm font-semibold line-clamp-1 ${previewTheme === 'DARK' ? 'text-white' : 'text-guyub-bambuDark'}`}>{draftForm.judul}</h3>
                                            <p className={`mt-1 font-body text-xs line-clamp-2 ${previewTheme === 'DARK' ? 'text-stone-300' : 'text-stone-600'}`}>{draftForm.deskripsi}</p>
                                            <div className="mt-2 flex items-center gap-1">
                                                <span className={`font-body text-xs ${previewTheme === 'DARK' ? 'text-stone-400' : 'text-stone-500'}`}>{currentUser?.nama}</span>
                                                <span className={`font-body text-xs ${previewTheme === 'DARK' ? 'text-stone-500' : 'text-stone-400'}`}>·</span>
                                                <span className={`font-body text-xs ${previewTheme === 'DARK' ? 'text-stone-400' : 'text-stone-500'}`}>{draftForm.kabupatenKota}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={ajukanIklan}
                                            disabled={iklanActionLoading || Object.keys(draftErrors).length > 0 || myIklan?.some((i) => i.status === 'MENUNGGU' || i.status === 'DISETUJUI')}
                                            className={`flex-1 rounded-full ${iklanActionLoading || Object.keys(draftErrors).length > 0 || myIklan?.some((i) => i.status === 'MENUNGGU' || i.status === 'DISETUJUI') ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-guyub-bambuDark text-white hover:bg-guyub-bambuDark/90'} px-4 py-2 font-body text-sm font-medium disabled:opacity-50`}
                                        >
                                            {iklanActionLoading ? 'Mengajukan…' : myIklan?.some((i) => i.status === 'MENUNGGU' || i.status === 'DISETUJUI') ? 'Iklan Aktif' : 'Ajukan'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPreview(false)}
                                            className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 hover:bg-stone-50"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>}
                {isMine && levelInfo && <div className="mt-4 rounded-2xl bg-guyub-krem p-4">
                    <div className="flex items-center gap-1" aria-label={`XP ${levelInfo.persen}% menuju level berikutnya`}>
                        {Array.from({ length: 10 }, (_, index) => <span key={index} className={`h-3 flex-1 rounded-sm ${index < Math.round(levelInfo.persen / 10) ? 'bg-guyub-gula' : 'bg-stone-200 dark:bg-stone-700'}`} />)}
                        <span className="ml-2 min-w-10 text-right font-body text-xs text-guyub-bambuDark">{levelInfo.persen}%</span>
                    </div>
                    <p className="mt-2 font-display text-lg font-semibold text-guyub-bambuDark">Level {levelInfo.level}</p>
                    <p className="font-body text-xs text-stone-600">{levelInfo.xpSaatIni} / {levelInfo.xpDibutuhkan} XP</p>
                </div>}
                {profile.dusun && <p className="mt-1 font-body text-sm text-stone-500">{profile.dusun}</p>}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-display text-lg font-semibold text-guyub-bambuDark">Bio</h3>
                        {editing ? (
                            <div className="mt-3">
                                <ProfileEditForm
                                    key={profile.id}
initialValues={{
                                         ...emptyProfileEditValues(profile?.nama),
                                         phone: profile?.phone?.replace(/^\+62/, '') ?? '',
                                         kabupatenKota: profile?.kabupatenKota ?? '',
                                         bio: profile?.bio ?? '',
                                         avatarUrl: profile?.avatarUrl ?? '',
                                         keahlian: profile?.keahlian ?? [],
                                         ketersediaan: profile?.ketersediaan ?? '',
                                       }}
                                    role={profile.role}
                                    onSubmit={saveProfile}
                                    error={error}
                                    onAvatarUploaded={(avatarUrl) => {
                                        setProfile((current) => current ? { ...current, avatarUrl } : current);
                                        updateUser({ avatarUrl });
                                    }}
                                    onCancel={() => { setEditing(false); setError(null); }}
                                />
                            </div>
                        ) : (
                            <>
                                <p className="mt-2 whitespace-pre-line break-words font-body text-stone-700">{profile.bio || 'Belum ada bio.'}</p>
                                {isMine && <button type="button" onClick={() => setEditing(true)} className="mt-4 rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700">Edit</button>}
                            </>
                        )}
                        {!editing && profile.role === 'PENGGERAK' && profile.phone && <div className="mt-4"><WhatsAppButton phone={profile.phone} /></div>}
                    </div>
                </div>
                {isMine && (
                    <div className="mt-6">
                        <h3 className="font-display text-lg font-semibold text-guyub-bambuDark">Portofolio</h3>
                        {portfolioLoading ? (
                            <p className="font-body text-sm text-stone-600">Memuat portofolio…</p>
                        ) : portfolios.length === 0 ? (
                            <p className="font-body text-sm text-stone-500">Belum ada portofolio yang ditampilkan.</p>
                        ) : (
                            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {portfolios.map((p) => (
                                    <div key={p.id} className="rounded-xl border-2 border-yellow-400 bg-white p-3 shadow-sm">
                                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-2">
                                            {p.beforeImageUrl && (
                                                <img src={p.beforeImageUrl} alt="Sebelum" className="w-full h-full object-cover" />
                                            )}
                                            {p.afterImageUrl && (
                                                <img src={p.afterImageUrl} alt="Sesudah" className="w-full h-full object-cover absolute inset-0 opacity-60" />
                                            )}
                                        </div>
                                        <h4 className="font-display font-semibold text-guyub-bambuDark">{p.title}</h4>
                                        <SkillChip value={p.category} />
                                        <p className="mt-1 font-body text-xs text-stone-600 line-clamp-2">{p.description}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => copySummary(p)}
                                                className="flex-1 rounded-full border border-stone-300 px-3 py-1 font-body text-xs text-stone-600 hover:bg-stone-50"
                                            >
                                                Salin Ringkasan
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => downloadCard(p)}
                                                className="rounded-full border border-stone-300 px-3 py-1 font-body text-xs text-stone-600 hover:bg-stone-50"
                                            >
                                                Unduh Kartu
                                            </button>
                                        </div>
                                        {copyConfirm && <p className="mt-2 font-body text-xs text-guyub-bambuDark">{copyConfirm}</p>}
                                        {copyText && (
                                            <div className="mt-2 rounded-lg border border-stone-300 bg-white p-2">
                                                <textarea
                                                    readOnly
                                                    value={copyText}
                                                    className="w-full font-body text-xs text-stone-700 bg-transparent border-none focus:ring-0"
                                                    rows={4}
                                                />
                                                <p className="mt-1 font-body text-xs text-stone-500 text-right">Salin teks di atas secara manual.</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {ratings && (
                    <div className="mt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <img key={star} src={ratings.avgScore >= star ? '/icons/bintang-isi.svg' : '/icons/bintang.svg'} alt="" className="h-4 w-4" />
                                ))}
                            </div>
                            <span className="font-display font-semibold text-guyub-bambuDark">{ratings.avgScore.toFixed(1)}</span>
                            <span className="font-body text-xs text-stone-500">({ratings.jumlahUlasan} ulasan)</span>
                            {ratings.avgScore >= 4.5 && ratings.jumlahUlasan >= 5 && (
                                <span className="rounded-full border border-guyub-gula bg-guyub-gula/10 px-2.5 py-0.5 font-body text-xs tracking-wide uppercase text-guyub-bambuDark">Terpercaya</span>
                            )}
                        </div>
                        {ratings.ulasan.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {ratings.ulasan.map((u) => (
                                    <div key={u.id} className="rounded-lg bg-guyub-krem p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <img key={star} src={u.score >= star ? '/icons/bintang-isi.svg' : '/icons/bintang.svg'} alt="" className="h-4 w-4" />
                                                ))}
                                            </div>
                                            <p className="font-body text-xs text-stone-500">{new Date(u.createdAt).toLocaleDateString('id-ID')}</p>
                                        </div>
                                        <p className="mt-1 font-body text-sm text-stone-700 line-clamp-2">{u.comment ?? '-'}</p>
                                        <p className="mt-1 font-body text-xs text-stone-500">Dari {u.fromUser.nama}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {ratings.jumlahUlasan === 0 && (
                            <p className="mt-3 font-body text-sm text-stone-500">Belum ada ulasan.</p>
                        )}
                    </div>
                )}
                <div className="mt-5 border-t border-stone-100 pt-4">
                    <button type="button" onClick={() => setShowNoteEditor((current) => !current)} className="font-body text-sm font-medium text-guyub-bambuDark flex items-center gap-1">
                        <img src="/icons/catatan.svg" alt="" className="h-4 w-4 dark:brightness-0 dark:invert" />
                        Catatan...
                    </button>
                    {showNoteEditor && <form onSubmit={saveNote} className="mt-3 space-y-2"><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} maxLength={500} rows={3} required placeholder="Catatan pribadi..." className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body text-sm" /><button type="submit" className="rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm text-white">Simpan catatan</button></form>}
                    {notes.length > 0 && <div className="mt-3 space-y-2">{notes.map((note) => <div key={note.id} className="rounded-lg bg-guyub-krem px-3 py-2"><p className="font-body text-sm text-stone-700">{note.isi}</p><button type="button" onClick={async () => { await api.delete(`/users/${profile.id}/notes/${note.id}`); setNotes((current) => current.filter((item) => item.id !== note.id)); }} className="mt-1 font-body text-xs text-guyub-merahBata underline">Hapus</button></div>)}</div>}
                </div>
                {!isMine && (
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('guyub:open-messages', { detail: { userId: profile.id } }))}
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-guyub-bambuDark px-4 py-2 font-body text-sm font-medium text-guyub-bambuDark transition hover:bg-guyub-krem"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="M3 7l9 6 9-6" />
                        </svg>
                        Kirim Pesan
                    </button>
                )}
            </section>
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserAvatar } from '@/components/UserIdentity';
import { SkillChip, skillLabel } from '@/components/SkillChip';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import type { ThemePreference } from '@/lib/auth-store';

interface Profile {
    id: string;
    nama: string;
    phone?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    dusun?: string | null;
    role: string;
    keahlian?: string[];
    ketersediaan?: string | null;
    tanggalLahir?: string | null;
    kategoriUsia?: 'PEMUDA_18_30' | 'DEWASA' | null;
    themePreference?: ThemePreference;
    createdAt: string;
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
    const [form, setForm] = useState({ nama: '', phone: '', bio: '', avatarUrl: '', keahlian: [] as string[], ketersediaan: '', tanggalLahir: '' });
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<ProfileNote[]>([]);
    const [noteText, setNoteText] = useState('');
    const [showNoteEditor, setShowNoteEditor] = useState(false);
    const [themeError, setThemeError] = useState<string | null>(null);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [ratings, setRatings] = useState<{ avgScore: number; jumlahUlasan: number; ulasan: any[] } | null>(null);
    const [ratingsLoading, setRatingsLoading] = useState(false);

    useEffect(() => {
        async function openProfile(event: Event) {
            const userId = (event as CustomEvent<{ userId: string }>).detail.userId;
            const response = await api.get(userId === currentUser?.id ? '/users/me/profile' : `/users/${userId}`);
            const data = response.data as Profile;
            setProfile(data);
            if (userId === currentUser?.id) {
                const levelResponse = await api.get('/users/me/level');
                setLevelInfo(levelResponse.data);
            } else {
                setLevelInfo(null);
            }
            setForm({
                nama: data.nama,
                phone: data.phone?.replace(/^\+62/, '') ?? '',
                bio: data.bio ?? '',
                avatarUrl: data.avatarUrl ?? '',
                keahlian: Array.isArray(data.keahlian) ? data.keahlian : [],
                ketersediaan: data.ketersediaan ?? '',
                tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir).toISOString().slice(0, 10) : '',
            });
            setEditing(false);
            setError(null);
            setThemeError(null);
            const notesResponse = await api.get(`/users/${userId}/notes`);
            setNotes(notesResponse.data);
            setNoteText('');
            setShowNoteEditor(false);

            // Muat portofolio relawan (hanya yang dipublikasikan)
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

    async function saveProfile(event: React.FormEvent) {
        event.preventDefault();
        try {
            const response = await api.patch('/users/me/profile', {
                ...form,
                phone: form.phone ? `+62${form.phone.replace(/\D/g, '')}` : null,
                tanggalLahir: form.tanggalLahir || undefined,
                ketersediaan: form.ketersediaan || undefined,
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

    async function uploadAvatar(file: File | undefined) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Foto profil maksimal 5 MB.');
            return;
        }
        const data = new FormData();
        data.append('file', file);
        const response = await api.post('/uploads/image', data);
        setForm((current) => ({ ...current, avatarUrl: response.data.url }));
        setError(null);
    }

    async function copySummary(portfolio: any) {
        const text = [
            `Judul: ${portfolio.title}`,
            `Kategori: ${skillLabel(portfolio.category)}`,
            `Deskripsi: ${portfolio.description}`,
            `Tautan: ${window.location.origin}/volunteer/${portfolio.volunteerId}/portfolio`,
        ].join('\n\n');
        try {
            await navigator.clipboard.writeText(text);
            setError('Ringkasan disalin ke papan klip.');
            setTimeout(() => setError(null), 3000);
        } catch {
            setError('Gagal menyalin ringkasan.');
        }
    }

    async function downloadCard(portfolio: any) {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = portfolio.afterImageUrl;
            await new Promise<void>((resolve) => { img.onload = () => resolve(); });
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 627;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = '#F7F2E9';
            ctx.fillRect(0, 0, 1200, 627);
            ctx.drawImage(img, 0, 0, 480, 320);
            ctx.fillStyle = '#2A4A32';
            ctx.font = 'bold 48px "Helvetica Now Display Cn Med", sans-serif';
            ctx.fillText(portfolio.title, 520, 200);
            ctx.font = '24px "Helvetica Now Display Cn Med", sans-serif';
            ctx.fillText(`Kategori: ${skillLabel(portfolio.category)}`, 520, 260);
            ctx.fillText(`Usaha: ${portfolio.umkmNeed?.namaUsaha ?? '-'}`, 520, 300);
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `portofolio-${portfolio.title.replace(/\s+/g, '_')}.png`;
            link.href = url;
            link.click();
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
                    <UserAvatar user={profile} size="lg" />
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
                            <textarea
                                form="profile-edit-form"
                                aria-label="Bio"
                                value={form.bio}
                                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                                maxLength={280}
                                className="mt-2 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                                placeholder="Bio singkat"
                            />
                        ) : (
                            <p className="mt-2 whitespace-pre-line break-words font-body text-stone-700">{profile.bio || 'Belum ada bio.'}</p>
                        )}
                        {!editing && profile.phone && <div className="mt-4"><WhatsAppButton phone={profile.phone} /></div>}
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
                {isMine && !editing && <button type="button" onClick={() => setEditing(true)} className="mt-5 rounded-full border border-stone-300 px-4 py-2 font-body text-sm">✎ Edit</button>}
                {isMine && editing && <form id="profile-edit-form" onSubmit={saveProfile} className="mt-5 space-y-3">
                    <div>
                        <label htmlFor="profile-name" className="block font-body text-sm font-medium text-stone-700">Nama</label>
                        <input id="profile-name" value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} maxLength={20} required className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800" placeholder="Nama" />
                        <p className={`mt-1 text-right font-body text-xs ${form.nama.length > 20 ? 'text-guyub-merahBata' : 'text-stone-500'}`}>{form.nama.length}/20</p>
                        {form.nama.length > 20 && <p role="alert" className="font-body text-sm text-guyub-merahBata">Nama melebihi 20 karakter. Perbaiki nama sebelum menyimpan.</p>}
                    </div>
                    <div>
                        <label htmlFor="profile-phone" className="block font-body text-sm font-medium text-stone-700">Nomor WhatsApp</label>
                        <div className="mt-1 flex rounded-lg border border-stone-300 bg-white">
                            <span className="inline-flex items-center border-r border-stone-300 px-3 font-body text-stone-700">+62</span>
                            <input id="profile-phone" inputMode="numeric" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13) })} maxLength={13} className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2 font-body text-stone-800 outline-none" placeholder="8123456789" />
                        </div>
                        <p className="mt-1 font-body text-xs text-stone-600">Opsional. Dipakai agar orang bisa menghubungimu lewat WhatsApp.</p>
                    </div>
                    <section className="space-y-3 rounded-2xl border-2 border-yellow-400 bg-white p-4 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-guyub-bambuDark">Keahlian &amp; Ketersediaan</h3>
                        <div>
                            <label className="block font-body text-sm font-medium text-stone-700">Tanggal lahir (tidak ditampilkan ke orang lain)</label>
                            <input type="date" value={form.tanggalLahir} onChange={(event) => setForm({ ...form, tanggalLahir: event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body" />
                        </div>
                        <div>
                            <label className="block font-body text-sm font-medium text-stone-700">Keahlian <span className="font-normal text-stone-500">({form.keahlian.length}/10)</span></label>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {form.keahlian.map((skill) => (
                                    <SkillChip
                                        key={skill}
                                        value={skill}
                                        selected
                                        onToggle={() =>
                                            setForm((current) => ({
                                                ...current,
                                                keahlian: current.keahlian.filter((item) => item !== skill),
                                            }))
                                        }
                                    />
                                ))}
                                {form.keahlian.length < 10 && (
                                    <select
                                        value=""
                                        onChange={(event) => {
                                            const val = event.target.value;
                                            if (val && !form.keahlian.includes(val)) {
                                                setForm((current) => ({
                                                    ...current,
                                                    keahlian: [...current.keahlian, val],
                                                }));
                                            }
                                            event.target.value = '';
                                        }}
                                        className="rounded-lg border border-stone-300 px-3 py-1.5 font-body text-xs"
                                    >
                                        <option value="">+ Tambah keterampilan</option>
                                        {KATEGORI_KETERAMPILAN.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block font-body text-sm font-medium text-stone-700">Ketersediaan</label>
                            <textarea value={form.ketersediaan} onChange={(event) => setForm({ ...form, ketersediaan: event.target.value })} maxLength={200} rows={2} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body" placeholder="contoh: Sabtu pagi, Minggu sore" />
                            <p className="mt-1 text-right font-body text-xs text-stone-500">{form.ketersediaan.length}/200</p>
                        </div>
                    </section>
                    <input type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} className="block w-full text-sm" />
                    {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}
                    <button type="submit" disabled={form.nama.length > 20} className="rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">Simpan</button>
                </form>}
            </section>
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserAvatar } from '@/components/UserIdentity';
import type { ThemePreference } from '@/lib/auth-store';

interface Profile {
    id: string;
    nama: string;
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

export function ProfileOverlay() {
    const currentUser = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const setThemePreference = useAuthStore((state) => state.setThemePreference);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ nama: '', bio: '', avatarUrl: '', keahlian: [] as string[], ketersediaan: '', tanggalLahir: '' });
    const [skillDraft, setSkillDraft] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<ProfileNote[]>([]);
    const [noteText, setNoteText] = useState('');
    const [showNoteEditor, setShowNoteEditor] = useState(false);
    const [themeError, setThemeError] = useState<string | null>(null);

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
                bio: data.bio ?? '',
                avatarUrl: data.avatarUrl ?? '',
                keahlian: Array.isArray(data.keahlian) ? data.keahlian : [],
                ketersediaan: data.ketersediaan ?? '',
                tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir).toISOString().slice(0, 10) : '',
            });
            setEditing(false);
            setSkillDraft('');
            setError(null);
            setThemeError(null);
            const notesResponse = await api.get(`/users/${userId}/notes`);
            setNotes(notesResponse.data);
            setNoteText('');
            setShowNoteEditor(false);
        }
        window.addEventListener('guyub:open-profile', openProfile);
        return () => window.removeEventListener('guyub:open-profile', openProfile);
    }, [currentUser?.id]);

    async function saveProfile(event: React.FormEvent) {
        event.preventDefault();
        try {
            const response = await api.patch('/users/me/profile', {
                ...form,
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

    function addSkill(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const skill = skillDraft.trim().replace(/\s+/g, ' ');
        if (skill.length < 2 || skill.length > 30 || form.keahlian.length >= 10) return;
        if (!form.keahlian.some((item) => item.toLocaleLowerCase() === skill.toLocaleLowerCase())) {
            setForm((current) => ({ ...current, keahlian: [...current.keahlian, skill] }));
        }
        setSkillDraft('');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6" role="dialog" aria-modal="true" onClick={() => setProfile(null)}>
            <section className="w-full max-w-sm rounded-2xl border-2 border-yellow-400 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center gap-4">
                    <UserAvatar user={profile} size="lg" />
                    <div><h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-guyub-bambuDark">{profile.nama}<img src="/logo.png" alt="Logo" className="h-5 w-5" /></h2>{profile.kategoriUsia === 'PEMUDA_18_30' && <span className="mt-1 inline-flex rounded-full bg-guyub-gula px-3 py-1 font-body text-xs font-semibold text-guyub-bambuDark">Pemuda 18–30</span>}<p className="font-body text-xs uppercase tracking-wide text-guyub-tanah">{profile.role}</p></div>
                </div>
                <p className="mt-5 whitespace-pre-line font-body text-stone-700">{profile.bio || 'Belum ada bio.'}</p>
                {profile.keahlian && profile.keahlian.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {profile.keahlian.map((skill) => (
                            <span key={skill} className="rounded-full bg-guyub-krem px-2 py-1 font-body text-[10px] text-guyub-bambuDark">{skill}</span>
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
                {isMine && editing && <form onSubmit={saveProfile} className="mt-5 space-y-3">
                    <input value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} required className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body" placeholder="Nama" />
                    <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength={280} rows={3} className="w-full rounded-lg border border-stone-300 px-3 py-2 font-body" placeholder="Bio singkat" />
                    <section className="space-y-3 rounded-2xl border-2 border-yellow-400 bg-white p-4 shadow-sm">
                        <h3 className="font-display text-lg font-semibold text-guyub-bambuDark">Keahlian &amp; Ketersediaan</h3>
                        <div>
                            <label className="block font-body text-sm font-medium text-stone-700">Tanggal lahir (tidak ditampilkan ke orang lain)</label>
                            <input type="date" value={form.tanggalLahir} onChange={(event) => setForm({ ...form, tanggalLahir: event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body" />
                        </div>
                        <div>
                            <label className="block font-body text-sm font-medium text-stone-700">Keahlian <span className="font-normal text-stone-500">({form.keahlian.length}/10)</span></label>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {form.keahlian.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-guyub-krem px-3 py-1 font-body text-xs text-guyub-bambuDark">{skill}<button type="button" aria-label={`Hapus keahlian ${skill}`} onClick={() => setForm((current) => ({ ...current, keahlian: current.keahlian.filter((item) => item !== skill) }))} className="font-semibold text-guyub-merahBata">×</button></span>)}
                            </div>
                            <input value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={addSkill} maxLength={30} disabled={form.keahlian.length >= 10} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 font-body disabled:bg-stone-100" placeholder="Ketik keahlian lalu tekan Enter" />
                        </div>
                        <div>
                            <label className="block font-body text-sm font-medium text-stone-700">Ketersediaan</label>
                            <textarea value={form.ketersediaan} onChange={(event) => setForm({ ...form, ketersediaan: event.target.value })} maxLength={200} rows={2} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-body" placeholder="contoh: Sabtu pagi, Minggu sore" />
                            <p className="mt-1 text-right font-body text-xs text-stone-500">{form.ketersediaan.length}/200</p>
                        </div>
                    </section>
                    <input type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} className="block w-full text-sm" />
                    {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}
                    <button type="submit" className="rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm text-white">Simpan</button>
                </form>}
            </section>
        </div>
    );
}
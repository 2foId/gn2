'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserIdentity } from '@/components/UserIdentity';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '');
const CATEGORY_LABELS: Record<string, string> = {
    RESEP: 'Resep', KERAJINAN: 'Kerajinan', PERTANIAN: 'Pertanian', FILOSOFI: 'Filosofi',
    LITERASI_DIGITAL: 'Literasi Digital', LITERASI_KEUANGAN: 'Literasi Keuangan',
    LITERASI_KESEHATAN: 'Literasi Kesehatan', SEJARAH_BUDAYA: 'Sejarah & Budaya', BEBAS: 'Bebas',
};
const CATEGORY_BADGES: Record<string, string> = {
    RESEP: '/icons/badge-resep.svg', KERAJINAN: '/icons/badge-kerajinan.svg',
    PERTANIAN: '/icons/badge-pertanian.svg', FILOSOFI: '/icons/badge-filosofi.svg',
    LITERASI_DIGITAL: '/icons/badge-literasi-digital.svg', LITERASI_KEUANGAN: '/icons/badge-literasi-keuangan.svg',
    LITERASI_KESEHATAN: '/icons/badge-literasi-kesehatan.svg', SEJARAH_BUDAYA: '/icons/badge-sejarah-budaya.svg',
    BEBAS: '/icons/badge-umum.svg',
};

type QuestStatus = 'TERKUNCI' | 'TERBUKA' | 'LULUS';
interface QuizQuestion { pertanyaan: string; opsi: string[] }
interface Quest {
    id: string;
    wasiatId: string;
    urutan: number;
    judul: string;
    tujuan: string;
    kuis: QuizQuestion[];
    status: QuestStatus;
    progress: { id: string; skor: number; lulus: boolean; percobaan: number } | null;
}
interface Comment {
    id: string; isi: string; rating: number; createdAt: string;
    user: { id: string; nama: string; avatarUrl?: string | null };
}
interface WasiatDetail {
    id: string; judul: string; kategori: string; isi: string; poinKiat: string[]; foto: string[];
    penulis: { id: string; nama: string; avatarUrl?: string | null };
    comments: Comment[];
}
interface QuizResult {
    skor: number; lulus: boolean; benar: number; total: number; xpDidapat: number;
    badgeBaru: { kategori: string; penjelajahKearifan: boolean } | null;
    jawabanBenar: number[];
}
interface FeedbackEntry {
    id: string; skor: number; langkah: { urutan: number; judul: string };
    user: { id: string; nama: string; avatarUrl?: string | null };
}

export default function WasiatDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const user = useAuthStore((state) => state.user);
    const [wasiat, setWasiat] = useState<WasiatDetail | null>(null);
    const [steps, setSteps] = useState<Quest[]>([]);
    const [totalXp, setTotalXp] = useState(0);
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, number[]>>({});
    const [results, setResults] = useState<Record<string, QuizResult>>({});
    const [feedbackQueue, setFeedbackQueue] = useState<FeedbackEntry[]>([]);
    const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'quest' | 'feedback'>('quest');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [commentText, setCommentText] = useState('');
    const [rating, setRating] = useState(0);

    const selectedQuest = steps.find((step) => step.id === selectedQuestId) ?? null;
    const passedCount = steps.filter((step) => step.status === 'LULUS').length;
    const isAuthor = !!user && wasiat?.penulis.id === user.id;
    const isExplorer = steps.length > 0 && passedCount === steps.length;

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [detailRes, stepsRes, progressRes] = await Promise.all([
                api.get(`/wasiat/${id}`),
                api.get(`/wasiat/${id}/langkah`),
                api.get('/wasiat/saya/progress'),
            ]);
            setWasiat(detailRes.data);
            setSteps(stepsRes.data);
            const userProgress = progressRes.data.progress ?? [];
            setTotalXp(userProgress.filter((entry: any) => entry.wasiatId === id && entry.lulus && entry.wasiat.penulis.id !== user?.id).length * 100);
            if (user && detailRes.data.penulis?.id === user.id) {
                const feedbackRes = await api.get(`/wasiat/${id}/feedback/menunggu`);
                setFeedbackQueue(feedbackRes.data);
            } else {
                setFeedbackQueue([]);
            }
        } catch (err: any) {
            setError(err.response?.data?.message);
        } finally {
            setLoading(false);
        }
    }, [id, user?.id]);

    useEffect(() => { void loadData(); }, [loadData]);

    async function submitQuest(quest: Quest) {
        const selected = answers[quest.id] ?? [];
        if (selected.length !== quest.kuis.length || submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const response = await api.post(`/wasiat/${id}/langkah/${quest.urutan}/submit`, { jawaban: selected });
            setResults((current) => ({ ...current, [quest.id]: response.data }));
            if (response.data.xpDidapat > 0) window.dispatchEvent(new Event('guyub:level-updated'));
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message);
        } finally {
            setSubmitting(false);
        }
    }

    function focusNextQuest(quest: Quest) {
        const next = steps.find((step) => step.urutan > quest.urutan);
        setSelectedQuestId(null);
        if (next) {
            window.setTimeout(() => {
                const node = document.getElementById(`quest-node-${next.id}`);
                node?.scrollIntoView({ block: 'center' });
                node?.focus();
            }, 0);
        }
    }

    async function sendFeedback(progressId: string) {
        const catatan = feedbackNotes[progressId]?.trim() ?? '';
        if (!catatan || catatan.length > 300) return;
        try {
            await api.post(`/wasiat/${id}/feedback`, { progressId, catatan });
            setFeedbackQueue((current) => current.filter((entry) => entry.id !== progressId));
            setFeedbackNotes((current) => ({ ...current, [progressId]: '' }));
        } catch (err: any) {
            setError(err.response?.data?.message);
        }
    }

    async function sendComment(event: React.FormEvent) {
        event.preventDefault();
        if (!commentText.trim() || !rating) return;
        try {
            await api.post(`/wasiat/${id}/komentar`, { isi: commentText.trim(), rating });
            setCommentText('');
            setRating(0);
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message);
        }
    }

    if (loading) return <p className="font-body text-sm text-stone-600">Memuat pohon quest…</p>;
    if (!wasiat) return <p className="font-body text-sm text-guyub-merahBata">{error || 'Wasiat tidak ditemukan.'}</p>;

    return (
        <main className="guyub-pattern -m-6 min-h-screen p-5 md:p-8">
            <div className="mx-auto max-w-5xl">
                <header className="rounded-2xl border-2 border-yellow-400 bg-white p-5 shadow-sm md:p-7">
                    <span className="rounded-full bg-guyub-krem px-3 py-1 font-body text-xs font-semibold text-guyub-bambuDark">
                        {CATEGORY_LABELS[wasiat.kategori] ?? wasiat.kategori}
                    </span>
                    <h1 className="mt-3 font-display text-3xl font-semibold text-guyub-bambuDark">{wasiat.judul}</h1>
                    <p className="mt-1 font-body text-sm text-stone-600">oleh <UserIdentity user={wasiat.penulis} /></p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-guyub-krem px-4 py-2 font-body text-sm font-semibold text-guyub-bambuDark">
                            <img src="/icons/xp.svg" alt="" className="h-5 w-5 dark:brightness-0 dark:invert" /> XP: {totalXp}
                        </span>
                        {isExplorer && <span className="inline-flex items-center gap-2 rounded-full bg-guyub-gula/25 px-4 py-2 font-body text-sm font-semibold text-guyub-bambuDark"><img src="/icons/badge-penjelajah.svg" alt="" className="h-5 w-5 dark:brightness-0 dark:invert" />Penjelajah Kearifan</span>}
                        <span className="font-body text-sm text-stone-600">{passedCount} dari {steps.length} quest selesai</span>
                    </div>
                    <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-guyub-krem" role="progressbar" aria-valuenow={passedCount} aria-valuemin={0} aria-valuemax={steps.length}>
                        <div className="h-full rounded-full bg-guyub-gula" style={{ width: `${steps.length ? (passedCount / steps.length) * 100 : 0}%` }} />
                    </div>
                </header>

                {error && <p role="alert" className="mt-4 rounded-xl bg-white px-4 py-3 font-body text-sm text-guyub-merahBata">{error}</p>}

                {isAuthor && (
                    <div className="mt-5 flex gap-2" role="tablist" aria-label="Bagian halaman wasiat">
                        <button type="button" role="tab" aria-selected={activeTab === 'quest'} onClick={() => setActiveTab('quest')} className={`rounded-full px-4 py-2 font-body text-sm ${activeTab === 'quest' ? 'bg-guyub-bambuDark text-white' : 'bg-white text-stone-700'}`}>Pohon Quest</button>
                        <button type="button" role="tab" aria-selected={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} className={`rounded-full px-4 py-2 font-body text-sm ${activeTab === 'feedback' ? 'bg-guyub-bambuDark text-white' : 'bg-white text-stone-700'}`}>Feedback Quest ({feedbackQueue.length})</button>
                    </div>
                )}

                {activeTab === 'quest' && (
                    <section className="mt-6 rounded-2xl border-2 border-yellow-400 bg-white/90 p-5 shadow-sm md:p-10" aria-label="Pohon kemajuan quest">
                        <div className="mx-auto max-w-3xl">
                            {steps.length === 0 ? <p className="font-body text-sm text-stone-600">Belum ada quest untuk wasiat ini.</p> : steps.map((quest, index) => {
                                const finalQuest = index === steps.length - 1;
                                const passed = quest.status === 'LULUS';
                                const locked = quest.status === 'TERKUNCI';
                                const result = results[quest.id];
                                const selectedAnswers = answers[quest.id] ?? [];
                                const size = finalQuest ? 'h-[104px] w-[104px]' : 'h-[88px] w-[88px]';
                                const nodeTone = locked ? 'bg-stone-200 opacity-70' : passed ? 'bg-guyub-bambuDark' : 'border-4 border-white bg-guyub-gula ring-4 ring-guyub-gula/40';
                                const nodeIcon = locked ? '/icons/gembok.svg' : finalQuest ? '/icons/piala.svg' : passed ? '/icons/centang.svg' : CATEGORY_BADGES[wasiat.kategori] ?? '/icons/badge-penjelajah.svg';
                                return (
                                    <div key={quest.id}>
                                        <div className={`flex justify-center ${index % 2 === 0 ? 'md:justify-start md:pl-[12%]' : 'md:justify-end md:pr-[12%]'}`}>
                                            <button
                                                id={`quest-node-${quest.id}`}
                                                type="button"
                                                disabled={locked}
                                                title={locked ? 'Selesaikan quest sebelumnya dulu.' : quest.judul}
                                                onClick={() => { setSelectedQuestId(quest.id); setError(''); }}
                                                className={`group flex w-48 flex-col items-center text-center font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guyub-bambuDark ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <span className={`relative flex ${size} items-center justify-center rounded-full shadow-sm ${nodeTone} ${!locked && !passed ? 'animate-quest-pulse' : ''}`}>
                                                    <img src={nodeIcon} alt="" className={`${finalQuest ? 'h-11 w-11' : 'h-9 w-9'} ${passed && !finalQuest ? 'brightness-0 invert' : ''}`} />
                                                    {passed && <span className="absolute -right-5 top-0 rounded-full bg-guyub-gula px-2 py-1 text-[10px] font-bold text-guyub-bambuDark">+100 XP</span>}
                                                </span>
                                                <span className="mt-3 font-body text-sm font-semibold text-guyub-bambuDark">Quest {quest.urutan} · {quest.judul}</span>
                                                {finalQuest && <span className="mt-1 rounded-full bg-guyub-gula/25 px-3 py-1 font-body text-xs font-semibold text-guyub-bambuDark">Quest Akhir</span>}
                                                {locked && <span className="sr-only">Selesaikan quest sebelumnya dulu.</span>}
                                            </button>
                                        </div>
                                        {index < steps.length - 1 && <div aria-hidden="true" className={`mx-auto h-14 w-0 border-l-4 ${passed ? 'border-solid border-guyub-bambu' : 'border-dashed border-stone-300'}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {isAuthor && activeTab === 'feedback' && (
                    <section className="mt-6 space-y-4">
                        {feedbackQueue.length === 0 ? <p className="rounded-2xl bg-white p-5 font-body text-sm text-stone-600">Belum ada feedback quest yang menunggu.</p> : feedbackQueue.map((entry) => (
                            <article key={entry.id} className="rounded-2xl border-2 border-yellow-400 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <UserIdentity user={entry.user} />
                                    <span className="font-body text-sm font-semibold text-guyub-bambuDark">Quest {entry.langkah.urutan} · Skor {entry.skor}%</span>
                                </div>
                                <h2 className="mt-2 font-display text-lg font-semibold text-guyub-bambuDark">{entry.langkah.judul}</h2>
                                <textarea value={feedbackNotes[entry.id] ?? ''} onChange={(event) => setFeedbackNotes((current) => ({ ...current, [entry.id]: event.target.value.slice(0, 300) }))} maxLength={300} rows={3} placeholder="Tulis catatan untuk pembaca..." className="mt-3 w-full rounded-xl border border-stone-300 px-4 py-3 font-body text-sm" />
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="font-body text-xs text-stone-500">{(feedbackNotes[entry.id] ?? '').length}/300</span>
                                    <button type="button" disabled={!(feedbackNotes[entry.id] ?? '').trim()} onClick={() => void sendFeedback(entry.id)} className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm text-white disabled:opacity-50">Kirim Catatan</button>
                                </div>
                            </article>
                        ))}
                    </section>
                )}

                <section className="mt-8 rounded-2xl border-2 border-yellow-400 bg-white p-5 shadow-sm">
                    <h2 className="font-display text-xl font-semibold text-guyub-bambuDark">Tentang Wasiat</h2>
                    <p className="mt-3 whitespace-pre-line font-body text-sm text-stone-700">{wasiat.isi}</p>
                    {wasiat.poinKiat?.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 font-body text-sm text-stone-700">{wasiat.poinKiat.map((point, index) => <li key={index}>{point}</li>)}</ul>}
                    {wasiat.foto?.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{wasiat.foto.map((photo) => <img key={photo} src={`${API_ORIGIN}${photo}`} alt="" className="h-48 w-full rounded-xl object-cover" />)}</div>}
                </section>

                <section className="mt-8 rounded-2xl border-2 border-yellow-400 bg-white p-5 shadow-sm">
                    <h2 className="font-display text-xl font-semibold text-guyub-bambuDark">Komentar &amp; Apresiasi</h2>
                    <form onSubmit={sendComment} className="mt-4 space-y-3">
                        <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} required rows={2} placeholder="Tulis apresiasi atau bagikan hasil praktik..." className="w-full rounded-xl border border-stone-300 px-4 py-3 font-body text-sm" />
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex gap-1" aria-label="Pilih rating bintang">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} bintang`} onClick={() => setRating(value)} className={`text-2xl ${value <= rating ? 'text-guyub-gula' : 'text-stone-400'}`}>{value <= rating ? '★' : '☆'}</button>)}</div>
                            <button type="submit" disabled={!commentText.trim() || !rating} className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm text-white disabled:opacity-50">Kirim Komentar</button>
                        </div>
                    </form>
                    <div className="mt-5 space-y-3">{wasiat.comments.map((comment) => <article key={comment.id} className="rounded-xl bg-guyub-krem p-4"><UserIdentity user={comment.user} /><p className="mt-2 font-body text-sm text-stone-700">{comment.isi}</p><p className="mt-1 font-body text-xs text-guyub-tanah">{'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}</p></article>)}</div>
                </section>
            </div>

            <div className={`fixed inset-0 z-[60] transition-opacity duration-200 ${selectedQuest ? 'bg-black/40 opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden="true" onClick={() => setSelectedQuestId(null)} />
            <section
                role="dialog"
                aria-modal="true"
                aria-label={selectedQuest ? `Quest ${selectedQuest.urutan}: ${selectedQuest.judul}` : 'Panel quest'}
                className={`fixed bottom-0 right-0 z-[61] max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-2 border-yellow-400 bg-white p-5 shadow-2xl transition-transform duration-200 md:top-0 md:h-screen md:max-h-none md:w-[480px] md:rounded-none md:rounded-l-3xl md:p-7 ${selectedQuest ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}`}
            >
                {selectedQuest && (() => {
                    const quest = selectedQuest;
                    const finalQuest = steps[steps.length - 1]?.id === quest.id;
                    const result = results[quest.id];
                    const done = quest.status === 'LULUS' || result?.lulus;
                    const selected = answers[quest.id] ?? [];
                    return (
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <div><p className="font-body text-xs uppercase tracking-[0.16em] text-guyub-tanah">Quest {quest.urutan}{finalQuest ? ' · Quest Akhir' : ''}</p><h2 className="mt-1 font-display text-2xl font-semibold text-guyub-bambuDark">{quest.judul}</h2></div>
                                <button type="button" onClick={() => setSelectedQuestId(null)} aria-label="Tutup panel" className="rounded-full bg-guyub-krem px-3 py-1 font-body text-lg text-guyub-bambuDark">×</button>
                            </div>
                            {result && <div className={`mt-5 rounded-2xl p-4 ${result.lulus ? 'bg-guyub-krem' : 'bg-guyub-gula/15'}`}>
                                <h3 className="font-display text-xl font-semibold text-guyub-bambuDark">{result.lulus ? 'Quest Selesai!' : 'Belum lulus'}</h3>
                                <p className="mt-1 font-body text-sm text-stone-700">{result.benar} dari {result.total} benar, {result.skor}%</p>
                                {result.lulus ? <div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-body text-sm font-semibold text-guyub-bambuDark"><img src="/icons/xp.svg" alt="" className="h-5 w-5 dark:brightness-0 dark:invert" />+{result.xpDidapat} XP</span>{result.badgeBaru && <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-body text-sm font-semibold text-guyub-bambuDark"><img src={result.badgeBaru.penjelajahKearifan ? '/icons/badge-penjelajah.svg' : CATEGORY_BADGES[result.badgeBaru.kategori]} alt="" className="h-5 w-5 dark:brightness-0 dark:invert" />{result.badgeBaru.penjelajahKearifan ? 'Penjelajah Kearifan' : (CATEGORY_LABELS[result.badgeBaru.kategori] ?? result.badgeBaru.kategori)}</span>}</div> : <p className="mt-2 font-body text-sm text-stone-700">Pelajari lagi tujuannya dan coba lagi. Tidak ada pengurangan progress.</p>}
                            </div>}
                            <section className="mt-5"><h3 className="font-display text-lg font-semibold text-guyub-bambuDark">Tujuan</h3><p className="mt-2 whitespace-pre-line font-body text-sm leading-6 text-stone-700">{quest.tujuan}</p></section>
                            <section className="mt-5"><h3 className="font-display text-lg font-semibold text-guyub-bambuDark">Kuis</h3><div className="mt-3">
                                {quest.kuis.map((question, questionIndex) => {
                                    const correctIndex = result?.jawabanBenar[questionIndex];
                                    const selectedIndex = selected[questionIndex];
                                    const answeredCorrectly = result && selectedIndex === correctIndex;
                                    const connectorColor = answeredCorrectly ? 'border-solid border-green-500' : result ? 'border-solid border-red-500' : 'border-dashed border-stone-300';
                                    return <div key={`${quest.id}-${questionIndex}`}>
                                        <div className={`flex justify-center ${questionIndex % 2 ? 'md:justify-end md:pr-[12%]' : 'md:justify-start md:pl-[12%]'}`}>
                                            <fieldset className="w-full rounded-xl border-2 border-yellow-400 bg-white p-4 shadow-sm md:w-[82%]">
                                                <legend className="px-1 font-body text-sm font-semibold text-guyub-bambuDark">{questionIndex + 1}. {question.pertanyaan}</legend>
                                                <div className="mt-2 space-y-2">{question.opsi.map((option, optionIndex) => {
                                                    const isCorrect = !!result && correctIndex === optionIndex;
                                                    const isWrongSelection = !!result && selectedIndex === optionIndex && correctIndex !== optionIndex;
                                                    const highlighted = isCorrect || isWrongSelection;
                                                    const optionColor = isCorrect ? 'border-green-500 bg-green-500 text-white' : isWrongSelection ? 'border-red-500 bg-red-500 text-white' : 'border-stone-300 bg-white text-stone-700';
                                                    return <label key={`${quest.id}-${questionIndex}-${optionIndex}`} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 font-body text-sm transition-colors duration-200 ${optionColor} ${done || result ? 'cursor-default' : 'cursor-pointer'}`}>
                                                        <input type="radio" name={`quest-${quest.id}-question-${questionIndex}`} checked={selectedIndex === optionIndex} disabled={done || !!result} onChange={() => setAnswers((current) => { const next = [...(current[quest.id] ?? [])]; next[questionIndex] = optionIndex; return { ...current, [quest.id]: next }; })} className="h-4 w-4 accent-guyub-bambuDark" />
                                                        <span className={`w-6 font-body font-bold ${highlighted ? 'text-white' : 'text-guyub-tanah'}`}>{String.fromCharCode(65 + optionIndex)}.</span>
                                                        <span className="flex-1">{option}</span>
                                                        {highlighted && <img src={isCorrect ? '/icons/centang.svg' : '/icons/silang.svg'} alt="" className="h-5 w-5 brightness-0 invert" />}
                                                    </label>;
                                                })}</div>
                                            </fieldset>
                                        </div>
                                        {questionIndex < quest.kuis.length - 1 && <div aria-hidden="true" className={`mx-auto h-7 w-0 border-l-[3px] ${connectorColor}`} />}
                                    </div>;
                                })}
                            </div></section>
                            {result?.lulus ? <button type="button" onClick={() => focusNextQuest(quest)} className="mt-6 w-full rounded-full bg-guyub-bambuDark px-5 py-3 font-body text-sm font-semibold text-white">{finalQuest ? 'Kembali ke pohon quest' : 'Lanjut ke quest berikutnya'}</button> : result && !result.lulus ? <button type="button" onClick={() => { setResults((current) => { const next = { ...current }; delete next[quest.id]; return next; }); setAnswers((current) => ({ ...current, [quest.id]: [] })); }} className="mt-6 w-full rounded-full bg-guyub-bambuDark px-5 py-3 font-body text-sm font-semibold text-white">Coba lagi</button> : !done ? <button type="button" disabled={selected.length !== quest.kuis.length || submitting} onClick={() => void submitQuest(quest)} className="mt-6 w-full rounded-full bg-guyub-bambuDark px-5 py-3 font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Mengirim...' : 'Kirim Jawaban'}</button> : <p className="mt-6 rounded-xl bg-guyub-krem p-3 font-body text-sm text-guyub-bambuDark">Quest ini sudah lulus. Kuis dapat dilihat kembali.</p>}
                        </div>
                    );
                })()}
            </section>
        </main>
    );
}

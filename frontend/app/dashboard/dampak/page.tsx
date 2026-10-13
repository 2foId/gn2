'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface DampakRingkasan {
    literasi: { langkahLulus: number; penggunaUnikLulus: number };
    ekonomi: { umkmTerpenuhi: number; umkmResponse: number };
    sosial: { bantuanDisetujui: number; kesediaanBantu: number };
    budaya: { wasiatDibuat: number; wasiatBudaya: number };
    sdm: { userAktif: number; relawanUsia18_30: number };
}

type MetricKey = 'langkahLulus' | 'penggunaUnikLulus' | 'umkmTerpenuhi' | 'umkmResponse' | 'bantuanDisetujui' | 'kesediaanBantu' | 'wasiatDibuat' | 'wasiatBudaya' | 'userAktif' | 'relawanUsia18_30';
type AnimatedMetrics = Record<MetricKey, number>;

const EMPTY_METRICS: AnimatedMetrics = {
    langkahLulus: 0, penggunaUnikLulus: 0, umkmTerpenuhi: 0, umkmResponse: 0,
    bantuanDisetujui: 0, kesediaanBantu: 0, wasiatDibuat: 0, wasiatBudaya: 0,
    userAktif: 0, relawanUsia18_30: 0,
};

function metricsFrom(data: DampakRingkasan): AnimatedMetrics {
    return {
        langkahLulus: data.literasi.langkahLulus,
        penggunaUnikLulus: data.literasi.penggunaUnikLulus,
        umkmTerpenuhi: data.ekonomi.umkmTerpenuhi,
        umkmResponse: data.ekonomi.umkmResponse,
        bantuanDisetujui: data.sosial.bantuanDisetujui,
        kesediaanBantu: data.sosial.kesediaanBantu,
        wasiatDibuat: data.budaya.wasiatDibuat,
        wasiatBudaya: data.budaya.wasiatBudaya,
        userAktif: data.sdm.userAktif,
        relawanUsia18_30: data.sdm.relawanUsia18_30,
    };
}

function formatNumber(value: number) {
    return Math.max(0, Math.round(value)).toLocaleString('id-ID');
}

export default function DampakPage() {
    const user = useAuthStore((state) => state.user);
    const [data, setData] = useState<DampakRingkasan | null>(null);
    const [metrics, setMetrics] = useState<AnimatedMetrics>(EMPTY_METRICS);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!user || (user.role !== 'ADMIN' && user.role !== 'RELAWAN')) {
                setLoading(false);
                return;
            }
            try {
                const response = await api.get('/dampak/ringkasan');
                if (!cancelled) setData(response.data);
            } catch {
                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => { cancelled = true; };
    }, [user]);

    useEffect(() => {
        if (!data) return;
        const target = metricsFrom(data);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setMetrics(target);
            return;
        }

        let frame = 0;
        let startTime: number | null = null;
        const animate = (time: number) => {
            if (startTime === null) startTime = time;
            const progress = Math.min((time - startTime) / 800, 1);
            const next = {} as AnimatedMetrics;
            (Object.keys(target) as MetricKey[]).forEach((key) => { next[key] = target[key] * progress; });
            setMetrics(next);
            if (progress < 1) frame = window.requestAnimationFrame(animate);
        };
        frame = window.requestAnimationFrame(animate);
        return () => window.cancelAnimationFrame(frame);
    }, [data]);

    if (loading) return <p className="font-body text-sm text-stone-600">Memuat ringkasan dampak…</p>;

    if (!user || (user.role !== 'ADMIN' && user.role !== 'RELAWAN')) {
        return (
            <div className="rounded-2xl border-2 border-yellow-400 bg-white p-6 shadow-sm">
                <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">Dampak</h1>
                <p className="mt-3 font-body text-sm text-stone-700">Halaman ini khusus Relawan/RT dan Admin.</p>
            </div>
        );
    }

    if (loadError || !data) {
        return <p role="alert" className="rounded-2xl border-2 border-yellow-400 bg-white p-6 font-body text-sm text-guyub-merahBata">Ringkasan dampak gagal dimuat. Silakan coba lagi.</p>;
    }

    const blocks = [
        {
            key: 'literasi', strip: 'bg-guyub-bambu', icon: '/icons/literasi.svg', category: 'LITERASI',
            number: metrics.langkahLulus, title: 'Quest belajar yang berhasil diselesaikan',
            description: 'Quest yang diselesaikan menunjukkan pengetahuan yang terus tumbuh di komunitas.',
            connection: 'Kaitan 2045: SDM yang terampil dan mampu belajar mandiri.',
            secondary: `${formatNumber(metrics.penggunaUnikLulus)} pengguna unik lulus minimal satu quest.`,
        },
        {
            key: 'ekonomi', strip: 'bg-guyub-gula', icon: '/icons/ekonomi.svg', category: 'EKONOMI',
            number: metrics.umkmTerpenuhi, title: 'UMKM yang kebutuhannya terpenuhi',
            description: 'Dukungan warga membantu usaha lokal memenuhi kebutuhan dan berkembang.',
            connection: 'Kaitan 2045: ekonomi lokal yang produktif dan saling menguatkan.',
            secondary: `${formatNumber(metrics.umkmResponse)} respons warga untuk UMKM.`,
        },
        {
            key: 'sosial', strip: 'bg-guyub-merahBata', icon: '/icons/sosial.svg', category: 'SOSIAL',
            number: metrics.bantuanDisetujui, title: 'Bantuan warga yang selesai',
            description: 'Permintaan yang tuntas menjadi bukti gotong royong yang terasa nyata.',
            connection: 'Kaitan 2045: masyarakat tangguh yang peduli dan siap membantu.',
            secondary: `${formatNumber(metrics.kesediaanBantu)} kesediaan membantu tercatat.`,
        },
        {
            key: 'budaya', strip: 'bg-guyub-tanah', icon: '/icons/budaya.svg', category: 'BUDAYA',
            number: metrics.wasiatBudaya, title: 'Wasiat kearifan lokal dibagikan',
            description: 'Pengalaman dan pengetahuan lokal diwariskan agar tetap hidup lintas generasi.',
            connection: 'Kaitan 2045: generasi maju yang tetap berakar pada budayanya.',
            secondary: `Dari ${formatNumber(metrics.wasiatDibuat)} wasiat yang dibuat.`,
        },
    ] as const;

    return (
        <main className="space-y-6 pb-6">
            <header className="relative isolate overflow-hidden rounded-3xl bg-guyub-bambuDark p-8 text-white md:p-12">
                <div className="guyub-pattern absolute inset-0 z-0 opacity-20" aria-hidden="true" />
                <div className="absolute inset-0 z-0 bg-guyub-bambuDark/90" aria-hidden="true" />
                <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
                    <div>
                        <p className="font-body text-sm uppercase tracking-widest text-guyub-gula">DAMPAK KE GENERASI EMAS 2045</p>
                        <h1 className="mt-4 max-w-3xl font-hero text-4xl leading-tight text-white md:text-6xl">Apa yang sudah kita capai bersama</h1>
                    </div>
                    <div className="min-w-56 rounded-2xl border-2 border-guyub-gula/50 bg-guyub-bambuDark/60 p-5">
                        <p className="font-body text-sm text-white/80">Total warga terbantu</p>
                        <p className="mt-2 font-display text-6xl leading-none tabular-nums text-white">{formatNumber(metrics.bantuanDisetujui)}</p>
                        <p className="mt-2 font-body text-xs text-guyub-gula">Bantuan selesai disalurkan</p>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Blok dampak komunitas">
                {blocks.map((block) => (
                    <article key={block.key} className="flex min-h-64 overflow-hidden rounded-2xl border-2 border-yellow-400 bg-white shadow-md">
                        <div className={`w-2 shrink-0 ${block.strip}`} aria-hidden="true" />
                        <div className="flex w-full flex-col gap-5 p-5 md:flex-row md:items-center md:gap-6 md:p-7">
                            <div className="flex shrink-0 items-center gap-4 md:block">
                                <img src={block.icon} alt="" className="h-8 w-8 md:mb-3 dark:brightness-0 dark:invert" />
                                <p className="font-display text-7xl leading-none tabular-nums text-guyub-bambuDark md:text-8xl">{formatNumber(block.number)}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="font-body text-xs uppercase tracking-wider text-guyub-tanah">{block.category}</p>
                                <h2 className="mt-1 font-display text-2xl leading-tight text-guyub-bambuDark">{block.title}</h2>
                                <p className="mt-2 font-body text-base text-stone-700">{block.description}</p>
                                <p className="mt-2 font-body text-sm text-stone-500">{block.secondary}</p>
                                <p className="mt-2 font-body text-sm italic text-guyub-bambu">{block.connection}</p>
                            </div>
                        </div>
                    </article>
                ))}

                <article className="flex min-h-64 overflow-hidden rounded-2xl border-2 border-yellow-400 bg-white shadow-md lg:col-span-2">
                    <div className="w-2 shrink-0 bg-guyub-bambuDark" aria-hidden="true" />
                    <div className="flex w-full flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:p-7">
                        <div className="flex items-center gap-4 md:block">
                            <img src="/icons/sdm.svg" alt="" className="h-8 w-8 md:mb-3 dark:brightness-0 dark:invert" />
                            <p className="font-display text-7xl leading-none tabular-nums text-guyub-bambuDark md:text-8xl">{formatNumber(metrics.relawanUsia18_30)}</p>
                        </div>
                        <div className="flex-1">
                            <p className="font-body text-xs uppercase tracking-wider text-guyub-tanah">SDM</p>
                            <h2 className="mt-1 font-display text-2xl text-guyub-bambuDark">Relawan muda siap bergerak</h2>
                            <p className="mt-2 max-w-2xl font-body text-base text-stone-700">Relawan usia 18–30 tahun membawa energi, keterampilan, dan gagasan baru untuk kebutuhan bersama.</p>
                            <p className="mt-2 font-body text-sm italic text-guyub-bambu">Kaitan 2045: bonus demografi menjadi kekuatan untuk masa depan.</p>
                        </div>
                        <div className="grid shrink-0 grid-cols-2 gap-3 md:w-72 md:grid-cols-1">
                            <div className="rounded-2xl bg-guyub-krem p-4">
                                <p className="font-body text-xs text-stone-600">Pemuda aktif</p>
                                <p className="mt-1 font-display text-3xl tabular-nums text-guyub-bambuDark">{formatNumber(metrics.relawanUsia18_30)}</p>
                            </div>
                            <div className="rounded-2xl bg-guyub-krem p-4">
                                <p className="font-body text-xs text-stone-600">Pengguna aktif 30 hari</p>
                                <p className="mt-1 font-display text-3xl tabular-nums text-guyub-bambuDark">{formatNumber(metrics.userAktif)}</p>
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <footer className="flex flex-col items-center gap-4 px-4 pt-2 text-center">
                <p className="max-w-3xl font-body text-stone-600">Angka ini diperbarui otomatis dari data aplikasi. Setiap angka adalah langkah menuju Generasi Emas 2045.</p>
                <Link href="/dashboard/wasiat" className="rounded-full bg-guyub-bambuDark px-5 py-2.5 font-body text-sm font-medium text-white transition duration-200 hover:bg-guyub-bambu">Mulai dari quest pertama</Link>
            </footer>
        </main>
    );
}

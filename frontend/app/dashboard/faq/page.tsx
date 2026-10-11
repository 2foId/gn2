'use client';

import { useState } from 'react';

interface FaqItem {
    kategori: string;
    pertanyaan: string;
    jawaban: string;
}

const FAQ_LIST: FaqItem[] = [
    {
        kategori: 'Akun & Login',
        pertanyaan: 'Kenapa kode OTP tidak masuk ke WhatsApp saya?',
        jawaban:
            'Coba tunggu sampai 1 menit, kadang ada jeda pengiriman. Kalau masih belum masuk, pastikan nomor HP yang kamu daftarkan sudah benar (format 08xx atau 62xx). Kamu juga bisa klik "Kirim Ulang OTP" di halaman verifikasi.',
    },
    {
        kategori: 'Akun & Login',
        pertanyaan: 'Saya lupa password, bagaimana cara reset?',
        jawaban:
            'Saat ini fitur reset password mandiri belum tersedia. Hubungi Admin/Relawan RT setempat untuk dibantu reset akun secara manual.',
    },
    {
        kategori: 'Akun & Login',
        pertanyaan: 'Bagaimana cara akun saya menjadi Relawan/RT?',
        jawaban:
            'Penetapan role Relawan/RT dilakukan oleh Admin, bukan bisa diubah sendiri oleh warga. Hubungi Admin komunitas kamu untuk pengajuan.',
    },
    {
        kategori: 'Peta Butuh Guyub',
        pertanyaan: 'Kenapa permintaan bantuan saya belum muncul di peta?',
        jawaban:
            'Setiap permintaan baru berstatus "menunggu verifikasi" terlebih dulu. Permintaan baru tampil di peta setelah disetujui oleh Relawan/RT atau Admin ,proses ini untuk memastikan kebutuhan yang tampil memang valid.',
    },
    {
        kategori: 'Peta Butuh Guyub',
        pertanyaan: 'Bagaimana cara menandai lokasi di peta saat membuat permintaan?',
        jawaban:
            'Di form "Buat Permintaan", klik tombol "Pilih Lokasi di Peta". Peta akan membesar dan area sekitarnya menggelap ,cukup tap/klik titik lokasi yang dimaksud, lalu konfirmasi. Tidak perlu memasukkan koordinat secara manual.',
    },
    {
        kategori: 'Peta Butuh Guyub',
        pertanyaan: 'Apa bedanya "Bersedia Bantu" dengan komentar biasa?',
        jawaban:
            'Menekan tombol "Bersedia Bantu" berarti kamu berkomitmen membantu permintaan tersebut, dan kamu bisa menyertakan catatan singkat bersamaan. Hanya warga yang sudah menekan tombol ini yang komentarnya akan muncul di daftar kesediaan bantu.',
    },
    {
        kategori: 'Wasiat Ngapak',
        pertanyaan: 'Berapa kali saya bisa memberi rating ke satu wasiat?',
        jawaban:
            'Satu kali per wasiat. Rating dan komentar kamu tidak bisa diulang, jadi pastikan sudah yakin sebelum mengirim.',
    },
    {
        kategori: 'Wasiat Ngapak',
        pertanyaan: 'Apakah saya wajib memberi rating bintang saat berkomentar?',
        jawaban:
            'Ya, setiap komentar di Wasiat Ngapak wajib disertai rating bintang (1–5). Ini menjaga skor rata-rata tetap bermakna sebagai ukuran kualitas wasiat.',
    },
    {
        kategori: 'UMKM Dibantu',
        pertanyaan: 'Bagaimana cara menawarkan bantuan ke UMKM tertentu?',
        jawaban:
            'Buka detail kebutuhan UMKM yang ingin dibantu, lalu kirim respons berisi penawaran/keterampilan kamu. Pemilik usaha akan melihat dan bisa menghubungi kamu langsung.',
    },
    {
        kategori: 'Guyub Acara',
        pertanyaan: 'Apa bedanya tiga cara absensi yang tersedia?',
        jawaban:
            'Absen manual: setiap warga login dan menekan tombol "Absen Hadir" sendiri. Kode 4 digit: dipakai di satu perangkat bersama di lokasi acara (mirip absensi kertas), berlaku 3 menit. QR code: bisa diprint dan ditempel, dipindai lewat kamera HP masing-masing warga, berlaku 1 hari.',
    },
    {
        kategori: 'Guyub Acara',
        pertanyaan: 'Kode absensi 4 digit sudah kedaluwarsa, bagaimana?',
        jawaban:
            'Kode berlaku 3 menit sejak dibuat. Pembuat acara tinggal membuat kode baru lewat menu acara ,kode lama otomatis tidak berlaku lagi.',
    },
    {
        kategori: 'Umum',
        pertanyaan: 'Apakah data dan foto yang saya unggah aman?',
        jawaban:
            'Foto disimpan di server aplikasi. Untuk keperluan proyek ini, hindari mengunggah dokumen sensitif atau data pribadi yang tidak relevan dengan kebutuhan yang dilaporkan.',
    },
    {
        kategori: 'Umum',
        pertanyaan: 'Saya menemukan bug atau punya saran, ke mana harus lapor?',
        jawaban:
            'Silakan hubungi tim pengembang lewat kontak yang tercantum di bagian bawah halaman ini, atau kirim pesan lewat fitur Pesan di aplikasi kepada Admin.',
    },
];

const KATEGORI_LIST = Array.from(new Set(FAQ_LIST.map((f) => f.kategori)));

export default function FaqPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [activeKategori, setActiveKategori] = useState<string>('');

    const filtered = activeKategori
        ? FAQ_LIST.filter((f) => f.kategori === activeKategori)
        : FAQ_LIST;

    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">
                Pusat Bantuan
            </h1>
            <p className="mt-1 font-body text-sm text-stone-600">
                Pertanyaan yang sering ditanyakan seputar penggunaan Guyub Ngapak.
                <img src="/logo.png" alt="Logo" className="ml-1 inline h-4 w-4" />
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveKategori('')}
                    className={`rounded-full px-4 py-1.5 font-body text-sm ${!activeKategori ? 'bg-guyub-bambuDark text-white' : 'bg-white text-stone-600'
                        }`}
                >
                    Semua
                </button>
                {KATEGORI_LIST.map((k) => (
                    <button
                        key={k}
                        onClick={() => setActiveKategori(k)}
                        className={`rounded-full px-4 py-1.5 font-body text-sm ${activeKategori === k ? 'bg-guyub-bambuDark text-white' : 'bg-white text-stone-600'
                            }`}
                    >
                        {k}
                    </button>
                ))}
            </div>

            <div className="mt-6 space-y-3">
                {filtered.map((item, i) => {
                    const isOpen = openIndex === i;
                    return (
                        <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : i)}
                                className="flex w-full items-center justify-between px-5 py-4 text-left"
                            >
                                <div>
                                    <span className="font-body text-xs uppercase tracking-wide text-guyub-tanah">
                                        {item.kategori}
                                    </span>
                                    <p className="mt-0.5 font-body font-medium text-stone-800">
                                        {item.pertanyaan}
                                    </p>
                                </div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`h-5 w-5 shrink-0 text-guyub-bambuDark transition-transform ${isOpen ? 'rotate-180' : ''
                                        }`}
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                            {isOpen && (
                                <div className="border-t border-stone-100 px-5 py-4">
                                    <p className="font-body text-sm leading-relaxed text-stone-600">
                                        {item.jawaban}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 rounded-xl bg-guyub-krem p-5">
                <p className="font-body text-sm font-medium text-guyub-bambuDark">
                    Masih butuh bantuan?
                </p>
                <p className="mt-1 font-body text-sm text-stone-600">
                    Hubungi tim pengembang lewat fitur Pesan di aplikasi, atau kirim email ke{' '}
                    <span className="font-medium underline">azmikhadafi00@gmail.com</span>.
                </p>
            </div>
        </div>
    );
}
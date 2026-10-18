import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WasiatKategori } from '@prisma/client';

@Injectable()
export class DampakService {
    constructor(private prisma: PrismaService) { }

    async getRingkasan() {
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const budayaKategori: WasiatKategori[] = [
            WasiatKategori.RESEP,
            WasiatKategori.KERAJINAN,
            WasiatKategori.PERTANIAN,
            WasiatKategori.FILOSOFI,
            WasiatKategori.SEJARAH_BUDAYA,
            WasiatKategori.BEBAS,
        ];

        const [langkahLulus, penggunaUnikLulus, umkmTerpenuhi, umkmResponse, bantuanSelesai, kesediaanBantu, wasiatDibuat, wasiatBudaya, userAktif, penggerakUsia18_30] = await Promise.all([
            // Sumber: progres wasiat yang sudah lulus, menunjukkan jumlah langkah/ujian yang berhasil diselesaikan.
            this.prisma.wasiatProgress.count({ where: { lulus: true } }),
            // Sumber: progres wasiat yang lulus, dihitung per pengguna unik agar tidak menggandakan satu orang.
            this.prisma.wasiatProgress.groupBy({ by: ['userId'], where: { lulus: true } }).then((rows) => rows.length),
            // Sumber: kebutuhan UMKM dengan status selesai, mencerminkan dampak ekonomi nyata.
            this.prisma.umkmNeed.count({ where: { status: 'SELESAI' } }),
            // Sumber: semua respons UMKM yang pernah masuk, jadi indikator aktivitas ekonomi dan keterlibatan pelaku usaha.
            this.prisma.umkmResponse.count(),
            // Sumber: permintaan bantuan yang sudah selesai, merepresentasikan kebutuhan sosial yang terselesaikan.
            this.prisma.bantuanRequest.count({ where: { status: 'SELESAI' } }),
            // Sumber: total kesediaan bantu yang terdaftar, menunjukkan volume mobilisasi komunitas.
            this.prisma.kesediaanBantu.count(),
            // Sumber: total wasiat yang dibuat, menunjukkan produksi pengetahuan lokal yang dibagikan.
            this.prisma.wasiat.count(),
            // Sumber: wasiat dengan kategori budaya/kearifan, sebagai indikator warisan lokal yang dipertahankan.
            this.prisma.wasiat.count({ where: { kategori: { in: budayaKategori } } }),
            // Sumber: refresh token yang dibuat dalam 30 hari terakhir, jadi indikator login aktif bila data tersedia.
            this.prisma.refreshToken.groupBy({ by: ['userId'], where: { createdAt: { gte: last30Days } } }).then((rows) => rows.length),
            // Sumber: Penggerak yang lahir dalam rentang usia 18–30 tahun, menilai potensi SDM muda.
            this.prisma.user.count({
                where: {
                    role: 'PENGGERAK',
                    tanggalLahir: {
                        lte: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000),
                        gte: new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);

        return {
            literasi: {
                langkahLulus,
                penggunaUnikLulus,
            },
            ekonomi: {
                umkmTerpenuhi: umkmTerpenuhi,
                umkmResponse,
            },
            sosial: {
                bantuanDisetujui: bantuanSelesai,
                kesediaanBantu,
            },
            budaya: {
                wasiatDibuat,
                wasiatBudaya,
            },
            sdm: {
                userAktif: userAktif,
                penggerakUsia18_30,
            },
        };
    }
}

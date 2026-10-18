import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WasiatKategori } from '@prisma/client';

@Injectable()
export class DampakService {
    constructor(private prisma: PrismaService) { }

    async getRingkasan() {
        const now = new Date();
        const weekStarts: Date[] = [];
        const thisWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        thisWeek.setUTCDate(thisWeek.getUTCDate() - ((thisWeek.getUTCDay() + 6) % 7));
        for (let offset = 7; offset >= 0; offset -= 1) {
            const weekStart = new Date(thisWeek);
            weekStart.setUTCDate(weekStart.getUTCDate() - offset * 7);
            weekStarts.push(weekStart);
        }
        const rangeStart = weekStarts[0];
        const lastSevenDays = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        await this.prisma.jamKontribusi.updateMany({
            where: { status: 'MENUNGGU', batasKonfirmasiAt: { lte: now } },
            data: { status: 'KEDALUWARSA' },
        });

        const [bantuanSelesai, jamTerkonfirmasi, jamMenunggu, portofolioTerbit, kuisSelesai, progresWasiat, rating, penggunaAktif, bantuanTrend, jamTrend, portfolioTrend, kuisTrend, aktivitasTrend] = await Promise.all([
            this.prisma.bantuanRequest.count({ where: { status: 'SELESAI' } }),
            this.prisma.jamKontribusi.aggregate({ where: { status: 'TERKONFIRMASI' }, _sum: { jumlahJam: true } }),
            this.prisma.jamKontribusi.aggregate({ where: { status: 'MENUNGGU' }, _sum: { jumlahJam: true } }),
            this.prisma.umkmPortfolio.count({ where: { isPublished: true } }),
            this.prisma.wasiatProgress.count({ where: { lulus: true } }),
            this.prisma.wasiatProgress.groupBy({ by: ['userId', 'wasiatId'] }),
            this.prisma.umkmRating.aggregate({ _avg: { score: true } }),
            this.prisma.refreshToken.groupBy({ by: ['userId'], where: { createdAt: { gte: lastSevenDays } } }).then((rows) => rows.length),
            this.prisma.bantuanRequest.findMany({ where: { status: 'SELESAI', selesaiAt: { gte: rangeStart } }, select: { selesaiAt: true } }),
            this.prisma.jamKontribusi.findMany({ where: { status: 'TERKONFIRMASI', dikonfirmasiAt: { gte: rangeStart } }, select: { jumlahJam: true, dikonfirmasiAt: true } }),
            this.prisma.umkmPortfolio.findMany({ where: { isPublished: true, createdAt: { gte: rangeStart } }, select: { createdAt: true } }),
            this.prisma.wasiatProgress.findMany({ where: { lulus: true, selesaiAt: { gte: rangeStart } }, select: { selesaiAt: true } }),
            this.prisma.refreshToken.findMany({ where: { createdAt: { gte: rangeStart } }, select: { userId: true, createdAt: true } }),
        ]);

        const weekKey = (date: Date) => {
            const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
            monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
            return monday.toISOString().slice(0, 10);
        };
        const trends = weekStarts.map((weekStart) => ({
            mingguMulai: weekStart.toISOString().slice(0, 10),
            bantuanSelesai: 0,
            jamTerkonfirmasi: 0,
            portofolioTerbit: 0,
            kuisDiselesaikan: 0,
            penggunaAktif: 0,
        }));
        const trendByWeek = new Map(trends.map((trend) => [trend.mingguMulai, trend]));
        for (const item of bantuanTrend) if (item.selesaiAt) trendByWeek.get(weekKey(item.selesaiAt))!.bantuanSelesai += 1;
        for (const item of jamTrend) if (item.dikonfirmasiAt) trendByWeek.get(weekKey(item.dikonfirmasiAt))!.jamTerkonfirmasi += item.jumlahJam.toNumber();
        for (const item of portfolioTrend) trendByWeek.get(weekKey(item.createdAt))!.portofolioTerbit += 1;
        for (const item of kuisTrend) if (item.selesaiAt) trendByWeek.get(weekKey(item.selesaiAt))!.kuisDiselesaikan += 1;
        const usersByWeek = new Map<string, Set<string>>();
        for (const item of aktivitasTrend) {
            const key = weekKey(item.createdAt);
            const users = usersByWeek.get(key) ?? new Set<string>();
            users.add(item.userId);
            usersByWeek.set(key, users);
        }
        for (const [key, users] of usersByWeek) {
            const trend = trendByWeek.get(key);
            if (trend) trend.penggunaAktif = users.size;
        }

        return {
            bantuanSelesai,
            jamTerkonfirmasi: jamTerkonfirmasi._sum.jumlahJam?.toNumber() ?? 0,
            jamMenungguKonfirmasi: jamMenunggu._sum.jumlahJam?.toNumber() ?? 0,
            portofolioTerbit,
            wasiatDibaca: progresWasiat.length,
            kuisDiselesaikan: kuisSelesai,
            ratingRataRata: rating._avg.score ?? 0,
            penggunaAktifPerMinggu: penggunaAktif,
            trenMingguan: trends,
        };
    }

    async getKabupaten() {
        const bantuan = await this.prisma.bantuanRequest.groupBy({ by: ['kabupatenKota'], where: { status: 'SELESAI' }, _count: { _all: true } });
        const jam = await this.prisma.jamKontribusi.findMany({ where: { status: 'TERKONFIRMASI' }, select: { jumlahJam: true, penggerak: { select: { kabupatenKota: true } } } });
        const jamByKab = new Map<string | null, number>();
        for (const j of jam) {
            const kab = j.penggerak?.kabupatenKota ?? null;
            jamByKab.set(kab, (jamByKab.get(kab) ?? 0) + j.jumlahJam.toNumber());
        }
        const umkm = await this.prisma.umkmNeed.groupBy({ by: ['kabupatenKota'], where: { status: 'SELESAI' }, _count: { _all: true } });

        const map = new Map<string | null, { bantuanSelesai: number; jamTerkonfirmasi: number; umkmTerbantu: number }>();
        const get = (k: string | null) => {
            if (!map.has(k)) map.set(k, { bantuanSelesai: 0, jamTerkonfirmasi: 0, umkmTerbantu: 0 });
            return map.get(k)!;
        };
        for (const b of bantuan) get(b.kabupatenKota).bantuanSelesai = b._count._all;
        for (const [k, v] of jamByKab) get(k).jamTerkonfirmasi = v;
        for (const u of umkm) get(u.kabupatenKota).umkmTerbantu = u._count._all;

        const rows = Array.from(map.entries()).map(([k, v]) => ({
            kabupaten: k ?? 'Belum diisi',
            ...v,
            total: v.bantuanSelesai + v.umkmTerbantu,
        }));

        const big = rows.filter((r) => r.total >= 3 && r.kabupaten !== 'Belum diisi');
        const small = rows.filter((r) => !(r.total >= 3 && r.kabupaten !== 'Belum diisi') && r.kabupaten !== 'Belum diisi');
        const lainnya = small.reduce((acc, r) => ({
            kabupaten: 'Lainnya',
            bantuanSelesai: acc.bantuanSelesai + r.bantuanSelesai,
            jamTerkonfirmasi: acc.jamTerkonfirmasi + r.jamTerkonfirmasi,
            umkmTerbantu: acc.umkmTerbantu + r.umkmTerbantu,
            total: acc.total + r.total,
        }), { kabupaten: 'Lainnya', bantuanSelesai: 0, jamTerkonfirmasi: 0, umkmTerbantu: 0, total: 0 });

        const belum = rows.find((r) => r.kabupaten === 'Belum diisi');

        big.sort((a, b) => b.jamTerkonfirmasi - a.jamTerkonfirmasi);
        const result = [...big];
        if (lainnya.total > 0) result.push(lainnya);
        if (belum && belum.total > 0) result.push(belum);
        return result.map(({ total, ...rest }) => rest);
    }
}

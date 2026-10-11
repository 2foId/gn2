import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { unlink } from 'fs/promises';
import { join, basename } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { BantuanStatus } from '@prisma/client';

@Injectable()
export class BantuanCleanupService {
    private readonly logger = new Logger(BantuanCleanupService.name);

    constructor(private readonly prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_HOUR)
    async hapusPermintaanSelesaiLama() {
        const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const expired = await this.prisma.bantuanRequest.findMany({
            where: { status: BantuanStatus.SELESAI, selesaiAt: { lt: cutoff } },
            select: { id: true, foto: true },
        });
        const result = expired.length
            ? await this.prisma.bantuanRequest.deleteMany({ where: { id: { in: expired.map((request) => request.id) } } })
            : { count: 0 };

        const uploadsDir = join(process.cwd(), 'uploads');
        for (const request of expired) {
            for (const photo of request.foto) {
                const filename = basename(photo);
                if (!filename || filename === '.' || filename === '..') continue;
                try {
                    await unlink(join(uploadsDir, filename));
                } catch (error) {
                    this.logger.warn(`Gagal menghapus foto ${filename}: ${String(error)}`);
                }
            }
        }

        this.logger.log(`${result.count} permintaan bantuan selesai yang berumur lebih dari 3 hari dihapus.`);
    }
}

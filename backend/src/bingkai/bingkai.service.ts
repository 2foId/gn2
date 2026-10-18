import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface BingkaiItem {
  id: string;
  kode: string;
  nama: string;
  harga: number;
  gaya: string;
  dimiliki: boolean;
  dipasang: boolean;
}

export interface BingkaiListResponse {
  items: BingkaiItem[];
  currency: number;
}

@Injectable()
export class BingkaiService {
  constructor(private prisma: PrismaService) { }

  async listForUser(userId: string): Promise<BingkaiListResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true, bingkaiAktifId: true },
    });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

    const [allBingkai, owned] = await Promise.all([
      this.prisma.bingkaiProfil.findMany({ orderBy: { harga: 'asc' } }),
      this.prisma.kepemilikanBingkai.findMany({
        where: { userId },
        include: { bingkai: true },
      }),
    ]);

    const ownedSet = new Set(owned.map((o) => o.bingkaiId));
    const items: BingkaiItem[] = allBingkai.map((b) => ({
      id: b.id,
      kode: b.kode,
      nama: b.nama,
      harga: b.harga,
      gaya: b.gaya,
      dimiliki: ownedSet.has(b.id),
      dipasang: user.bingkaiAktifId === b.id,
    }));

    return { items, currency: user.currency };
  }

  async beli(userId: string, bingkaiId: string) {
    const [bingkai, user, existing] = await Promise.all([
      this.prisma.bingkaiProfil.findUnique({ where: { id: bingkaiId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
      this.prisma.kepemilikanBingkai.findUnique({
        where: { userId_bingkaiId: { userId, bingkaiId } },
      }),
    ]);

    if (!bingkai) throw new NotFoundException('Bingkai tidak ditemukan.');
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan.');
    if (existing) throw new BadRequestException('Bingkai ini sudah dimiliki.');

    if (user.currency < bingkai.harga) {
      throw new BadRequestException('Currency tidak cukup.');
    }

    await this.prisma.$transaction([
      this.prisma.kepemilikanBingkai.create({
        data: { userId, bingkaiId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { currency: { decrement: bingkai.harga } },
      }),
    ]);

    return { message: `Bingkai "${bingkai.nama}" dibeli.`, bingkaiId };
  }

  async pasang(userId: string, bingkaiId: string | null) {
    if (bingkaiId !== null) {
      const owned = await this.prisma.kepemilikanBingkai.findUnique({
        where: { userId_bingkaiId: { userId, bingkaiId } },
      });
      if (!owned) throw new BadRequestException('Bingkai ini tidak dimiliki.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { bingkaiAktifId: bingkaiId },
    });

    return { message: bingkaiId ? 'Bingkai dipasang.' : 'Bingkai dilepas.', bingkaiAktifId: bingkaiId };
  }
}
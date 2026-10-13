import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBantuanDto } from './dto/create-bantuan.dto';
import { UpdateBantuanDto } from './dto/update-bantuan.dto';
import { BatalKesediaanDto } from './dto/batal-kesediaan.dto';
import { BantuanStatus, KesediaanStatus, PreferensiRelawan } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class BantuanService {
  constructor(private prisma: PrismaService, private usersService: UsersService) { }

  private matchesPreferensiRelawan(user: { role: string; keahlian: string[]; kategoriUsia: string | null }, preferensi: PreferensiRelawan) {
    if (preferensi === PreferensiRelawan.SEMUA) return true;
    if (user.role !== 'RELAWAN') return false;

    if (preferensi === PreferensiRelawan.PEMUDA_18_30) return user.kategoriUsia === 'PEMUDA_18_30';

    if (preferensi === PreferensiRelawan.BERPENGALAMAN) {
      return user.keahlian.length > 0;
    }

    return false;
  }

  create(userId: string, dto: CreateBantuanDto) {
    return this.prisma.bantuanRequest.create({
      data: {
        ...dto,
        dibutuhkanSebelum: dto.dibutuhkanSebelum ? new Date(dto.dibutuhkanSebelum) : undefined,
        pembuatId: userId,
        status: BantuanStatus.MENUNGGU_VERIFIKASI,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateBantuanDto) {
    const item = await this.findOne(id);
    if (item.pembuatId !== userId) throw new ForbiddenException('Hanya pembuat permintaan yang dapat mengubahnya');
    return this.prisma.bantuanRequest.update({
      where: { id },
      data: {
        ...dto,
        dibutuhkanSebelum: dto.dibutuhkanSebelum ? new Date(dto.dibutuhkanSebelum) : undefined,
      },
    });
  }

  private isValidPreferensi(preferensi?: PreferensiRelawan) {
    if (preferensi === undefined) return;
    if (!Object.values(PreferensiRelawan).includes(preferensi)) {
      throw new BadRequestException('Preferensi relawan tidak valid');
    }
  }

  // Peta publik menampilkan semua permintaan kecuali yang masih menunggu verifikasi.
  findAllForMap(preferensi?: PreferensiRelawan) {
    this.isValidPreferensi(preferensi);
    const where = {
      status: { not: BantuanStatus.MENUNGGU_VERIFIKASI },
    };

    return this.prisma.bantuanRequest.findMany({
      where,
      include: {
        pembuat: { select: { id: true, nama: true, avatarUrl: true, role: true, keahlian: true, tanggalLahir: true } },
        kesediaanBantu: {
          where: { status: KesediaanStatus.AKTIF },
          take: preferensi && preferensi !== PreferensiRelawan.SEMUA ? undefined : 5,
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, nama: true, avatarUrl: true, role: true, keahlian: true, tanggalLahir: true } } },
        },
        _count: { select: { kesediaanBantu: { where: { status: KesediaanStatus.AKTIF } } } },
      },
      orderBy: { createdAt: 'desc' },
    }).then((items) => items.map((item) => {
      const { tanggalLahir: makerBirthDate, ...maker } = item.pembuat;
      const makerCategory = this.usersService.kategoriUsia(makerBirthDate);
      const safeMaker = { ...maker, kategoriUsia: makerCategory };
      const safeSupporters = item.kesediaanBantu.map((entry) => {
        const { tanggalLahir, ...safeUser } = entry.user;
        const kategoriUsia = this.usersService.kategoriUsia(tanggalLahir);
        return {
          ...entry,
          user: { ...safeUser, kategoriUsia },
          cocokPreferensi: this.matchesPreferensiRelawan(
            { role: entry.user.role, keahlian: entry.user.keahlian ?? [], kategoriUsia },
            preferensi ?? item.preferensiRelawan,
          ),
        };
      });
      const hasMatchingSupporter = safeSupporters.some((entry) => entry.cocokPreferensi);
      const cocokPreferensi = !preferensi
        || preferensi === PreferensiRelawan.SEMUA
        || item.preferensiRelawan === preferensi
        || hasMatchingSupporter;

      return {
        ...item,
        pembuat: safeMaker,
        kesediaanBantu: safeSupporters,
        cocokPreferensi,
      };
    }).filter((item) => item.cocokPreferensi));
  }

  // Khusus Relawan/RT & Admin: lihat semua termasuk yang masih menunggu verifikasi
  findAllForVerifikator(preferensi?: PreferensiRelawan) {
    this.isValidPreferensi(preferensi);
    const where = undefined;

    return this.prisma.bantuanRequest.findMany({
      where,
      include: { pembuat: { select: { id: true, nama: true, kontak: true, role: true, keahlian: true, tanggalLahir: true } } },
      orderBy: { createdAt: 'desc' },
    }).then((items) => items.map((item) => {
      const { tanggalLahir, ...safeMaker } = item.pembuat;
      const kategoriUsia = this.usersService.kategoriUsia(tanggalLahir);
      const makerMatch = this.matchesPreferensiRelawan(
        { role: item.pembuat.role, keahlian: item.pembuat.keahlian ?? [], kategoriUsia },
        preferensi ?? item.preferensiRelawan,
      );
      return {
        ...item,
        pembuat: { ...safeMaker, kategoriUsia },
        cocokPreferensi: !preferensi
          || preferensi === PreferensiRelawan.SEMUA
          || makerMatch,
      };
    }));
  }

  async findOne(id: string) {
    const item = await this.prisma.bantuanRequest.findUnique({
      where: { id },
      include: {
        pembuat: { select: { id: true, nama: true, avatarUrl: true } },
        verifikator: { select: { id: true, nama: true } },
        kesediaanBantu: { include: { user: { select: { id: true, nama: true, avatarUrl: true } } } },
      },
    });
    if (!item) throw new NotFoundException('Permintaan bantuan tidak ditemukan');
    return item;
  }

  // Hanya boleh dipanggil dari endpoint yang dilindungi Roles(RELAWAN, ADMIN)
  async verifikasi(id: string, verifikatorId: string, disetujui: boolean) {
    const item = await this.findOne(id);
    if (item.status !== BantuanStatus.MENUNGGU_VERIFIKASI) {
      throw new BadRequestException('Permintaan ini sudah diverifikasi sebelumnya');
    }

    return this.prisma.bantuanRequest.update({
      where: { id },
      data: {
        status: disetujui ? BantuanStatus.AKTIF : BantuanStatus.DITOLAK,
        verifikatorId,
        verifiedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: BantuanStatus) {
    await this.findOne(id);
    return this.prisma.bantuanRequest.update({
      where: { id },
      data: { status, selesaiAt: status === BantuanStatus.SELESAI ? new Date() : null },
    });
  }

  async selesai(id: string, userId: string) {
    const item = await this.findOne(id);
    if (item.pembuatId !== userId) {
      throw new BadRequestException('Hanya pembuat yang dapat menandai permintaan ini selesai');
    }
    if (item.status === BantuanStatus.SELESAI || item.status === BantuanStatus.DITOLAK) {
      throw new BadRequestException('Permintaan ini sudah selesai/ditolak');
    }
    return this.prisma.bantuanRequest.update({ where: { id }, data: { status: BantuanStatus.SELESAI, selesaiAt: new Date() } });
  }

  async hapus(id: string, userId: string, role: string) {
    const item = await this.findOne(id);
    if (item.status === BantuanStatus.AKTIF || item.status === BantuanStatus.DIPROSES || item.status === BantuanStatus.MENUNGGU_VERIFIKASI) {
      throw new BadRequestException('Hanya permintaan yang sudah selesai/ditolak yang bisa dihapus');
    }
    if (item.pembuatId !== userId && role !== 'ADMIN' && role !== 'RELAWAN') {
      throw new ForbiddenException('Hanya pembuat atau admin/relawan yang bisa menghapus permintaan ini');
    }
    await this.hapusFoto(item.foto);
    return this.prisma.bantuanRequest.delete({ where: { id } });
  }

  private async hapusFoto(foto: string[]) {
    const { unlink } = await import('fs/promises');
    const { basename, join } = await import('path');
    const uploadsDir = join(process.cwd(), 'uploads');
    for (const url of foto) {
      const filename = basename(url);
      if (!filename || filename === '.' || filename === '..') continue;
      try {
        await unlink(join(uploadsDir, filename));
      } catch {
        // Penghapusan file bersifat best-effort; jangan menghalangi penghapusan data.
      }
    }
  }

  async nyatakanKesediaan(requestId: string, userId: string, catatan?: string) {
    const request = await this.findOne(requestId);
    if (request.status !== BantuanStatus.AKTIF && request.status !== BantuanStatus.DIPROSES) {
      throw new BadRequestException('Permintaan ini belum/tidak lagi menerima bantuan');
    }

    const existing = await this.prisma.kesediaanBantu.findUnique({ where: { requestId_userId: { requestId, userId } } });
    if (existing) {
      throw new BadRequestException('Kamu sudah pernah membatalkan bantuan ini dan tidak bisa menawarkan bantuan lagi.');
    }

    const kesediaan = await this.prisma.kesediaanBantu.create({ data: { requestId, userId, catatan } });

    // Begitu ada yang menyatakan kesediaan, status otomatis maju ke DIPROSES
    if (request.status === BantuanStatus.AKTIF) {
      await this.prisma.bantuanRequest.update({
        where: { id: requestId },
        data: { status: BantuanStatus.DIPROSES },
      });
    }

    return kesediaan;
  }

  findMyKesediaan(userId: string) {
    return this.prisma.kesediaanBantu.findMany({
      where: { userId },
      select: { requestId: true, status: true },
    });
  }

  async batalKesediaan(requestId: string, userId: string, dto: BatalKesediaanDto) {
    const request = await this.findOne(requestId);
    const kesediaan = await this.prisma.kesediaanBantu.findUnique({
      where: { requestId_userId: { requestId, userId } },
    });
    if (!kesediaan || kesediaan.status !== KesediaanStatus.AKTIF) {
      throw new BadRequestException('Kesediaan membantu yang aktif tidak ditemukan');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.message.create({
        data: {
          senderId: userId,
          receiverId: request.pembuatId,
          isi: `Pembatalan bantuan: ${dto.alasan.trim()}`,
        },
      });
      return transaction.kesediaanBantu.update({
        where: { id: kesediaan.id },
        data: { status: KesediaanStatus.DIBATALKAN, dibatalkanAt: new Date() },
      });
    });
  }
}

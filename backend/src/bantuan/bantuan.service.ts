import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBantuanDto } from './dto/create-bantuan.dto';
import { UpdateBantuanDto } from './dto/update-bantuan.dto';
import { BatalKesediaanDto } from './dto/batal-kesediaan.dto';
import { BantuanStatus, KesediaanStatus, PreferensiRelawan, Prisma, SkillCategory } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { CreateJamKontribusiDto } from './dto/create-jam-kontribusi.dto';
import { KonfirmasiJamKontribusiDto } from './dto/konfirmasi-jam-kontribusi.dto';

@Injectable()
export class BantuanService {
  constructor(private prisma: PrismaService, private usersService: UsersService) { }

  private matchesPreferensiRelawan(user: { role: string; keahlian: SkillCategory[]; kategoriUsia: string | null }, preferensi: PreferensiRelawan) {
    if (preferensi === PreferensiRelawan.SEMUA) return true;
    if (user.role !== 'PENGGERAK') return false;

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

  // Khusus Penggerak & Admin: lihat semua termasuk yang masih menunggu verifikasi
  findAllForVerifikator(preferensi?: PreferensiRelawan) {
    this.isValidPreferensi(preferensi);
    const where = undefined;

    return this.prisma.bantuanRequest.findMany({
      where,
      include: { pembuat: { select: { id: true, nama: true, email: true, role: true, keahlian: true, tanggalLahir: true } } },
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

  // Hanya boleh dipanggil dari endpoint yang dilindungi Roles(PENGGERAK, ADMIN)
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

  async ajukanJamKontribusi(bantuanId: string, penggerakId: string, dto: CreateJamKontribusiDto) {
    const bantuan = await this.prisma.bantuanRequest.findUnique({
      where: { id: bantuanId },
      select: { id: true, status: true, pembuatId: true, createdAt: true, dibutuhkanSebelum: true },
    });
    if (!bantuan) throw new NotFoundException('Permintaan bantuan tidak ditemukan.');
    if (bantuan.status !== BantuanStatus.SELESAI) {
      throw new BadRequestException('Jam hanya dapat diajukan untuk bantuan yang selesai.');
    }
    if (bantuan.pembuatId === penggerakId) {
      throw new ForbiddenException('Peminta bantuan tidak dapat mengajukan jam kontribusi untuk bantuannya sendiri.');
    }

    const kesediaan = await this.prisma.kesediaanBantu.findUnique({
      where: { requestId_userId: { requestId: bantuanId, userId: penggerakId } },
      select: { status: true },
    });
    if (!kesediaan || kesediaan.status !== KesediaanStatus.AKTIF) {
      throw new ForbiddenException('Hanya Penggerak yang membantu bantuan ini yang dapat mengajukan jam.');
    }
    if (!bantuan.dibutuhkanSebelum) {
      throw new BadRequestException('Jadwal bantuan tidak tersedia untuk menghitung batas jam.');
    }

    const jadwalJam = Math.max(0, (bantuan.dibutuhkanSebelum.getTime() - bantuan.createdAt.getTime()) / (60 * 60 * 1000));
    const batasJam = jadwalJam + 2;
    if (dto.jumlahJam > batasJam + Number.EPSILON) {
      throw new BadRequestException(`Jumlah jam melebihi durasi jadwal bantuan ditambah 2 jam (maksimal ${batasJam.toFixed(1)} jam).`);
    }

    try {
      return await this.prisma.jamKontribusi.create({
        data: {
          bantuanId,
          penggerakId,
          jumlahJam: new Prisma.Decimal(dto.jumlahJam),
          catatan: dto.catatan?.trim() || null,
          batasKonfirmasiAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        select: {
          id: true,
          bantuanId: true,
          jumlahJam: true,
          catatan: true,
          status: true,
          diajukanAt: true,
          batasKonfirmasiAt: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Pengajuan jam untuk bantuan ini sudah pernah dibuat.');
      }
      throw error;
    }
  }

  async getJamKontribusi(bantuanId: string, userId: string) {
    const bantuan = await this.prisma.bantuanRequest.findUnique({
      where: { id: bantuanId },
      select: { id: true, pembuatId: true },
    });
    if (!bantuan) throw new NotFoundException('Permintaan bantuan tidak ditemukan.');

    const jam = await this.prisma.jamKontribusi.findUnique({ where: { bantuanId } });
    if (jam && jam.status === 'MENUNGGU' && jam.batasKonfirmasiAt <= new Date()) {
      await this.prisma.jamKontribusi.updateMany({
        where: { id: jam.id, status: 'MENUNGGU', batasKonfirmasiAt: { lte: new Date() } },
        data: { status: 'KEDALUWARSA' },
      });
    }

    const currentJam = jam
      ? await this.prisma.jamKontribusi.findUnique({ where: { id: jam.id } })
      : null;
    const isOwner = bantuan.pembuatId === userId;
    const isApplicant = currentJam?.penggerakId === userId;
    const activeSupport = !currentJam ? await this.prisma.kesediaanBantu.findFirst({
      where: { requestId: bantuanId, userId, status: KesediaanStatus.AKTIF },
      select: { id: true },
    }) : null;

    if (!isOwner && !isApplicant && !activeSupport) {
      throw new NotFoundException('Jam kontribusi tidak ditemukan.');
    }
    if (!currentJam) return null;

    const { penggerakId: _penggerakId, ...safeJam } = currentJam;
    return safeJam;
  }

  async konfirmasiJamKontribusi(bantuanId: string, pemintaId: string, dto: KonfirmasiJamKontribusiDto) {
    if (dto.keputusan === 'DITOLAK' && !dto.alasanTolak?.trim()) {
      throw new BadRequestException('Alasan penolakan wajib diisi.');
    }
    const bantuan = await this.prisma.bantuanRequest.findUnique({
      where: { id: bantuanId },
      select: { id: true, pembuatId: true, status: true },
    });
    if (!bantuan) throw new NotFoundException('Permintaan bantuan tidak ditemukan.');
    if (bantuan.pembuatId !== pemintaId) throw new NotFoundException('Jam kontribusi tidak ditemukan.');
    if (bantuan.status !== BantuanStatus.SELESAI) throw new BadRequestException('Bantuan belum selesai.');

    const jam = await this.prisma.jamKontribusi.findUnique({ where: { bantuanId } });
    if (!jam) throw new NotFoundException('Pengajuan jam kontribusi tidak ditemukan.');
    if (jam.status === 'MENUNGGU' && jam.batasKonfirmasiAt <= new Date()) {
      await this.prisma.jamKontribusi.updateMany({
        where: { id: jam.id, status: 'MENUNGGU', batasKonfirmasiAt: { lte: new Date() } },
        data: { status: 'KEDALUWARSA' },
      });
      throw new BadRequestException('Batas konfirmasi telah lewat; pengajuan berstatus kedaluwarsa.');
    }
    if (jam.status !== 'MENUNGGU') throw new BadRequestException('Pengajuan jam ini sudah diproses.');

    const now = new Date();
    const updated = await this.prisma.jamKontribusi.updateMany({
      where: { id: jam.id, status: 'MENUNGGU', batasKonfirmasiAt: { gt: now } },
      data: {
        status: dto.keputusan,
        dikonfirmasiAt: now,
        alasanTolak: dto.keputusan === 'DITOLAK' ? dto.alasanTolak?.trim() : null,
      },
    });
    if (updated.count !== 1) throw new BadRequestException('Pengajuan jam ini sudah diproses atau kedaluwarsa.');
    return this.getJamKontribusi(bantuanId, pemintaId);
  }

  async hapus(id: string, userId: string, role: string) {
    const item = await this.findOne(id);
    if (item.status === BantuanStatus.AKTIF || item.status === BantuanStatus.DIPROSES || item.status === BantuanStatus.MENUNGGU_VERIFIKASI) {
      throw new BadRequestException('Hanya permintaan yang sudah selesai/ditolak yang bisa dihapus');
    }
    if (item.pembuatId !== userId && role !== 'ADMIN' && role !== 'PENGGERAK') {
      throw new ForbiddenException('Hanya pembuat atau admin/penggerak yang bisa menghapus permintaan ini');
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

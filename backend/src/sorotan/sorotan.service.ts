import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SOROTAN_CONFIG,
  BIDANG_DAFTAR,
  KABUPATEN_DAFTAR,
  type Bidang,
  type Kabupaten,
} from './sorotan.config';
import {
  IklanStatus,
  IklanKeputusan,
  TransaksiIklanTipe,
} from '@prisma/client';

const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AVATAR_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function isValidBidang(value: string): value is Bidang {
  return BIDANG_DAFTAR.includes(value as Bidang);
}

function isValidKabupaten(value: string): value is Kabupaten {
  return KABUPATEN_DAFTAR.includes(value as Kabupaten);
}

function isAktif(status: IklanStatus): boolean {
  return (
    status === IklanStatus.MENUNGGU ||
    status === IklanStatus.DISETUJUI ||
    status === IklanStatus.DRAFT
  );
}

function isBerjalan(status: IklanStatus, now: Date): boolean {
  if (status !== IklanStatus.DISETUJUI) return false;
  return false;
}

@Injectable()
export class SorotanService {
  constructor(private prisma: PrismaService) { }

  async createDraft(
    userId: string,
    dto: {
      judul: string;
      deskripsi: string;
      bidang: string;
      kabupatenKota: string;
    },
  ) {
    const { judul, deskripsi, bidang, kabupatenKota } = dto;

    if (!judul || judul.trim().length === 0) {
      throw new BadRequestException('Judul wajib diisi.');
    }
    if (judul.trim().length > SOROTAN_CONFIG.JUDUL_MAX) {
      throw new BadRequestException(`Judul maksimal ${SOROTAN_CONFIG.JUDUL_MAX} karakter.`);
    }
    if (!deskripsi || deskripsi.trim().length === 0) {
      throw new BadRequestException('Deskripsi wajib diisi.');
    }
    if (deskripsi.trim().length > SOROTAN_CONFIG.DESKRIPSI_MAX) {
      throw new BadRequestException(`Deskripsi maksimal ${SOROTAN_CONFIG.DESKRIPSI_MAX} karakter.`);
    }
    if (!isValidBidang(bidang)) {
      throw new BadRequestException('Bidang tidak valid.');
    }
    if (!isValidKabupaten(kabupatenKota)) {
      throw new BadRequestException('Kabupaten/Kota tidak valid.');
    }

    const iklan = await this.prisma.iklan.create({
      data: {
        pemilikId: userId,
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        bidang,
        kabupatenKota,
        status: IklanStatus.DRAFT,
      },
    });

    return iklan;
  }

  async updateDraft(
    iklanId: string,
    userId: string,
    dto: {
      judul?: string;
      deskripsi?: string;
      bidang?: string;
      kabupatenKota?: string;
      fotoUrl?: string | null;
    },
  ) {
    const iklan = await this.prisma.iklan.findUnique({
      where: { id: iklanId },
    });

    if (!iklan) throw new NotFoundException('Iklan tidak ditemukan.');
    if (iklan.pemilikId !== userId) {
      throw new ForbiddenException('Iklan ini bukan milik Anda.');
    }
    if (iklan.status !== IklanStatus.DRAFT) {
      throw new BadRequestException('Hanya iklan dengan status DRAFT yang dapat diubah.');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.judul !== undefined) {
      if (!dto.judul || dto.judul.trim().length === 0) {
        throw new BadRequestException('Judul wajib diisi.');
      }
      if (dto.judul.trim().length > SOROTAN_CONFIG.JUDUL_MAX) {
        throw new BadRequestException(`Judul maksimal ${SOROTAN_CONFIG.JUDUL_MAX} karakter.`);
      }
      updateData.judul = dto.judul.trim();
    }
    if (dto.deskripsi !== undefined) {
      if (!dto.deskripsi || dto.deskripsi.trim().length === 0) {
        throw new BadRequestException('Deskripsi wajib diisi.');
      }
      if (dto.deskripsi.trim().length > SOROTAN_CONFIG.DESKRIPSI_MAX) {
        throw new BadRequestException(`Deskripsi maksimal ${SOROTAN_CONFIG.DESKRIPSI_MAX} karakter.`);
      }
      updateData.deskripsi = dto.deskripsi.trim();
    }
    if (dto.bidang !== undefined) {
      if (!isValidBidang(dto.bidang)) {
        throw new BadRequestException('Bidang tidak valid.');
      }
      updateData.bidang = dto.bidang;
    }
    if (dto.kabupatenKota !== undefined) {
      if (!isValidKabupaten(dto.kabupatenKota)) {
        throw new BadRequestException('Kabupaten/Kota tidak valid.');
      }
      updateData.kabupatenKota = dto.kabupatenKota;
    }
    if (dto.fotoUrl !== undefined) {
      updateData.fotoUrl = dto.fotoUrl;
    }

    return this.prisma.iklan.update({
      where: { id: iklanId },
      data: updateData,
    });
  }

  async ajukan(iklanId: string, userId: string) {
    const [iklan, user, aktifLain] = await Promise.all([
      this.prisma.iklan.findUnique({ where: { id: iklanId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
      this.prisma.iklan.findFirst({
        where: {
          pemilikId: userId,
          status: {
            in: [IklanStatus.MENUNGGU, IklanStatus.DISETUJUI, IklanStatus.DRAFT],
          },
          NOT: { id: iklanId },
        },
      }),
    ]);

    if (!iklan) throw new NotFoundException('Iklan tidak ditemukan.');
    if (iklan.pemilikId !== userId) {
      throw new ForbiddenException('Iklan ini bukan milik Anda.');
    }
    if (iklan.status !== IklanStatus.DRAFT) {
      throw new BadRequestException('Hanya iklan DRAFT yang dapat diajukan.');
    }
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan.');
    if (user.currency < SOROTAN_CONFIG.HARGA_PAKET) {
      throw new BadRequestException('Currency tidak cukup.');
    }
    if (aktifLain) {
      throw new BadRequestException('Anda sudah memiliki iklan aktif. Hapus atau tarik iklan lain sebelum mengajukan baru.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.logTransaksiIklan.create({
        data: {
          iklanId,
          pemilikId: userId,
          jumlah: SOROTAN_CONFIG.HARGA_PAKET,
          tipe: TransaksiIklanTipe.BELI,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { currency: { decrement: SOROTAN_CONFIG.HARGA_PAKET } },
      });
      return tx.iklan.update({
        where: { id: iklanId },
        data: { status: IklanStatus.MENUNGGU },
      });
    });
  }

  async getMyIklan(userId: string) {
    return this.prisma.iklan.findMany({
      where: { pemilikId: userId },
      orderBy: { dibuatAt: 'desc' },
      include: {
        _count: {
          select: { moderasi: true },
        },
      },
    });
  }

  async getTayang(bidang?: string) {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const where: Record<string, unknown> = {
      status: IklanStatus.DISETUJUI,
      mulaiAt: { lte: today },
      berakhirAt: { gte: today },
    };
    if (bidang && isValidBidang(bidang)) {
      where.bidang = bidang;
    }

    const iklanList = await this.prisma.iklan.findMany({
      where,
      include: {
        tayangan: {
          where: { tanggal: today },
        },
      },
      orderBy: { dibuatAt: 'asc' },
    });

    for (const iklan of iklanList) {
      const tayanganHariIni = iklan.tayangan[0];
      const tayangSudah = tayanganHariIni ? tayanganHariIni.tayang : 0;
      if (tayangSudah >= iklan.kuotaHarian) continue;

      const pemilik = await this.prisma.user.findUnique({
        where: { id: iklan.pemilikId },
        select: { id: true, nama: true, kabupatenKota: true },
      });

      return {
        id: iklan.id,
        judul: iklan.judul,
        deskripsi: iklan.deskripsi,
        bidang: iklan.bidang,
        kabupatenKota: iklan.kabupatenKota,
        fotoUrl: iklan.fotoUrl,
        pemilik: {
          id: pemilik?.id,
          nama: pemilik?.nama,
          kabupatenKota: pemilik?.kabupatenKota,
        },
        kuotaHarian: iklan.kuotaHarian,
        tayangHariIni: tayangSudah,
      };
    }

    return null;
  }

  async catatTayang(iklanId: string) {
    const today = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
    );

    return this.prisma.tayanganIklan.upsert({
      where: { iklanId_tanggal: { iklanId, tanggal: today } },
      create: { iklanId, tanggal: today, tayang: 1 },
      update: { tayang: { increment: 1 } },
    });
  }

  async catatKlik(iklanId: string) {
    const today = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
    );

    return this.prisma.tayanganIklan.upsert({
      where: { iklanId_tanggal: { iklanId, tanggal: today } },
      create: { iklanId, tanggal: today, klik: 1 },
      update: { klik: { increment: 1 } },
    });
  }

  async getAdminIklan(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    return this.prisma.iklan.findMany({
      where,
      include: {
        pemilik: {
          select: { id: true, nama: true, phone: true, kabupatenKota: true, dusun: true },
        },
        moderasi: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { dibuatAt: 'desc' },
    });
  }

  async getAdminIklanDetail(iklanId: string) {
    const iklan = await this.prisma.iklan.findUnique({
      where: { id: iklanId },
      include: {
        pemilik: {
          select: { id: true, nama: true, phone: true, kabupatenKota: true, dusun: true, role: true },
        },
        moderasi: {
          include: {
            admin: {
              select: { id: true, nama: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        transaksi: {
          orderBy: { createdAt: 'desc' },
        },
        tayangan: {
          orderBy: { tanggal: 'desc' },
          take: 7,
        },
      },
    });
    if (!iklan) throw new NotFoundException('Iklan tidak ditemukan.');
    return iklan;
  }

  async keputusan(
    iklanId: string,
    adminId: string,
    dto: { keputusan: string; alasan?: string; catatanRevisi?: string },
  ) {
    const iklan = await this.prisma.iklan.findUnique({
      where: { id: iklanId },
      include: { pemilik: true },
    });
    if (!iklan) throw new NotFoundException('Iklan tidak ditemukan.');
    if (iklan.pemilikId === adminId) {
      throw new ForbiddenException('Admin tidak boleh memoderasi iklan miliknya sendiri.');
    }

    const keputusan = dto.keputusan as IklanKeputusan;
    if (!Object.values(IklanKeputusan).includes(keputusan)) {
      throw new BadRequestException('Keputusan tidak valid.');
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tigaHariLagi = new Date(tomorrow);
    tigaHariLagi.setDate(tigaHariLagi.getDate() + SOROTAN_CONFIG.DURASI_HARI);

    let updateData: Record<string, unknown> = {
      status: IklanStatus.DRAFT,
    };
    let message = '';

    if (keputusan === IklanKeputusan.SETUJUI) {
      updateData = {
        status: IklanStatus.DISETUJUI,
        mulaiAt: tomorrow,
        berakhirAt: tigaHariLagi,
      };
      message = 'Iklan disetujui.';
    } else if (keputusan === IklanKeputusan.TOLAK) {
      if (!dto.alasan || dto.alasan.trim().length === 0) {
        throw new BadRequestException('Alasan wajib diisi untuk penolakan.');
      }
      updateData = {
        status: IklanStatus.DITOLAK,
        alasanTolak: dto.alasan.trim(),
      };
      await this.prisma.$transaction([
        this.prisma.logTransaksiIklan.create({
          data: {
            iklanId,
            pemilikId: iklan.pemilikId,
            jumlah: SOROTAN_CONFIG.HARGA_PAKET,
            tipe: TransaksiIklanTipe.KEMBALI,
          },
        }),
        this.prisma.user.update({
          where: { id: iklan.pemilikId },
          data: { currency: { increment: SOROTAN_CONFIG.HARGA_PAKET } },
        }),
      ]);
      message = 'Iklan ditolak, currency dikembalikan.';
    } else if (keputusan === IklanKeputusan.REVISI) {
      const revisiCount = await this.prisma.moderasiIklan.count({
        where: { iklanId, keputusan: IklanKeputusan.REVISI },
      });
      if (revisiCount >= 2) {
        throw new BadRequestException('Iklan telah mencapai batas maksimal 2 kali revisi.');
      }
      if (!dto.catatanRevisi || dto.catatanRevisi.trim().length === 0) {
        throw new BadRequestException('Catatan revisi wajib diisi.');
      }
      updateData = {
        status: IklanStatus.DRAFT,
        jumlahRevisi: { increment: 1 },
        catatanRevisi: dto.catatanRevisi.trim(),
      };
      message = 'Iklan dikembalikan untuk revisi.';
    } else if (keputusan === IklanKeputusan.TARIK) {
      updateData = { status: IklanStatus.DITARIK };
      message = 'Iklan ditarik.';
    }

    await this.prisma.$transaction([
      this.prisma.iklan.update({ where: { id: iklanId }, data: updateData }),
      this.prisma.moderasiIklan.create({
        data: {
          iklanId,
          adminId,
          keputusan,
          alasan: dto.alasan?.trim() ?? dto.catatanRevisi?.trim() ?? null,
        },
      }),
    ]);

    return { message, iklanId, status: updateData.status as string };
  }

  async expireExpiredIklan() {
    const now = new Date();
    return this.prisma.iklan.updateMany({
      where: {
        status: IklanStatus.DISETUJUI,
        berakhirAt: { lt: now },
      },
      data: { status: IklanStatus.BERAKHIR },
    });
  }
}

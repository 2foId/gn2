import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcaraDto } from './dto/create-acara.dto';
import { CreateLogistikDto } from './dto/create-logistik.dto';

@Injectable()
export class AcaraService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateAcaraDto) {
    const acara = await this.prisma.acara.create({
      data: {
        nama: dto.nama,
        deskripsi: dto.deskripsi,
        jenis: dto.jenis,
        lokasi: dto.lokasi,
        waktuMulai: new Date(dto.waktuMulai),
        waktuSelesai: dto.waktuSelesai ? new Date(dto.waktuSelesai) : undefined,
        foto: dto.foto,
        pembuatId: userId,
        targetHadir: dto.targetHadir ?? 1,
      },
    });
    // Penyelenggara otomatis tercatat hadir.
    await this.prisma.acaraAbsensi.create({
      data: { acaraId: acara.id, userId, hadir: true },
    });
    return acara;
  }

  findAll() {
    return this.prisma.acara.findMany({
      include: {
        pembuat: { select: { id: true, nama: true, avatarUrl: true } },
        _count: { select: { logistik: true, absensi: true } },
      },
      orderBy: { waktuMulai: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.acara.findUnique({
      where: { id },
      include: {
        pembuat: { select: { id: true, nama: true, avatarUrl: true } },
        logistik: true,
        absensi: { include: { user: { select: { id: true, nama: true, avatarUrl: true } } } },
      },
    });
    if (!item) throw new NotFoundException('Acara tidak ditemukan');
    return item;
  }

  async addLogistik(acaraId: string, dto: CreateLogistikDto) {
    await this.findOne(acaraId);
    return this.prisma.acaraLogistik.create({
      data: { acaraId, ...dto },
    });
  }

  async toggleLogistikDipenuhi(logistikId: string) {
    const item = await this.prisma.acaraLogistik.findUnique({ where: { id: logistikId } });
    if (!item) throw new NotFoundException('Item logistik tidak ditemukan');
    return this.prisma.acaraLogistik.update({
      where: { id: logistikId },
      data: { dipenuhi: !item.dipenuhi },
    });
  }

  async generateQr(acaraId: string, creatorId: string) {
    const acara = await this.findOne(acaraId);
    if (acara.pembuatId !== creatorId) throw new ForbiddenException('Hanya pembuat acara yang bisa membuat QR');
    return this.prisma.acara.update({
      where: { id: acaraId },
      data: { kodeQr: randomUUID(), kodeQrExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      select: { kodeQr: true, kodeQrExpiresAt: true },
    });
  }

  async generateKodeAbsen(acaraId: string, creatorId: string) {
    const acara = await this.findOne(acaraId);
    if (acara.pembuatId !== creatorId) throw new ForbiddenException('Hanya penyelenggara yang bisa membuat kode absen');
    const kode = String(randomInt(0, 10000)).padStart(4, '0');
    return this.prisma.acara.update({
      where: { id: acaraId },
      data: { kodeAbsen: kode },
      select: { kodeAbsen: true },
    });
  }

  async absen(acaraId: string, userId: string, kode: string) {
    const acara = await this.findOne(acaraId);
    if (!acara.kodeAbsen) throw new BadRequestException('Kode absen belum dibuat oleh penyelenggara');
    if (acara.kodeAbsen !== kode) throw new BadRequestException('Kode absen salah');
    const existing = await this.prisma.acaraAbsensi.findUnique({
      where: { acaraId_userId: { acaraId, userId } },
    });
    if (existing) return existing;
    return this.prisma.acaraAbsensi.create({
      data: { acaraId, userId, hadir: true },
    });
  }
}

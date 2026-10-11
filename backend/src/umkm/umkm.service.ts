import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUmkmNeedDto } from './dto/create-umkm-need.dto';
import { UmkmNeedStatus } from '@prisma/client';

@Injectable()
export class UmkmService {
  constructor(private prisma: PrismaService) { }

  create(userId: string, dto: CreateUmkmNeedDto) {
    return this.prisma.umkmNeed.create({
      data: {
        ...dto,
        dibutuhkanSebelum: dto.dibutuhkanSebelum ? new Date(dto.dibutuhkanSebelum) : undefined,
        pemilikId: userId,
      },
    });
  }

  findAll(status?: UmkmNeedStatus) {
    return this.prisma.umkmNeed.findMany({
      where: status ? { status } : undefined,
      include: {
        pemilik: { select: { id: true, nama: true, avatarUrl: true } },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.umkmNeed.findUnique({
      where: { id },
      include: {
        pemilik: { select: { id: true, nama: true, avatarUrl: true } },
        responses: {
          include: { penolong: { select: { id: true, nama: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!item) throw new NotFoundException('Kebutuhan UMKM tidak ditemukan');
    return item;
  }

  async addResponse(needId: string, penolongId: string, pesan: string) {
    const item = await this.findOne(needId);
    const response = await this.prisma.umkmResponse.create({
      data: { needId, penolongId, pesan },
      include: { penolong: { select: { id: true, nama: true } } },
    });
    // Begitu ada yang menawarkan bantuan, status otomatis naik ke DALAM PROSES.
    if (item.status === 'DIBUKA') {
      await this.prisma.umkmNeed.update({
        where: { id: needId },
        data: { status: 'DALAM_PROSES' },
      });
    }
    return response;
  }

  // Hanya pemilik usaha sendiri yang boleh ubah status kebutuhannya
  async updateStatus(id: string, userId: string, status: UmkmNeedStatus) {
    const item = await this.findOne(id);
    if (item.pemilikId !== userId) {
      throw new ForbiddenException('Hanya pemilik usaha yang bisa mengubah status ini');
    }
    return this.prisma.umkmNeed.update({ where: { id }, data: { status } });
  }

  // Hanya pemilik usaha, relawan, atau admin yang boleh menghapus kebutuhan
  async hapus(id: string, userId: string, role: string) {
    const item = await this.findOne(id);
    if (item.pemilikId !== userId && role !== 'ADMIN' && role !== 'RELAWAN') {
      throw new ForbiddenException('Hanya pemilik usaha, relawan, atau admin yang bisa menghapus kebutuhan ini');
    }
    return this.prisma.umkmNeed.delete({ where: { id } });
  }
}

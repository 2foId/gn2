import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUmkmNeedDto } from './dto/create-umkm-need.dto';
import { UmkmNeedStatus, SkillCategory, Role } from '@prisma/client';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateUmkmRatingDto } from './dto/create-rating.dto';
import { KABUPATEN_DAFTAR } from '../sorotan/sorotan.config';

@Injectable()
export class UmkmService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateUmkmNeedDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kabupatenKota: true } });
    const { kategori, ...rest } = dto;
    return this.prisma.umkmNeed.create({
      data: {
        ...rest,
        category: kategori,
        dibutuhkanSebelum: dto.dibutuhkanSebelum ? new Date(dto.dibutuhkanSebelum) : undefined,
        pemilikId: userId,
        kabupatenKota: user?.kabupatenKota ?? null,
      },
    });
  }

  findAll(status?: UmkmNeedStatus, category?: SkillCategory, kabupaten?: string) {
    if (kabupaten !== undefined && kabupaten !== '' && !KABUPATEN_DAFTAR.includes(kabupaten as any)) {
      throw new BadRequestException('Kabupaten/kota tidak valid.');
    }
    return this.prisma.umkmNeed.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(kabupaten ? { kabupatenKota: kabupaten } : {}),
      },
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

  // Hanya pemilik usaha, penggerak, atau admin yang boleh menghapus kebutuhan
  async hapus(id: string, userId: string, role: string) {
    const item = await this.findOne(id);
    if (item.pemilikId !== userId && role !== 'ADMIN' && role !== 'PENGGERAK') {
      throw new ForbiddenException('Hanya pemilik usaha, penggerak, atau admin yang bisa menghapus kebutuhan ini');
    }
    return this.prisma.umkmNeed.delete({ where: { id } });
  }

  // Hanya Penggerak pemilik response, hanya jika status kebutuhan SELESAI, satu portofolio per response.
  async addPortfolio(responseId: string, userId: string, role: string, dto: CreatePortfolioDto & { beforeImageUrl: string; afterImageUrl: string }) {
    if (role !== Role.PENGGERAK) {
      throw new ForbiddenException('Hanya Penggerak yang bisa menambahkan portofolio.');
    }
    const response = await this.prisma.umkmResponse.findUnique({
      where: { id: responseId },
      include: { need: true, penolong: true },
    });
    if (!response) throw new NotFoundException('Respons tidak ditemukan.');
    if (response.penolongId !== userId) {
      throw new ForbiddenException('Hanya pemilik respons yang bisa menambahkan portofolio.');
    }
    if (response.need.status !== 'SELESAI') {
      throw new BadRequestException('Portofolio hanya bisa dibuat untuk kebutuhan yang sudah selesai.');
    }
    const existing = await this.prisma.umkmPortfolio.findUnique({ where: { responseId } });
    if (existing) {
      throw new BadRequestException('Respons ini sudah memiliki portofolio.');
    }
    return this.prisma.umkmPortfolio.create({
      data: {
        responseId,
        volunteerId: userId,
        umkmNeedId: response.needId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        beforeImageUrl: dto.beforeImageUrl,
        afterImageUrl: dto.afterImageUrl,
        isPublished: true,
      },
      include: {
        umkmNeed: { select: { id: true, namaUsaha: true, category: true } },
      },
    });
  }

  async updatePortfolio(id: string, userId: string, dto: UpdatePortfolioDto) {
    const portfolio = await this.prisma.umkmPortfolio.findUnique({ where: { id } });
    if (!portfolio) throw new NotFoundException('Portofolio tidak ditemukan.');
    if (portfolio.volunteerId !== userId) {
      throw new ForbiddenException('Hanya pemilik portofolio yang bisa mengubahnya.');
    }
    return this.prisma.umkmPortfolio.update({
      where: { id },
      data: dto,
      include: {
        umkmNeed: { select: { id: true, namaUsaha: true, category: true } },
      },
    });
  }

  async deletePortfolio(id: string, userId: string) {
    const portfolio = await this.prisma.umkmPortfolio.findUnique({ where: { id } });
    if (!portfolio) throw new NotFoundException('Portofolio tidak ditemukan.');
    if (portfolio.volunteerId !== userId) {
      throw new ForbiddenException('Hanya pemilik portofolio yang bisa menghapusnya.');
    }
    return this.prisma.umkmPortfolio.delete({ where: { id } });
  }

  async getVolunteerPortfolio(volunteerId: string, take: number) {
    return this.prisma.umkmPortfolio.findMany({
      where: { volunteerId, isPublished: true },
      include: {
        umkmNeed: { select: { id: true, namaUsaha: true, category: true } },
        response: { select: { id: true, pesan: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async addRating(responseId: string, userId: string, dto: CreateUmkmRatingDto) {
    const response = await this.prisma.umkmResponse.findUnique({
      where: { id: responseId },
      include: { need: true, penolong: true },
    });
    if (!response) throw new NotFoundException('Respons tidak ditemukan.');
    if (response.need.status !== 'SELESAI') {
      throw new BadRequestException('Penilaian hanya bisa diberikan setelah pekerjaan selesai.');
    }
    if (response.penolongId !== userId && response.need.pemilikId !== userId) {
      throw new ForbiddenException('Hanya pihak yang terlibat dalam respons ini yang bisa menilai.');
    }
    const toUserId = response.penolongId === userId ? response.need.pemilikId : response.penolongId;
    const existing = await this.prisma.umkmRating.findUnique({
      where: { responseId_fromUserId: { responseId, fromUserId: userId } },
    });
    if (existing) {
      throw new BadRequestException('Penilaian sudah pernah dikirim.');
    }
    return this.prisma.umkmRating.create({
      data: {
        responseId,
        fromUserId: userId,
        toUserId,
        score: dto.score,
        comment: dto.comment ?? null,
      },
      include: {
        fromUser: { select: { id: true, nama: true, avatarUrl: true } },
      },
    });
  }
}

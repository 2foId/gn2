import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWasiatDto } from './dto/create-wasiat.dto';
import { CreateLangkahDto } from './dto/create-langkah.dto';
import { Prisma, WasiatKategori } from '@prisma/client';

@Injectable()
export class WasiatService {
  constructor(private prisma: PrismaService) { }

  private sanitizeKuis(kuis: unknown) {
    if (!Array.isArray(kuis)) return [];

    return kuis.map((item) => {
      const soal = item as Record<string, any>;
      return {
        pertanyaan: String(soal.pertanyaan ?? ''),
        opsi: Array.isArray(soal.opsi) ? soal.opsi.map((opt) => String(opt)) : [],
      };
    });
  }

  private validateKuis(kuis: CreateLangkahDto['kuis']) {
    if (!Array.isArray(kuis) || kuis.length < 3 || kuis.length > 5) {
      throw new BadRequestException('Kuis harus memiliki 3 sampai 5 soal');
    }
    kuis.forEach((soal, index) => {
      if (!Array.isArray(soal.opsi) || soal.opsi.length < 2 || soal.opsi.length > 4) {
        throw new BadRequestException(`Soal ${index + 1} harus memiliki 2 sampai 4 pilihan`);
      }
      if (!Number.isInteger(soal.jawabanBenar) || soal.jawabanBenar < 0 || soal.jawabanBenar >= soal.opsi.length) {
        throw new BadRequestException(`Indeks jawaban benar soal ${index + 1} tidak valid`);
      }
    });
  }

  create(userId: string, dto: CreateWasiatDto) {
    return this.prisma.wasiat.create({
      data: { ...dto, penulisId: userId },
    });
  }

  async findAll(kategori?: WasiatKategori) {
    const items = await this.prisma.wasiat.findMany({
      where: kategori ? { kategori } : undefined,
      include: {
        penulis: { select: { id: true, nama: true, avatarUrl: true } },
        _count: { select: { saved: true, comments: true } },
        langkah: { select: { id: true } },
        comments: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items.map(({ comments, ...item }) => ({
      ...item,
      rating: comments.length ? comments.reduce((total, comment) => total + comment.rating, 0) / comments.length : null,
      jumlahRater: comments.length,
    }));
  }

  async findOne(id: string) {
    const item = await this.prisma.wasiat.findUnique({
      where: { id },
      include: {
        penulis: { select: { id: true, nama: true, avatarUrl: true } },
        comments: {
          include: { user: { select: { id: true, nama: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!item) throw new NotFoundException('Wasiat tidak ditemukan');
    return item;
  }

  async createLangkah(wasiatId: string, userId: string, dto: CreateLangkahDto) {
    const wasiat = await this.findOne(wasiatId);
    if (wasiat.penulisId !== userId) {
      throw new ForbiddenException('Hanya penulis wasiat yang dapat menambahkan quest');
    }
    this.validateKuis(dto.kuis);
    const langkah = await this.prisma.wasiatLangkah.create({
      data: { ...dto, wasiatId, kuis: dto.kuis as unknown as Prisma.InputJsonArray },
    });
    return { ...langkah, kuis: this.sanitizeKuis(langkah.kuis) };
  }

  async findLangkah(wasiatId: string, userId: string) {
    await this.findOne(wasiatId);
    const [langkah, progress] = await Promise.all([
      this.prisma.wasiatLangkah.findMany({ where: { wasiatId }, orderBy: { urutan: 'asc' } }),
      this.prisma.wasiatProgress.findMany({ where: { wasiatId, userId } }),
    ]);
    const progressByStep = new Map(progress.map((item) => [item.langkahId, item]));
    let previousPassed = true;

    return langkah.map((item) => {
      const itemProgress = progressByStep.get(item.id);
      const status = itemProgress?.lulus ? 'LULUS' : previousPassed ? 'TERBUKA' : 'TERKUNCI';
      previousPassed = status === 'LULUS';
      return {
        id: item.id,
        wasiatId: item.wasiatId,
        urutan: item.urutan,
        judul: item.judul,
        tujuan: item.tujuan,
        kuis: this.sanitizeKuis(item.kuis),
        status,
        progress: itemProgress ? {
          id: itemProgress.id,
          skor: itemProgress.skor,
          lulus: itemProgress.lulus,
          percobaan: itemProgress.percobaan,
          selesaiAt: itemProgress.selesaiAt,
          feedbackCatatan: itemProgress.feedbackCatatan,
          feedbackAt: itemProgress.feedbackAt,
        } : null,
      };
    });
  }

  async submitLangkah(wasiatId: string, urutan: number, userId: string, jawaban: number[]) {
    const wasiat = await this.findOne(wasiatId);
    const langkah = await this.prisma.wasiatLangkah.findUnique({
      where: { wasiatId_urutan: { wasiatId, urutan } },
    });

    if (!langkah) throw new NotFoundException('Langkah wasiat tidak ditemukan');

    const kuis = Array.isArray(langkah.kuis) ? langkah.kuis as Array<Record<string, any>> : [];
    if (kuis.length < 3 || kuis.length > 5) {
      throw new BadRequestException('Kuis langkah ini belum siap');
    }

    if (jawaban.length !== kuis.length) {
      throw new BadRequestException('Jumlah jawaban tidak sesuai dengan jumlah soal');
    }

    const previousStep = await this.prisma.wasiatLangkah.findFirst({
      where: { wasiatId, urutan: { lt: urutan } },
      orderBy: { urutan: 'desc' },
    });
    if (previousStep) {
      const previousProgress = await this.prisma.wasiatProgress.findUnique({
        where: { userId_langkahId: { userId, langkahId: previousStep.id } },
      });
      if (!previousProgress?.lulus) {
        throw new ForbiddenException('Selesaikan quest sebelumnya dulu');
      }
    }

    let benar = 0;
    kuis.forEach((soal, index) => {
      const answer = Number(jawaban[index]);
      const opsi = Array.isArray(soal.opsi) ? soal.opsi : [];
      if (!Number.isInteger(answer) || answer < 0 || answer >= opsi.length) {
        throw new BadRequestException(`Jawaban soal ${index + 1} tidak valid`);
      }
      if (answer === Number(soal.jawabanBenar)) {
        benar += 1;
      }
    });

    const skor = Math.round((benar / kuis.length) * 100);
    const lulus = skor >= 70;

    const existing = await this.prisma.wasiatProgress.findUnique({
      where: { userId_langkahId: { userId, langkahId: langkah.id } },
    });
    const lulusPertamaKali = lulus && !existing?.lulus;

    const progress = await this.prisma.wasiatProgress.upsert({
      where: { userId_langkahId: { userId, langkahId: langkah.id } },
      update: {
        skor,
        lulus: existing?.lulus || lulus,
        percobaan: { increment: 1 },
        selesaiAt: lulus && !existing?.selesaiAt ? new Date() : existing?.selesaiAt ?? null,
      },
      create: {
        userId,
        wasiatId,
        langkahId: langkah.id,
        skor,
        lulus,
        percobaan: 1,
        selesaiAt: lulus ? new Date() : null,
      },
    });

    const semuaLangkah = await this.prisma.wasiatLangkah.findMany({ where: { wasiatId }, orderBy: { urutan: 'asc' } });
    const questAkhirLulus = lulus && semuaLangkah[semuaLangkah.length - 1]?.id === langkah.id;

    return {
      wasiatId: wasiat.id,
      progressId: progress.id,
      skor,
      lulus,
      benar,
      total: kuis.length,
      xpDidapat: lulusPertamaKali ? 100 : 0,
      badgeBaru: lulusPertamaKali ? {
        kategori: wasiat.kategori,
        penjelajahKearifan: questAkhirLulus,
      } : null,
      jawabanBenar: kuis.map((soal) => Number(soal.jawabanBenar)),
    };
  }

  async findMyProgress(userId: string) {
    const progress = await this.prisma.wasiatProgress.findMany({
      where: { userId },
      include: {
        langkah: { select: { id: true, urutan: true, judul: true } },
        wasiat: {
          select: {
            id: true,
            judul: true,
            kategori: true,
            penulis: { select: { id: true, nama: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      totalXp: progress.filter((item) => item.lulus).length * 100,
      progress,
    };
  }

  async findWaitingFeedback(wasiatId: string, userId: string) {
    const wasiat = await this.findOne(wasiatId);
    if (wasiat.penulisId !== userId) {
      throw new ForbiddenException('Anda bukan penulis wasiat ini');
    }

    return this.prisma.wasiatProgress.findMany({
      where: { wasiatId, lulus: true, feedbackCatatan: null },
      include: {
        user: { select: { id: true, nama: true, avatarUrl: true } },
        langkah: { select: { id: true, urutan: true, judul: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async postFeedback(wasiatId: string, userId: string, progressId: string, catatan: string) {
    const wasiat = await this.findOne(wasiatId);
    if (wasiat.penulisId !== userId) {
      throw new ForbiddenException('Hanya penulis wasiat yang bisa memberi feedback');
    }

    const progress = await this.prisma.wasiatProgress.findFirst({
      where: { id: progressId, wasiatId },
    });

    if (!progress) throw new NotFoundException('Progress wasiat tidak ditemukan');
    if (!progress.lulus) throw new BadRequestException('Quest ini belum lulus');
    const trimmedNote = catatan.trim();
    if (!trimmedNote || trimmedNote.length > 300) {
      throw new BadRequestException('Catatan wajib diisi dan maksimal 300 karakter');
    }

    return this.prisma.wasiatProgress.update({
      where: { id: progressId },
      data: { feedbackCatatan: trimmedNote, feedbackAt: new Date() },
    });
  }

  async toggleSave(wasiatId: string, userId: string) {
    await this.findOne(wasiatId);
    const existing = await this.prisma.wasiatSaved.findUnique({
      where: { wasiatId_userId: { wasiatId, userId } },
    });

    if (existing) {
      await this.prisma.wasiatSaved.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.wasiatSaved.create({ data: { wasiatId, userId } });
    return { saved: true };
  }

  findMySaved(userId: string) {
    return this.prisma.wasiatSaved.findMany({
      where: { userId },
      include: { wasiat: { include: { penulis: { select: { id: true, nama: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(wasiatId: string, userId: string, isi: string, rating: number) {
    await this.findOne(wasiatId);
    const commentCount = await this.prisma.wasiatComment.count({ where: { wasiatId, userId } });
    if (commentCount >= 3) {
      throw new BadRequestException('Anda sudah mencapai batas 3 komentar untuk wasiat ini');
    }
    return this.prisma.wasiatComment.create({
      data: { wasiatId, userId, isi, rating },
      include: { user: { select: { id: true, nama: true } } },
    });
  }

  async deleteComment(wasiatId: string, commentId: string, userId: string, role: string) {
    const comment = await this.prisma.wasiatComment.findFirst({ where: { id: commentId, wasiatId } });
    if (!comment) throw new NotFoundException('Komentar tidak ditemukan');
    if (comment.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('Anda hanya dapat menghapus komentar sendiri');
    }
    await this.prisma.wasiatComment.delete({ where: { id: commentId } });
    return { message: 'Komentar berhasil dihapus' };
  }
}

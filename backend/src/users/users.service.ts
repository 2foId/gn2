import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ThemePreference } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { hitungLevel } from './level';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  kategoriUsia(tanggalLahir?: Date | string | null): 'PEMUDA_18_30' | 'DEWASA' | null {
    if (!tanggalLahir) return null;
    const birthDate = new Date(tanggalLahir);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getUTCFullYear();
    const birthdayHasNotPassed = today.getMonth() < birthDate.getUTCMonth()
      || (today.getMonth() === birthDate.getUTCMonth() && today.getDate() < birthDate.getUTCDate());
    if (birthdayHasNotPassed) age -= 1;

    if (age >= 18 && age <= 30) return 'PEMUDA_18_30';
    return age > 30 && age <= 100 ? 'DEWASA' : null;
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getLevel(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { level: true, xpTotal: true, currency: true },
    });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    return { ...hitungLevel(user.xpTotal), currency: user.currency };
  }

  updateTheme(id: string, theme: ThemePreference) {
    return this.prisma.user.update({
      where: { id },
      data: { themePreference: theme },
      select: {
        id: true,
        nama: true,
        kontak: true,
        role: true,
        dusun: true,
        avatarUrl: true,
        bio: true,
        themePreference: true,
      },
    });
  }

  async findPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        dusun: true,
        role: true,
        keahlian: true,
        ketersediaan: true,
        tanggalLahir: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Profil tidak ditemukan');
    const { tanggalLahir, ...publicUser } = user;
    return {
      ...publicUser,
      phone: user.role === 'PENGGERAK' ? user.phone : null,
      kategoriUsia: this.kategoriUsia(tanggalLahir),
    };
  }

  async findMyProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        dusun: true,
        role: true,
        onboardingDone: true,
        keahlian: true,
        ketersediaan: true,
        tanggalLahir: true,
        themePreference: true,
        kabupatenKota: true,
        createdAt: true,
        bingkaiAktifId: true,
        bingkaiDimiliki: {
          include: { bingkai: true },
        },
      },
    });
    return user ? { ...user, kategoriUsia: this.kategoriUsia(user.tanggalLahir) } : null;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const { role: ignoredRole, ...profileFields } = dto as UpdateProfileDto & { role?: unknown };
    void ignoredRole;

    const currentUser = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!currentUser) throw new NotFoundException('Profil tidak ditemukan');

    const role = currentUser.role;
    if (role === 'PELAJAR' && dto.phone !== undefined) {
      throw new BadRequestException('Nomor WhatsApp hanya untuk Penggerak.');
    }

    const payload = {
      ...profileFields,
      phone: role === 'PELAJAR'
        ? null
        : dto.phone === undefined
          ? undefined
          : dto.phone === null
            ? null
            : dto.phone.startsWith('08')
              ? `+62${dto.phone.slice(1)}`
              : dto.phone,
      tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined,
    };

    const user = await this.prisma.user.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        nama: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        dusun: true,
        role: true,
        onboardingDone: true,
        keahlian: true,
        ketersediaan: true,
        tanggalLahir: true,
        themePreference: true,
        kabupatenKota: true,
        createdAt: true,
      },
    });
    return { ...user, kategoriUsia: this.kategoriUsia(user.tanggalLahir) };
  }

  async saveOnboardingAge(id: string, age: number) {
    if (!Number.isInteger(age) || age < 13 || age > 30) {
      throw new BadRequestException('Umur harus antara 13 dan 30 tahun.');
    }
    const role = age <= 17 ? 'PELAJAR' : 'PENGGERAK';
    const result = await this.prisma.user.updateMany({
      where: { id, onboardingDone: false },
      data: {
        age,
        role,
        ...(role === 'PELAJAR' ? { phone: null, bidang: null } : {}),
      },
    });
    if (result.count !== 1) throw new BadRequestException('Onboarding sudah selesai.');
    return { age, role };
  }

  async saveOnboardingBidang(id: string, bidang: string) {
    const result = await this.prisma.user.updateMany({
      where: { id, role: 'PENGGERAK', onboardingDone: false },
      data: { bidang },
    });
    if (result.count !== 1) {
      throw new BadRequestException('Bidang hanya dapat dipilih oleh Penggerak saat onboarding.');
    }
    return { bidang };
  }

  async completeOnboarding(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { age: true, role: true, bidang: true, onboardingDone: true },
    });
    if (!user || user.onboardingDone) throw new BadRequestException('Onboarding sudah selesai.');
    if (user.age === null) throw new BadRequestException('Umur wajib diisi sebelum menyelesaikan onboarding.');
    if (user.role === 'PENGGERAK' && !user.bidang) {
      throw new BadRequestException('Bidang wajib dipilih oleh Penggerak.');
    }

    const result = await this.prisma.user.updateMany({
      where: { id, onboardingDone: false, age: { not: null } },
      data: { onboardingDone: true },
    });
    if (result.count !== 1) throw new BadRequestException('Onboarding sudah selesai.');
    return this.findMyProfile(id);
  }

  updateAvatar(id: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: { id: true, nama: true, avatarUrl: true },
    });
  }

  async findNotes(authorId: string, targetUserId: string) {
    await this.findPublicProfile(targetUserId);
    return this.prisma.profileNote.findMany({ where: { authorId, targetUserId }, orderBy: { updatedAt: 'desc' } });
  }

  async createNote(authorId: string, targetUserId: string, isi: string) {
    await this.findPublicProfile(targetUserId);
    return this.prisma.profileNote.create({ data: { authorId, targetUserId, isi } });
  }

  async findUserRatings(userId: string) {
    const ratings = await this.prisma.umkmRating.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { select: { id: true, nama: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const visible = await Promise.all(ratings.map(async (r) => {
      const count = await this.prisma.umkmRating.count({ where: { responseId: r.responseId } });
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return count >= 2 || r.createdAt <= fourteenDaysAgo;
    }));

    const visibleRatings = ratings.filter((_, i) => visible[i]);
    const jumlahUlasan = visibleRatings.length;
    const avgScore = jumlahUlasan > 0
      ? visibleRatings.reduce((sum, r) => sum + r.score, 0) / jumlahUlasan
      : 0;

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      jumlahUlasan,
      ulasan: visibleRatings.slice(0, 5).map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        fromUser: r.fromUser,
      })),
    };
  }

  async deleteNote(authorId: string, targetUserId: string, noteId: string) {
    const note = await this.prisma.profileNote.findFirst({ where: { id: noteId, authorId, targetUserId } });
    if (!note) throw new NotFoundException('Catatan tidak ditemukan');
    return this.prisma.profileNote.delete({ where: { id: noteId } });
  }

  create(data: {
    nama: string;
    email: string;
    passwordHash: string;
    dusun?: string;
    rt?: string;
    rw?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  verifyEmail(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  // Hanya dipakai Admin: daftar seluruh akun untuk kelola Penggerak.
  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        dusun: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

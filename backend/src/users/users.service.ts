import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  findByKontak(kontak: string) {
    return this.prisma.user.findUnique({ where: { kontak } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
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
    return { ...publicUser, kategoriUsia: this.kategoriUsia(tanggalLahir) };
  }

  async findMyProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
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
    return user ? { ...user, kategoriUsia: this.kategoriUsia(user.tanggalLahir) } : null;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const payload = {
      ...dto,
      tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined,
    };

    const user = await this.prisma.user.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        nama: true,
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
    return { ...user, kategoriUsia: this.kategoriUsia(user.tanggalLahir) };
  }

  async findNotes(authorId: string, targetUserId: string) {
    await this.findPublicProfile(targetUserId);
    return this.prisma.profileNote.findMany({ where: { authorId, targetUserId }, orderBy: { updatedAt: 'desc' } });
  }

  async createNote(authorId: string, targetUserId: string, isi: string) {
    await this.findPublicProfile(targetUserId);
    return this.prisma.profileNote.create({ data: { authorId, targetUserId, isi } });
  }

  async deleteNote(authorId: string, targetUserId: string, noteId: string) {
    const note = await this.prisma.profileNote.findFirst({ where: { id: noteId, authorId, targetUserId } });
    if (!note) throw new NotFoundException('Catatan tidak ditemukan');
    return this.prisma.profileNote.delete({ where: { id: noteId } });
  }

  create(data: {
    nama: string;
    kontak: string;
    passwordHash: string;
    dusun?: string;
    rt?: string;
    rw?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  markKontakVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { kontakVerified: true },
    });
  }

  updateRole(id: string, role: Role) {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  // Hanya dipakai Admin: daftar seluruh warga untuk kelola akun/relawan.
  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        kontak: true,
        dusun: true,
        role: true,
        kontakVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

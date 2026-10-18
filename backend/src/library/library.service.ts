import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCitationDto } from './dto/create-citation.dto';
import { CreateLibraryNoteDto } from './dto/create-library-note.dto';
import { UpdateLibraryNoteDto } from './dto/update-library-note.dto';

const LIBRARY_NOTE_PAGE_SIZE = 20;

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotes(userId: string, pageValue?: string) {
    const page = pageValue === undefined ? 1 : Number(pageValue);
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new BadRequestException('Nomor halaman harus bilangan bulat positif.');
    }

    const notes = await this.prisma.libraryNote.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * LIBRARY_NOTE_PAGE_SIZE,
      take: LIBRARY_NOTE_PAGE_SIZE + 1,
    });
    const hasMore = notes.length > LIBRARY_NOTE_PAGE_SIZE;
    return {
      items: notes.slice(0, LIBRARY_NOTE_PAGE_SIZE),
      page,
      limit: LIBRARY_NOTE_PAGE_SIZE,
      hasMore,
    };
  }

  createNote(userId: string, dto: CreateLibraryNoteDto) {
    return this.prisma.libraryNote.create({ data: { ...dto, userId } });
  }

  async updateNote(userId: string, id: string, dto: UpdateLibraryNoteDto) {
    const note = await this.prisma.libraryNote.findFirst({ where: { id, userId }, select: { id: true } });
    if (!note) throw new NotFoundException('Catatan rujukan tidak ditemukan.');
    return this.prisma.libraryNote.update({ where: { id: note.id }, data: dto });
  }

  async deleteNote(userId: string, id: string) {
    const note = await this.prisma.libraryNote.findFirst({ where: { id, userId }, select: { id: true } });
    if (!note) throw new NotFoundException('Catatan rujukan tidak ditemukan.');
    await this.prisma.libraryNote.delete({ where: { id: note.id } });
    return { message: 'Catatan rujukan dihapus.' };
  }

  async createCitation(userId: string, dto: CreateCitationDto) {
    const source = dto.noteId
      ? await this.prisma.libraryNote.findFirst({ where: { id: dto.noteId, userId } })
      : dto;
    if (dto.noteId && !source) throw new NotFoundException('Catatan rujukan tidak ditemukan.');
    if (!source?.judul?.trim()) throw new BadRequestException('Judul rujukan wajib diisi untuk membuat sitasi.');

    const author = source.penulis?.trim() || '';
    const year = source.tahun ? String(source.tahun) : '';
    const title = source.judul.trim();
    const publisher = source.penerbit?.trim() || '';
    const url = source.tautan?.trim() || '';
    const apa = `${author || 'n.d.'} (${year || 'n.d.'}). ${title}.${publisher ? ` ${publisher}.` : ''}${url ? ` ${url}` : ''}`;
    const indonesia = `${author || 'Tanpa penulis'}. ${year || 'tanpa tahun'}. ${title}.${publisher ? ` ${publisher}.` : ''}${url ? ` ${url}` : ''}`;
    return { apa, indonesia };
  }

  listLocalRegions() {
    return this.prisma.localRegion.findMany({
      orderBy: { nama: 'asc' },
      include: {
        articles: {
          where: { terverifikasi: true },
          orderBy: [{ createdAt: 'desc' }, { judul: 'asc' }],
        },
      },
    });
  }
}
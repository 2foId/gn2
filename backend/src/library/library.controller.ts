import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCitationDto } from './dto/create-citation.dto';
import { CreateLibraryNoteDto } from './dto/create-library-note.dto';
import { UpdateLibraryNoteDto } from './dto/update-library-note.dto';
import { LibraryService } from './library.service';
import { NewsQueryDto } from '../pustaka/dto/news-query.dto';
import { BeritaService } from '../pustaka/berita.service';

const libraryLinks = [
  {
    category: 'Jurnal',
    links: [
      { name: 'Google Scholar', url: 'https://scholar.google.com/' },
      { name: 'DOAJ', url: 'https://doaj.org/' },
    ],
  },
  {
    category: 'Buku',
    links: [{ name: 'Open Library', url: 'https://openlibrary.org/' }],
  },
  {
    category: 'Arsip',
    links: [{ name: 'Khastara Perpusnas', url: 'https://khastara.perpusnas.go.id/' }],
  },
  {
    category: 'Perpustakaan',
    links: [{ name: 'Perpusnas', url: 'https://perpusnas.go.id/' }],
  },
];

@Controller('pustaka')
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly beritaService: BeritaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Get('links')
  getLinks() {
    return libraryLinks;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Get('berita')
  getNews(@CurrentUser('id') userId: string, @Query() query: NewsQueryDto) {
    return this.beritaService.search(userId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Get('catatan')
  listNotes(@CurrentUser('id') userId: string, @Query('page') page?: string) {
    return this.libraryService.listNotes(userId, page);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Post('catatan')
  createNote(@CurrentUser('id') userId: string, @Body() dto: CreateLibraryNoteDto) {
    return this.libraryService.createNote(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Patch('catatan/:id')
  updateNote(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateLibraryNoteDto) {
    return this.libraryService.updateNote(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Delete('catatan/:id')
  deleteNote(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.libraryService.deleteNote(userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Post('sitasi')
  createCitation(@CurrentUser('id') userId: string, @Body() dto: CreateCitationDto) {
    return this.libraryService.createCitation(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PELAJAR, Role.ADMIN)
  @Get('daerah')
  listLocalRegions() {
    return this.libraryService.listLocalRegions();
  }
}
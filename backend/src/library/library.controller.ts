import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const libraryLinks = [
  {
    category: 'Jurnal',
    links: [
      { name: 'Google Scholar', url: 'https://scholar.google.com/' },
      { name: 'Garuda', url: 'https://garuda.kemdikbud.go.id/' },
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

@Controller('library')
export class LibraryController {
  @UseGuards(JwtAuthGuard)
  @Get('links')
  getLinks() {
    return libraryLinks;
  }
}
import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { BeritaService } from '../pustaka/berita.service';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService, BeritaService],
})
export class LibraryModule {}
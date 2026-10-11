import { Controller, Delete, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WasiatService } from './wasiat.service';
import { CreateWasiatDto } from './dto/create-wasiat.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SubmitLangkahDto } from './dto/submit-langkah.dto';
import { FeedbackProgressDto } from './dto/feedback-progress.dto';
import { CreateLangkahDto } from './dto/create-langkah.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WasiatKategori } from '@prisma/client';

@Controller('wasiat')
export class WasiatController {
  constructor(private wasiatService: WasiatService) { }

  @Get()
  findAll(@Query('kategori') kategori?: WasiatKategori) {
    return this.wasiatService.findAll(kategori);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saya/tersimpan')
  findMySaved(@CurrentUser('id') userId: string) {
    return this.wasiatService.findMySaved(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saya/progress')
  findMyProgress(@CurrentUser('id') userId: string) {
    return this.wasiatService.findMyProgress(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wasiatService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/langkah')
  findLangkah(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.wasiatService.findLangkah(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/langkah')
  createLangkah(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: CreateLangkahDto) {
    return this.wasiatService.createLangkah(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/langkah/:urutan/submit')
  submitLangkah(
    @Param('id') id: string,
    @Param('urutan') urutan: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitLangkahDto,
  ) {
    return this.wasiatService.submitLangkah(id, Number(urutan), userId, dto.jawaban);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/feedback/menunggu')
  findWaitingFeedback(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.wasiatService.findWaitingFeedback(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/feedback')
  postFeedback(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: FeedbackProgressDto,
  ) {
    return this.wasiatService.postFeedback(id, userId, dto.progressId, dto.catatan);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWasiatDto) {
    return this.wasiatService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/simpan')
  toggleSave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.wasiatService.toggleSave(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/komentar')
  addComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.wasiatService.addComment(id, userId, dto.isi, dto.rating);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/komentar/:commentId')
  deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.wasiatService.deleteComment(id, commentId, userId, role);
  }
}

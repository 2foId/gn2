import { Controller, Get, Post, Patch, Param, Body, Delete, UseGuards, Query } from '@nestjs/common';
import { BantuanService } from './bantuan.service';
import { CreateBantuanDto } from './dto/create-bantuan.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { KesediaanDto } from './dto/kesediaan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PreferensiRelawan, Role } from '@prisma/client';
import { UpdateBantuanDto } from './dto/update-bantuan.dto';
import { BatalKesediaanDto } from './dto/batal-kesediaan.dto';

@Controller('bantuan')
export class BantuanController {
  constructor(private bantuanService: BantuanService) { }

  // Semua warga (termasuk publik jika dibutuhkan) bisa lihat peta aktif
  @Get('peta')
  findAllForMap(@Query('preferensi') preferensi?: PreferensiRelawan) {
    return this.bantuanService.findAllForMap(preferensi);
  }

  // Hanya Penggerak & Admin yang bisa lihat antrian verifikasi
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Get('verifikasi')
  findAllForVerifikator(@Query('preferensi') preferensi?: PreferensiRelawan) {
    return this.bantuanService.findAllForVerifikator(preferensi);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saya/kesediaan')
  findMyKesediaan(@CurrentUser('id') userId: string) {
    return this.bantuanService.findMyKesediaan(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bantuanService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBantuanDto) {
    return this.bantuanService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateBantuanDto) {
    return this.bantuanService.update(id, userId, dto);
  }

  // Approve/tolak pin — hanya Penggerak & Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Patch(':id/verifikasi')
  verifikasi(
    @Param('id') id: string,
    @CurrentUser('id') verifikatorId: string,
    @Query('disetujui') disetujui: string,
  ) {
    return this.bantuanService.verifikasi(id, verifikatorId, disetujui === 'true');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.bantuanService.updateStatus(id, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/kesediaan')
  nyatakanKesediaan(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: KesediaanDto,
  ) {
    return this.bantuanService.nyatakanKesediaan(id, userId, dto.catatan);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/batal-kesediaan')
  batalKesediaan(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: BatalKesediaanDto) {
    return this.bantuanService.batalKesediaan(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/selesai')
  tandaiSelesai(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bantuanService.selesai(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  hapus(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.bantuanService.hapus(id, userId, role);
  }
}

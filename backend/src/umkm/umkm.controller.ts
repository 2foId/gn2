import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UmkmService } from './umkm.service';
import { CreateUmkmNeedDto } from './dto/create-umkm-need.dto';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateUmkmStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UmkmNeedStatus } from '@prisma/client';

@Controller('umkm')
export class UmkmController {
  constructor(private umkmService: UmkmService) {}

  @Get()
  findAll(@Query('status') status?: UmkmNeedStatus) {
    return this.umkmService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.umkmService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateUmkmNeedDto) {
    return this.umkmService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/respon')
  addResponse(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateResponseDto,
  ) {
    return this.umkmService.addResponse(id, userId, dto.pesan);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUmkmStatusDto,
  ) {
    return this.umkmService.updateStatus(id, userId, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  hapus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.umkmService.hapus(id, userId, role);
  }
}

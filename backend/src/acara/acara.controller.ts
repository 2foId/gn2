import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AcaraService } from './acara.service';
import { CreateAcaraDto } from './dto/create-acara.dto';
import { CreateLogistikDto } from './dto/create-logistik.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AbsenDto } from './dto/absen.dto';
import { Role } from '@prisma/client';

@Controller('acara')
export class AcaraController {
  constructor(private acaraService: AcaraService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Get()
  findAll(@Query('kabupaten') kabupaten?: string) {
    return this.acaraService.findAll(kabupaten);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.acaraService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAcaraDto) {
    return this.acaraService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Post(':id/logistik')
  addLogistik(@Param('id') id: string, @Body() dto: CreateLogistikDto) {
    return this.acaraService.addLogistik(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Patch('logistik/:logistikId/toggle')
  toggleLogistik(@Param('logistikId') logistikId: string) {
    return this.acaraService.toggleLogistikDipenuhi(logistikId);
  }

  // Absensi digital pengganti catatan manual RT
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Post(':id/absen')
  absen(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: AbsenDto) {
    return this.acaraService.absen(id, userId, dto.kode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Post(':id/kode-absen')
  generateKodeAbsen(@Param('id') id: string, @CurrentUser('id') creatorId: string) {
    return this.acaraService.generateKodeAbsen(id, creatorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Post(':id/qr')
  generateQr(@Param('id') id: string, @CurrentUser('id') creatorId: string) {
    return this.acaraService.generateQr(id, creatorId);
  }
}

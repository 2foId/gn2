import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AcaraService } from './acara.service';
import { CreateAcaraDto } from './dto/create-acara.dto';
import { CreateLogistikDto } from './dto/create-logistik.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AbsenDto } from './dto/absen.dto';

@Controller('acara')
export class AcaraController {
  constructor(private acaraService: AcaraService) { }

  @Get()
  findAll() {
    return this.acaraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.acaraService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAcaraDto) {
    return this.acaraService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/logistik')
  addLogistik(@Param('id') id: string, @Body() dto: CreateLogistikDto) {
    return this.acaraService.addLogistik(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('logistik/:logistikId/toggle')
  toggleLogistik(@Param('logistikId') logistikId: string) {
    return this.acaraService.toggleLogistikDipenuhi(logistikId);
  }

  // Absensi digital pengganti catatan manual RT
  @UseGuards(JwtAuthGuard)
  @Post(':id/absen')
  absen(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: AbsenDto) {
    return this.acaraService.absen(id, userId, dto.kode);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/kode-absen')
  generateKodeAbsen(@Param('id') id: string, @CurrentUser('id') creatorId: string) {
    return this.acaraService.generateKodeAbsen(id, creatorId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/qr')
  generateQr(@Param('id') id: string, @CurrentUser('id') creatorId: string) {
    return this.acaraService.generateQr(id, creatorId);
  }
}

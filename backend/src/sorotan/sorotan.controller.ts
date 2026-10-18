import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SorotanService } from './sorotan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('iklan')
export class IklanController {
  constructor(private sorotanService: SorotanService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Post()
  createDraft(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.sorotanService.createDraft(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Patch(':id')
  updateDraft(@CurrentUser('id') userId: string, @Param('id') iklanId: string, @Body() dto: any) {
    return this.sorotanService.updateDraft(iklanId, userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Post(':id/ajukan')
  ajukan(@CurrentUser('id') userId: string, @Param('id') iklanId: string) {
    return this.sorotanService.ajukan(iklanId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Get('saya')
  getMyIklan(@CurrentUser('id') userId: string) {
    return this.sorotanService.getMyIklan(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Get('tayang')
  getTayang(@Query('bidang') bidang?: string) {
    return this.sorotanService.getTayang(bidang);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Post('tayang/:id/tayang')
  catatTayang(@Param('id') iklanId: string) {
    return this.sorotanService.catatTayang(iklanId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK, Role.ADMIN)
  @Post('tayang/:id/klik')
  catatKlik(@Param('id') iklanId: string) {
    return this.sorotanService.catatKlik(iklanId);
  }
}

@Controller('admin/iklan')
export class AdminIklanController {
  constructor(private sorotanService: SorotanService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  getAdminIklan(@Query('status') status?: string) {
    return this.sorotanService.getAdminIklan(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  getAdminIklanDetail(@Param('id') iklanId: string) {
    return this.sorotanService.getAdminIklanDetail(iklanId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/keputusan')
  keputusan(@CurrentUser('id') adminId: string, @Param('id') iklanId: string, @Body() dto: any) {
    return this.sorotanService.keputusan(iklanId, adminId, dto);
  }
}

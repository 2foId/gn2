import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UmkmService } from './umkm.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto/create-portfolio.dto';
import { Role, SkillCategory } from '@prisma/client';

const portfolioExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

@Controller('umkm')
export class UmkmPortfolioController {
  constructor(private umkmService: UmkmService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Post('responses/:id/portfolio')
  @UseInterceptors(
    FilesInterceptor('images', 2, {
      storage: diskStorage({
        destination: './uploads/portofolio',
        filename: (_request, file, callback) =>
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const valid = portfolioExtensions.has(extension);
        callback(null, valid);
      },
    }),
  )
  async addPortfolio(
    @Param('id') responseId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @UploadedFiles() files: any,
    @Body() dto: CreatePortfolioDto,
  ) {
    const beforeFile = files.beforeImage?.[0];
    const afterFile = files.afterImage?.[0];
    if (!beforeFile || !afterFile) {
      throw new BadRequestException('Kedua gambar (sebelum dan sesudah) wajib diunggah.');
    }
    return this.umkmService.addPortfolio(responseId, userId, role, {
      ...dto,
      beforeImageUrl: `/uploads/portofolio/${beforeFile.filename}`,
      afterImageUrl: `/uploads/portofolio/${afterFile.filename}`,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Patch('portfolios/:id')
  async updatePortfolio(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.umkmService.updatePortfolio(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PENGGERAK)
  @Delete('portfolios/:id')
  async deletePortfolio(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.umkmService.deletePortfolio(id, userId);
  }

  @Get('volunteers/:id/portfolio')
  async getVolunteerPortfolio(
    @Param('id') volunteerId: string,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Math.min(parseInt(limit, 10) || 12, 12) : 12;
    return this.umkmService.getVolunteerPortfolio(volunteerId, take);
  }
}

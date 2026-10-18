import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { BingkaiService } from './bingkai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bingkai')
export class BingkaiController {
  constructor(private bingkaiService: BingkaiService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.bingkaiService.listForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/beli')
  beli(@CurrentUser('id') userId: string, @Param('id') bingkaiId: string) {
    return this.bingkaiService.beli(userId, bingkaiId);
  }
}

@Controller('users')
export class UsersBingkaiController {
  constructor(private bingkaiService: BingkaiService) { }

  @UseGuards(JwtAuthGuard)
  @Patch('me/bingkai')
  pasang(@CurrentUser('id') userId: string, @Body() dto: { bingkaiId: string | null }) {
    return this.bingkaiService.pasang(userId, dto.bingkaiId);
  }
}

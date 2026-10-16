import { Module } from '@nestjs/common';
import { UmkmService } from './umkm.service';
import { UmkmController } from './umkm.controller';
import { UmkmPortfolioController } from './umkm-portfolio.controller';

@Module({
  controllers: [UmkmController, UmkmPortfolioController],
  providers: [UmkmService],
})
export class UmkmModule {}

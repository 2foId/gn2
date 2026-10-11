import { Module } from '@nestjs/common';
import { UmkmService } from './umkm.service';
import { UmkmController } from './umkm.controller';

@Module({
  controllers: [UmkmController],
  providers: [UmkmService],
})
export class UmkmModule {}

import { Module } from '@nestjs/common';
import { AcaraService } from './acara.service';
import { AcaraController } from './acara.controller';

@Module({
  controllers: [AcaraController],
  providers: [AcaraService],
})
export class AcaraModule {}

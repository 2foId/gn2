import { Module } from '@nestjs/common';
import { BingkaiService } from './bingkai.service';
import { BingkaiController } from './bingkai.controller';

@Module({
  controllers: [BingkaiController],
  providers: [BingkaiService],
  exports: [BingkaiService],
})
export class BingkaiModule { }

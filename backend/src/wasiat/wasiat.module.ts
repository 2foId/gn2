import { Module } from '@nestjs/common';
import { WasiatService } from './wasiat.service';
import { WasiatController } from './wasiat.controller';

@Module({
  controllers: [WasiatController],
  providers: [WasiatService],
})
export class WasiatModule {}

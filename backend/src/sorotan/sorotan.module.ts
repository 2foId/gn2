import { Module } from '@nestjs/common';
import { SorotanService } from './sorotan.service';
import { IklanController } from './sorotan.controller';
import { AdminIklanController } from './sorotan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IklanController, AdminIklanController],
  providers: [SorotanService],
  exports: [SorotanService],
})
export class SorotanModule { }

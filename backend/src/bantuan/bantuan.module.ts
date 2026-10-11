import { Module } from '@nestjs/common';
import { BantuanService } from './bantuan.service';
import { BantuanController } from './bantuan.controller';
import { UsersModule } from '../users/users.module';
import { BantuanCleanupService } from './bantuan-cleanup.service';

@Module({
  imports: [UsersModule],
  controllers: [BantuanController],
  providers: [BantuanService, BantuanCleanupService],
})
export class BantuanModule { }

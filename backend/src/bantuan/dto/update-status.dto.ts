import { IsEnum } from 'class-validator';
import { BantuanStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(BantuanStatus)
  status: BantuanStatus;
}

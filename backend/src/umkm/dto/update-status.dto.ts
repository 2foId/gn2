import { IsEnum } from 'class-validator';
import { UmkmNeedStatus } from '@prisma/client';

export class UpdateUmkmStatusDto {
  @IsEnum(UmkmNeedStatus)
  status: UmkmNeedStatus;
}

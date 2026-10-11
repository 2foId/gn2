import { IsOptional, IsString } from 'class-validator';

export class KesediaanDto {
  @IsOptional()
  @IsString()
  catatan?: string;
}

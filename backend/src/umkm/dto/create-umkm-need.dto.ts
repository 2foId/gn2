import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { SkillCategory } from '@prisma/client';

export class CreateUmkmNeedDto {
  @IsString()
  @MinLength(3)
  namaUsaha: string;

  @IsString()
  @MinLength(5)
  kebutuhan: string; // mis. "butuh bantuan foto produk"

  @IsString()
  @MinLength(10)
  deskripsi: string;

  @IsEnum(SkillCategory, { message: 'Kategori keterampilan tidak valid' })
  category: SkillCategory;

  @IsOptional()
  @IsDateString()
  dibutuhkanSebelum?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foto?: string[];
}

import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SkillCategory } from '@prisma/client';

export class CreateUmkmNeedDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  namaUsaha: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  kebutuhan: string; // mis. "butuh bantuan foto produk"

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
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

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kabupatenKota?: string;
}

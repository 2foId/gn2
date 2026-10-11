import { IsString, IsEnum, IsArray, MinLength, ArrayNotEmpty, IsOptional } from 'class-validator';
import { WasiatKategori } from '@prisma/client';

export class CreateWasiatDto {
  @IsString()
  @MinLength(4)
  judul: string;

  @IsEnum(WasiatKategori)
  kategori: WasiatKategori;

  @IsString()
  @MinLength(20)
  isi: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  poinKiat: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foto?: string[];
}

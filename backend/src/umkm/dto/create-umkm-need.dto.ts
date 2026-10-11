import { IsArray, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsDateString()
  dibutuhkanSebelum?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foto?: string[];
}

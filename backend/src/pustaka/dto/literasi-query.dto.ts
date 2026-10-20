import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LiterasiQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsIn(['scholar', 'berita', 'semua'])
  sumber?: 'scholar' | 'berita' | 'semua' = 'semua';

  @IsOptional()
  @IsIn(['relevan', 'terbaru'])
  urutan?: 'relevan' | 'terbaru' = 'relevan';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  halaman = 1;
}

import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class NewsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kabupaten?: string;

  @IsOptional()
  @IsIn(['terbaru', 'terlama', 'relevan'])
  urutan?: 'terbaru' | 'terlama' | 'relevan' = 'terbaru';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  halaman = 1;
}
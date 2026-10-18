import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCitationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  judul: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  penulis?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  tahun?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  penerbit?: string;

}
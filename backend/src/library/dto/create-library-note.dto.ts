import { IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class CreateLibraryNoteDto {
  @IsString()
  @MaxLength(150)
  judul: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  penulis?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  tahun?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  penerbit?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  tautan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatan?: string;
}
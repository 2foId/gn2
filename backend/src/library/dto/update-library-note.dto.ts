import { IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class UpdateLibraryNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  judul?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  penulis?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  tahun?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  penerbit?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  tautan?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatan?: string | null;
}
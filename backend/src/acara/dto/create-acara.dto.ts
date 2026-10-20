import { IsArray, IsString, IsDateString, IsOptional, IsInt, Min, MinLength } from 'class-validator';
import { KABUPATEN_DAFTAR } from '../../sorotan/sorotan.config';

export class CreateAcaraDto {
  @IsString()
  @MinLength(3, { message: 'Nama harus lebih atau sama dengan 3 karakter.' })
  nama: string;

  @IsString()
  @MinLength(10)
  deskripsi: string;

  @IsString()
  jenis: string; // kerja bakti, ronda, sedekah bumi, dll

  @IsString()
  lokasi: string;

  @IsDateString()
  waktuMulai: string;

  @IsOptional()
  @IsDateString()
  waktuSelesai?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foto?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  targetHadir?: number;

  @IsString()
  kabupatenKota: string;
}

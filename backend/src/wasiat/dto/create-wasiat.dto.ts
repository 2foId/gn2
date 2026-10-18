import { Type } from 'class-transformer';
import { IsString, IsEnum, IsArray, MinLength, ArrayNotEmpty, IsOptional, ArrayMaxSize, ArrayMinSize, MaxLength, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { WasiatKategori } from '@prisma/client';

class CreateWasiatSoalDto {
  @IsString({ message: 'Pertanyaan harus berupa teks' })
  @MinLength(1, { message: 'Pertanyaan wajib diisi' })
  @MaxLength(200, { message: 'Pertanyaan maksimal 200 karakter' })
  pertanyaan: string;

  @IsArray({ message: 'Setiap soal harus memiliki tepat 3 opsi' })
  @ArrayMinSize(3, { message: 'Setiap soal harus memiliki tepat 3 opsi' })
  @ArrayMaxSize(3, { message: 'Setiap soal harus memiliki tepat 3 opsi' })
  @IsString({ each: true, message: 'Opsi jawaban harus berupa teks' })
  @MinLength(1, { each: true, message: 'Setiap opsi wajib diisi' })
  @MaxLength(120, { each: true, message: 'Setiap opsi maksimal 120 karakter' })
  opsi: string[];

  @IsInt({ message: 'Jawaban benar harus dipilih' })
  @Min(0, { message: 'Indeks jawaban benar harus 0, 1, atau 2' })
  @Max(2, { message: 'Indeks jawaban benar harus 0, 1, atau 2' })
  jawabanBenar: number;
}

class CreateWasiatQuestDto {
  @IsString({ message: 'Judul quest harus berupa teks' })
  @MinLength(1, { message: 'Judul quest wajib diisi' })
  @MaxLength(80, { message: 'Judul quest maksimal 80 karakter' })
  judul: string;

  @IsString({ message: 'Tujuan quest harus berupa teks' })
  @MinLength(1, { message: 'Tujuan quest wajib diisi' })
  @MaxLength(400, { message: 'Tujuan quest maksimal 400 karakter' })
  tujuan: string;

  @IsArray({ message: 'Quest harus memiliki daftar soal' })
  @ArrayMinSize(3, { message: 'Quest harus memiliki 3 sampai 10 soal' })
  @ArrayMaxSize(10, { message: 'Quest harus memiliki 3 sampai 10 soal' })
  @ValidateNested({ each: true })
  @Type(() => CreateWasiatSoalDto)
  kuis: CreateWasiatSoalDto[];
}

export class CreateWasiatDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20, { message: 'Judul maksimal 20 karakter.' })
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

  @IsOptional()
  @IsArray({ message: 'Quest harus berupa daftar' })
  @ArrayMinSize(1, { message: 'Minimal harus ada 1 quest' })
  @ArrayMaxSize(5, { message: 'Maksimal 5 quest per wasiat' })
  @ValidateNested({ each: true })
  @Type(() => CreateWasiatQuestDto)
  quest?: CreateWasiatQuestDto[];
}

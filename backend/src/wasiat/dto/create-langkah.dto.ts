import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsInt,
    IsString,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class CreateKuisSoalDto {
    @IsString({ message: 'Pertanyaan harus berupa teks' })
    @MinLength(1, { message: 'Pertanyaan wajib diisi' })
    pertanyaan: string;

    @IsArray({ message: 'Pilihan jawaban harus berupa daftar' })
    @ArrayMinSize(2, { message: 'Setiap soal harus memiliki minimal 2 pilihan' })
    @ArrayMaxSize(4, { message: 'Setiap soal maksimal memiliki 4 pilihan' })
    @IsString({ each: true, message: 'Setiap pilihan jawaban harus berupa teks' })
    opsi: string[];

    @IsInt({ message: 'Indeks jawaban benar harus berupa bilangan bulat' })
    @Min(0, { message: 'Indeks jawaban benar tidak boleh negatif' })
    jawabanBenar: number;
}

export class CreateLangkahDto {
    @IsInt({ message: 'Urutan quest harus berupa bilangan bulat' })
    @Min(1, { message: 'Urutan quest minimal 1' })
    urutan: number;

    @IsString({ message: 'Judul quest harus berupa teks' })
    @MinLength(1, { message: 'Judul quest wajib diisi' })
    judul: string;

    @IsString({ message: 'Tujuan quest harus berupa teks' })
    @MinLength(1, { message: 'Tujuan quest wajib diisi' })
    tujuan: string;

    @IsArray({ message: 'Kuis harus berupa daftar soal' })
    @ArrayMinSize(3, { message: 'Kuis harus memiliki 3 sampai 5 soal' })
    @ArrayMaxSize(5, { message: 'Kuis harus memiliki 3 sampai 5 soal' })
    @ValidateNested({ each: true })
    @Type(() => CreateKuisSoalDto)
    kuis: CreateKuisSoalDto[];
}
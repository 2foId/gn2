import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsInt,
    Max,
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
    @ArrayMinSize(3, { message: 'Setiap soal harus memiliki tepat 3 pilihan' })
    @ArrayMaxSize(3, { message: 'Setiap soal harus memiliki tepat 3 pilihan' })
    @IsString({ each: true, message: 'Setiap pilihan jawaban harus berupa teks' })
    opsi: string[];

    @IsInt({ message: 'Indeks jawaban benar harus berupa bilangan bulat' })
    @Min(0, { message: 'Indeks jawaban benar tidak boleh negatif' })
    @Max(2, { message: 'Indeks jawaban benar harus 0, 1, atau 2' })
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
    @ArrayMinSize(3, { message: 'Kuis template harus memiliki 3 sampai 5 soal' })
    @ArrayMaxSize(5, { message: 'Kuis template harus memiliki 3 sampai 5 soal' })
    @ValidateNested({ each: true })
    @Type(() => CreateKuisSoalDto)
    kuis: CreateKuisSoalDto[];
}
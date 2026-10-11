import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { BantuanKategori, PreferensiRelawan } from '@prisma/client';

export class UpdateBantuanDto {
    @IsOptional()
    @IsString()
    @MinLength(5)
    judul?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    deskripsi?: string;

    @IsOptional()
    @IsEnum(BantuanKategori)
    kategori?: BantuanKategori;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsString()
    alamat?: string;

    @IsOptional()
    @IsEnum(PreferensiRelawan, { message: 'Preferensi relawan tidak valid' })
    preferensiRelawan?: PreferensiRelawan;

    @IsOptional()
    @IsDateString()
    dibutuhkanSebelum?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    foto?: string[];
}
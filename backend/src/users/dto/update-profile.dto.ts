import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { SkillCategory } from '@prisma/client';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(3, { message: 'Nama harus lebih atau sama dengan 3 karakter.' })
    @MaxLength(20, { message: 'Nama tidak boleh lebih dari 20 karakter.' })
    nama?: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() || null : value)
    @IsOptional()
    @IsString()
    @Matches(/^(?:08[0-9]{7,12}|\+62[0-9]{8,13})$/, {
        message: 'Nomor WhatsApp harus diawali 08 atau +62 dan berisi 9 sampai 15 digit.',
    })
    phone?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(280)
    bio?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsArray({ message: 'Keahlian harus berupa daftar' })
    @ArrayMaxSize(10, { message: 'Keahlian maksimal 10 item' })
    @IsEnum(SkillCategory, { each: true, message: 'Setiap keahlian harus kategori yang valid' })
    @Transform(({ value }) => Array.isArray(value)
        ? [...new Set(value.map((item) => typeof item === 'string' ? item.trim().replace(/\s+/g, ' ') : item))]
        : value)
    keahlian?: SkillCategory[];

    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Ketersediaan maksimal 200 karakter' })
    ketersediaan?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Kabupaten/kota maksimal 100 karakter' })
    kabupatenKota?: string;
}

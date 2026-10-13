import { IsArray, IsDateString, IsEnum, IsNumber, IsNotEmpty, IsOptional, IsString, MinLength, Validate, ValidateIf, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { BantuanKategori, PreferensiRelawan } from '@prisma/client';

@ValidatorConstraint({ name: 'updateFutureDeadline', async: false })
class UpdateFutureDeadlineConstraint implements ValidatorConstraintInterface {
    validate(value: string) {
        return value === undefined || value === null || value === '' || new Date(value).getTime() > Date.now();
    }

    defaultMessage() {
        return 'Tenggat harus berada di masa depan.';
    }
}

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

    @ValidateIf((_, value) => value !== undefined)
    @IsNotEmpty({ message: 'Tenggat wajib diisi.' })
    @IsDateString({}, { message: 'Tenggat wajib diisi.' })
    @Validate(UpdateFutureDeadlineConstraint)
    dibutuhkanSebelum?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    foto?: string[];
}
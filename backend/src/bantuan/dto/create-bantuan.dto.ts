import { IsString, IsEnum, IsNumber, IsOptional, MinLength, IsDateString, IsArray, IsNotEmpty, Validate } from 'class-validator';
import { BantuanKategori, PreferensiRelawan } from '@prisma/client';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'futureDeadline', async: false })
class FutureDeadlineConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return value === undefined || value === null || value === '' || new Date(value).getTime() > Date.now();
  }

  defaultMessage() {
    return 'Tenggat harus berada di masa depan.';
  }
}

export class CreateBantuanDto {
  @IsString()
  @MinLength(5)
  judul: string;

  @IsString()
  @MinLength(10)
  deskripsi: string;

  @IsEnum(BantuanKategori)
  kategori: BantuanKategori;

  @IsOptional()
  @IsNumber()
  latitude: number;

  @IsOptional()
  @IsNumber()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  alamat: string;

  @IsOptional()
  @IsEnum(PreferensiRelawan, { message: 'Preferensi relawan tidak valid' })
  preferensiRelawan?: PreferensiRelawan;

  @IsNotEmpty({ message: 'Tenggat wajib diisi.' })
  @IsDateString({}, { message: 'Tenggat wajib diisi.' })
  @Validate(FutureDeadlineConstraint)
  dibutuhkanSebelum: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foto?: string[];
}

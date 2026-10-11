import { IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  nama: string;

  // Nomor HP dipakai sebagai identitas login + tujuan kirim OTP
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, {
    message: 'Format nomor HP tidak valid',
  })
  kontak: string;

  @IsOptional()
  @IsString()
  dusun?: string;

  @IsOptional()
  @IsString()
  rt?: string;

  @IsOptional()
  @IsString()
  rw?: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;
}

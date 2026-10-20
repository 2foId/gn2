import { IsEmail, IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Nama harus lebih atau sama dengan 3 karakter.' })
  @MaxLength(20, { message: 'Nama tidak boleh lebih dari 20 karakter.' })
  nama: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsOptional()
  @IsString()
  dusun?: string;

  @IsOptional()
  @IsString()
  rt?: string;

  @IsOptional()
  @IsString()
  rw?: string;
}

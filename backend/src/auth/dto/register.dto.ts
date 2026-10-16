import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
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

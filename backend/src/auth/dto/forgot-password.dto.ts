import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;
}

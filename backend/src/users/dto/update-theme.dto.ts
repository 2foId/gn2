import { IsEnum } from 'class-validator';
import { ThemePreference } from '@prisma/client';

export class UpdateThemeDto {
    @IsEnum(ThemePreference, { message: 'Tema harus LIGHT atau DARK' })
    theme: ThemePreference;
}
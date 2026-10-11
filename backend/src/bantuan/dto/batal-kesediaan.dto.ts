import { IsString, MaxLength, MinLength } from 'class-validator';

export class BatalKesediaanDto {
    @IsString({ message: 'Alasan harus berupa teks' })
    @MinLength(10, { message: 'Alasan minimal 10 karakter' })
    @MaxLength(500, { message: 'Alasan maksimal 500 karakter' })
    alasan: string;
}
import { IsString, MaxLength, MinLength } from 'class-validator';

export class FeedbackProgressDto {
    @IsString()
    progressId: string;

    @IsString()
    @MinLength(1, { message: 'Catatan wajib diisi' })
    @MaxLength(300, { message: 'Catatan maksimal 300 karakter' })
    catatan: string;
}

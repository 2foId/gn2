import { IsString, Length } from 'class-validator';

export class AbsenDto {
    @IsString()
    @Length(4, 4)
    kode: string;
}
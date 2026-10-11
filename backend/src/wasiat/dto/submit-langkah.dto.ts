import { IsArray, IsNumber } from 'class-validator';

export class SubmitLangkahDto {
    @IsArray()
    @IsNumber({}, { each: true })
    jawaban: number[];
}

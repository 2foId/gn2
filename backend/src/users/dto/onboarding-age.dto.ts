import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class OnboardingAgeDto {
  @Type(() => Number)
  @IsInt({ message: 'Umur harus berupa angka bulat.' })
  @Min(13, { message: 'Umur harus antara 13 dan 30 tahun.' })
  @Max(30, { message: 'Umur harus antara 13 dan 30 tahun.' })
  age: number;
}
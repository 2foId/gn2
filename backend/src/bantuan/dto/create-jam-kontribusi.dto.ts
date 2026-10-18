import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateJamKontribusiDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 }, { message: 'Jumlah jam harus berupa angka dengan maksimal satu angka desimal.' })
  @Min(0.5, { message: 'Jumlah jam minimal 0,5.' })
  @Max(12, { message: 'Jumlah jam maksimal 12.' })
  jumlahJam: number;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Catatan maksimal 300 karakter.' })
  catatan?: string;
}
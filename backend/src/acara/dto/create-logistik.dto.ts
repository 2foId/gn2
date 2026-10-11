import { IsString, IsInt, IsOptional, Min, MinLength } from 'class-validator';

export class CreateLogistikDto {
  @IsString()
  @MinLength(2)
  itemNama: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  jumlah?: number;

  @IsOptional()
  @IsString()
  penanggungJawab?: string;
}

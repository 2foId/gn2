import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateUmkmRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;
}

export class UmkmRatingDto {
  id: string;
  score: number;
  comment?: string;
  createdAt: Date;
  fromUser: { id: string; nama: string; avatarUrl?: string | null };
}

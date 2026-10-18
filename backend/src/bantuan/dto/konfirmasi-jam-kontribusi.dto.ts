import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class KonfirmasiJamKontribusiDto {
  @IsIn(['TERKONFIRMASI', 'DITOLAK'], { message: 'Keputusan harus TERKONFIRMASI atau DITOLAK.' })
  keputusan: 'TERKONFIRMASI' | 'DITOLAK';

  @ValidateIf((dto: KonfirmasiJamKontribusiDto) => dto.keputusan === 'DITOLAK')
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'Alasan penolakan wajib diisi.' })
  @MinLength(1, { message: 'Alasan penolakan wajib diisi.' })
  @MaxLength(200, { message: 'Alasan penolakan maksimal 200 karakter.' })
  alasanTolak?: string;
}
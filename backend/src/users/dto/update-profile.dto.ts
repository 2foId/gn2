import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, Length, Matches, MaxLength, MinLength, Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { SkillCategory } from '@prisma/client';

@ValidatorConstraint({ name: 'validBirthDate', async: false })
class ValidBirthDateConstraint implements ValidatorConstraintInterface {
    validate(value: string) {
        if (!value) return true;
        const birthDate = new Date(value);
        if (Number.isNaN(birthDate.getTime())) return false;

        const today = new Date();
        const birthParts = [birthDate.getUTCFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate()];
        const todayParts = [today.getFullYear(), today.getMonth(), today.getDate()];
        const compare = (left: number[], right: number[]) => {
            for (let index = 0; index < left.length; index += 1) {
                if (left[index] !== right[index]) return left[index] - right[index];
            }
            return 0;
        };
        const oldestDate = [...todayParts];
        oldestDate[0] -= 100;
        return compare(birthParts, todayParts) <= 0 && compare(birthParts, oldestDate) >= 0;
    }

    defaultMessage() {
        return 'Tanggal lahir harus antara hari ini dan 100 tahun yang lalu';
    }
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(20, { message: 'Nama maksimal 20 karakter.' })
    nama?: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() || null : value)
    @IsOptional()
    @IsString()
    @Matches(/^(?:08[0-9]{7,12}|\+62[0-9]{8,13})$/, {
        message: 'Nomor WhatsApp harus diawali 08 atau +62 dan berisi 9 sampai 15 digit.',
    })
    phone?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(280)
    bio?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsArray({ message: 'Keahlian harus berupa daftar' })
    @ArrayMaxSize(10, { message: 'Keahlian maksimal 10 item' })
    @IsEnum(SkillCategory, { each: true, message: 'Setiap keahlian harus kategori yang valid' })
    @Transform(({ value }) => Array.isArray(value)
        ? [...new Set(value.map((item) => typeof item === 'string' ? item.trim().replace(/\s+/g, ' ') : item))]
        : value)
    keahlian?: SkillCategory[];

    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Ketersediaan maksimal 200 karakter' })
    ketersediaan?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Tanggal lahir harus berupa tanggal ISO yang valid' })
    @Validate(ValidBirthDateConstraint)
    tanggalLahir?: string;
}
import { IsIn } from 'class-validator';
import { Role } from '@prisma/client';

export class OnboardingDto {
  @IsIn([Role.PELAJAR, Role.PENGGERAK], { message: 'Peran tidak valid.' })
  role: 'PELAJAR' | 'PENGGERAK';
}
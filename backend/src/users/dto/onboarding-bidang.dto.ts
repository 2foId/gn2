import { IsIn } from 'class-validator';

export const ONBOARDING_BIDANG = [
  'Kesehatan',
  'Pendidikan',
  'Ekonomi',
  'Lingkungan',
  'Sosial',
  'Teknologi',
  'Budaya',
] as const;

export class OnboardingBidangDto {
  @IsIn(ONBOARDING_BIDANG, { message: 'Bidang pilihan tidak valid.' })
  bidang: (typeof ONBOARDING_BIDANG)[number];
}
/**
 * fica.ts — employee-side Social Security + Medicare, 2026 (estimated figures).
 */

export const SOCIAL_SECURITY_RATE = 0.062;
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 184_500;
export const MEDICARE_RATE = 0.0145;
export const ADDITIONAL_MEDICARE_RATE = 0.009;
export const ADDITIONAL_MEDICARE_THRESHOLD_SINGLE = 200_000;

/** Total employee FICA owed on a gross annual salary. */
export function calculateFICA(gross: number): number {
  const socialSecurity = Math.min(gross, SOCIAL_SECURITY_WAGE_BASE_2026) * SOCIAL_SECURITY_RATE;
  const medicare = gross * MEDICARE_RATE;
  const additional =
    gross > ADDITIONAL_MEDICARE_THRESHOLD_SINGLE
      ? (gross - ADDITIONAL_MEDICARE_THRESHOLD_SINGLE) * ADDITIONAL_MEDICARE_RATE
      : 0;
  return Math.round((socialSecurity + medicare + additional) * 100) / 100;
}

/**
 * federalTax.ts — federal income tax, single filer, 2026 (estimated brackets).
 * Pure: no network, no AI.
 */

export interface TaxBracket {
  rate: number;
  threshold: number;
}

export const FEDERAL_STANDARD_DEDUCTION_2026 = 16_100;

export const FEDERAL_BRACKETS_2026: TaxBracket[] = [
  { rate: 0.1, threshold: 0 },
  { rate: 0.12, threshold: 12_400 },
  { rate: 0.22, threshold: 50_400 },
  { rate: 0.24, threshold: 105_700 },
  { rate: 0.32, threshold: 201_775 },
  { rate: 0.35, threshold: 256_225 },
  { rate: 0.37, threshold: 640_600 },
];

/** Federal income tax owed on a gross annual salary (single filer). */
export function calculateFederalTax(gross: number): number {
  const taxable = Math.max(0, gross - FEDERAL_STANDARD_DEDUCTION_2026);
  return round2(applyBrackets(taxable, FEDERAL_BRACKETS_2026));
}

export function applyBrackets(taxable: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i]!;
    const next = brackets[i + 1];
    const lo = b.threshold;
    const hi = next ? next.threshold : Infinity;
    if (taxable > lo) tax += (Math.min(taxable, hi) - lo) * b.rate;
  }
  return tax;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

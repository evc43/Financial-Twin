/**
 * stateTaxData2026.ts — state income tax brackets, single filer, 2026.
 * Figures are best-effort estimates for the states this app demos.
 * Verify against each state's published rate schedule before presenting.
 */

export interface StateTax {
  state: string; // full state name
  type: "none" | "flat" | "graduated";
  brackets: { rate: number; threshold: number }[];
  standardDeduction: number;
  personalExemption: number;
  note?: string;
}

export const stateTaxData2026: StateTax[] = [
  {
    state: "New York",
    type: "graduated",
    brackets: [
      { rate: 0.04, threshold: 0 },
      { rate: 0.045, threshold: 8_500 },
      { rate: 0.0525, threshold: 11_700 },
      { rate: 0.055, threshold: 13_900 },
      { rate: 0.06, threshold: 80_650 },
      { rate: 0.0685, threshold: 215_400 },
      { rate: 0.0965, threshold: 1_077_550 },
    ],
    standardDeduction: 8_000,
    personalExemption: 0,
  },
  {
    state: "Pennsylvania",
    type: "flat",
    brackets: [{ rate: 0.0307, threshold: 0 }],
    standardDeduction: 0,
    personalExemption: 0,
    note: "Flat 3.07% on compensation; no standard deduction.",
  },
  {
    state: "California",
    type: "graduated",
    brackets: [
      { rate: 0.01, threshold: 0 },
      { rate: 0.02, threshold: 10_756 },
      { rate: 0.04, threshold: 25_499 },
      { rate: 0.06, threshold: 40_245 },
      { rate: 0.08, threshold: 55_866 },
      { rate: 0.093, threshold: 70_606 },
      { rate: 0.103, threshold: 360_659 },
      { rate: 0.113, threshold: 432_787 },
      { rate: 0.123, threshold: 721_314 },
    ],
    standardDeduction: 5_540,
    personalExemption: 0,
  },
  {
    state: "Illinois",
    type: "flat",
    brackets: [{ rate: 0.0495, threshold: 0 }],
    standardDeduction: 0,
    personalExemption: 2_850,
  },
  {
    state: "Colorado",
    type: "flat",
    brackets: [{ rate: 0.044, threshold: 0 }],
    standardDeduction: 16_100,
    personalExemption: 0,
    note: "Colorado taxable income starts from federal taxable income.",
  },
  {
    state: "Massachusetts",
    type: "flat",
    brackets: [{ rate: 0.05, threshold: 0 }],
    standardDeduction: 0,
    personalExemption: 4_400,
  },
  {
    state: "Georgia",
    type: "flat",
    brackets: [{ rate: 0.0519, threshold: 0 }],
    standardDeduction: 12_000,
    personalExemption: 0,
  },
  { state: "Texas", type: "none", brackets: [], standardDeduction: 0, personalExemption: 0 },
  { state: "Florida", type: "none", brackets: [], standardDeduction: 0, personalExemption: 0 },
  { state: "Washington", type: "none", brackets: [], standardDeduction: 0, personalExemption: 0 },
  { state: "Nevada", type: "none", brackets: [], standardDeduction: 0, personalExemption: 0 },
  { state: "Tennessee", type: "none", brackets: [], standardDeduction: 0, personalExemption: 0 },
];

/** Lookup by full state name (case-insensitive). */
export function getStateTax(stateName: string): StateTax | undefined {
  const q = stateName.trim().toLowerCase();
  return stateTaxData2026.find((s) => s.state.toLowerCase() === q);
}

export const STATE_NAMES = stateTaxData2026.map((s) => s.state);

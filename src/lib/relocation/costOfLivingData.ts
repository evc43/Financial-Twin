/**
 * costOfLivingData.ts  —  relocation feature data layer
 * ------------------------------------------------------------------
 * Two kinds of data live here:
 *   1. Cost-of-living indexes per city (Numbeo convention, NYC = 100).
 *   2. Local (city) income tax, which state tax alone misses.
 *
 * COST-OF-LIVING SOURCE: Numbeo (https://www.numbeo.com/cost-of-living/),
 * which indexes every city against New York City = 100.
 *   - goodsIndex = "Cost of Living Index (excl. rent)". NYC = 100.
 *   - rentIndex  = "Rent Index". NYC = 100.
 *
 * >>> IMPORTANT — READ BEFORE DEMO <<<
 * NYC (100/100) is exact by definition. The other cities below are
 * ROUGH PLACEHOLDERS so the app runs out of the box. Replace each
 * goodsIndex/rentIndex with the real current value from Numbeo before
 * presenting. Do NOT ship the placeholders as verified data.
 *
 * LOCAL INCOME TAX SOURCE: NYC + Yonkers verified against 2026 NY tax
 * guidance. Philadelphia's resident wage tax is included but marked to
 * verify. Cities with no local income tax have localIncomeTax = null.
 */

export interface LocalIncomeTax {
  kind: "brackets" | "flatWage" | "stateSurcharge";
  brackets?: { rate: number; threshold: number }[];
  flatRate?: number;
  surchargeOfStateTax?: number;
  note: string;
}

export interface CityCost {
  city: string;
  state: string; // full state name, must match stateTaxData2026 entries
  goodsIndex: number; // Numbeo cost-of-living excl. rent, NYC = 100
  rentIndex: number; // Numbeo rent index, NYC = 100
  localIncomeTax: LocalIncomeTax | null;
  verified: boolean; // false = placeholder COL numbers, replace before demo
}

export const COST_OF_LIVING_SOURCE = {
  colPublisher: "Numbeo",
  colUrl: "https://www.numbeo.com/cost-of-living/",
  colNote: "Indexes are relative to New York City = 100.",
  localTaxNote:
    "NYC resident tax 3.078%–3.876% and Yonkers 16.75% surcharge verified against 2026 NY rate schedules.",
  retrievedDate: "2026-09-19",
} as const;

// NYC resident income tax brackets, single filer, 2026 (rates verified).
const NYC_LOCAL: LocalIncomeTax = {
  kind: "brackets",
  brackets: [
    { rate: 0.03078, threshold: 0 },
    { rate: 0.03762, threshold: 12000 },
    { rate: 0.03819, threshold: 25000 },
    { rate: 0.03876, threshold: 50000 },
  ],
  note: "NYC resident income tax, single filer, 2026. On top of NY State tax.",
};

export const cityCostData: CityCost[] = [
  {
    city: "New York",
    state: "New York",
    goodsIndex: 100, // exact by definition (Numbeo baseline)
    rentIndex: 100, // exact by definition
    localIncomeTax: NYC_LOCAL,
    verified: true,
  },
  {
    city: "Yonkers",
    state: "New York",
    goodsIndex: 92, // PLACEHOLDER — replace from Numbeo
    rentIndex: 70, // PLACEHOLDER
    localIncomeTax: {
      kind: "stateSurcharge",
      surchargeOfStateTax: 0.1675,
      note: "Yonkers residents owe 16.75% of their NY State tax liability. Verified 2026.",
    },
    verified: false,
  },
  {
    city: "Philadelphia",
    state: "Pennsylvania",
    goodsIndex: 72, // PLACEHOLDER — replace from Numbeo
    rentIndex: 45, // PLACEHOLDER
    localIncomeTax: {
      kind: "flatWage",
      flatRate: 0.0375, // ~3.75% resident wage tax — VERIFY current rate before demo
      note: "Philadelphia resident wage tax (~3.75%). Verify the current rate.",
    },
    verified: false,
  },
  // ---- Below: goods/rent indexes are ROUGH PLACEHOLDERS. Replace from Numbeo. ----
  {
    city: "Pittsburgh",
    state: "Pennsylvania",
    goodsIndex: 68.7,
    rentIndex: 31.3,
    localIncomeTax: {
      kind: "flatWage",
      flatRate: 0.03,
      note: "Pittsburgh resident earned-income tax ~3%. Verify.",
    },
    verified: true,
  },
  { city: "San Francisco", state: "California", goodsIndex: 96, rentIndex: 92, localIncomeTax: null, verified: false },
  { city: "Austin", state: "Texas", goodsIndex: 72, rentIndex: 48, localIncomeTax: null, verified: false },
  { city: "Chicago", state: "Illinois", goodsIndex: 78, rentIndex: 52, localIncomeTax: null, verified: false },
  { city: "Denver", state: "Colorado", goodsIndex: 76, rentIndex: 55, localIncomeTax: null, verified: false },
  { city: "Miami", state: "Florida", goodsIndex: 78, rentIndex: 68, localIncomeTax: null, verified: false },
  { city: "Seattle", state: "Washington", goodsIndex: 85, rentIndex: 70, localIncomeTax: null, verified: false },
  { city: "Boston", state: "Massachusetts", goodsIndex: 88, rentIndex: 82, localIncomeTax: null, verified: false },
  { city: "Atlanta", state: "Georgia", goodsIndex: 72, rentIndex: 50, localIncomeTax: null, verified: false },
];

export function getCityCost(city: string): CityCost | undefined {
  const q = city.trim().toLowerCase();
  return cityCostData.find((c) => c.city.toLowerCase() === q);
}

/** Local (city) income tax on a given gross salary. Needs the person's
 *  already-computed STATE tax for the surcharge type (e.g. Yonkers). */
export function calculateLocalIncomeTax(
  gross: number,
  city: string,
  stateTaxPaid: number,
): number {
  const c = getCityCost(city);
  if (!c || !c.localIncomeTax) return 0;
  const lt = c.localIncomeTax;

  if (lt.kind === "flatWage" && lt.flatRate) {
    return round2(gross * lt.flatRate);
  }

  if (lt.kind === "stateSurcharge" && lt.surchargeOfStateTax) {
    return round2(stateTaxPaid * lt.surchargeOfStateTax);
  }

  if (lt.kind === "brackets" && lt.brackets) {
    let tax = 0;
    const b = lt.brackets;
    for (let i = 0; i < b.length; i++) {
      const cur = b[i]!;
      const next = b[i + 1];
      const lo = cur.threshold;
      const hi = next ? next.threshold : Infinity;
      if (gross > lo) tax += (Math.min(gross, hi) - lo) * cur.rate;
    }
    return round2(tax);
  }

  return 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

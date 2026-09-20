/**
 * relocationEngine.ts  —  THE "FACTS" LAYER for the relocation feature
 * ------------------------------------------------------------------
 * Pure TypeScript. No network, no AI. Given two locations and a salary
 * for each, it computes the person's REAL monthly surplus in each city
 * (after every tax layer AND cost-of-living), and the break-even salary
 * that makes the move a wash.
 *
 * TAX LAYERS, in order:
 *   gross - federalTax - FICA - stateTax - LOCAL(city)Tax = net income
 */

import { calculateFederalTax } from "./federalTax";
import { calculateFICA } from "./fica";
import { getStateTax } from "./stateTaxData2026";
import { getCityCost, calculateLocalIncomeTax } from "./costOfLivingData";
import type {
  LocationInput,
  PersonInput,
  LocationBreakdown,
  RelocationResult,
} from "./relocation.types";

export type { LocationInput, PersonInput, LocationBreakdown, RelocationResult };

// ---- state income tax from the bracket data we already have ----
function calculateStateTax(gross: number, stateName: string): number {
  const s = getStateTax(stateName);
  if (!s || s.type === "none" || s.brackets.length === 0) return 0;
  const taxable = Math.max(0, gross - s.standardDeduction - s.personalExemption);
  let tax = 0;
  for (let i = 0; i < s.brackets.length; i++) {
    const cur = s.brackets[i]!;
    const next = s.brackets[i + 1];
    const lo = cur.threshold;
    const hi = next ? next.threshold : Infinity;
    if (taxable > lo) tax += (Math.min(taxable, hi) - lo) * cur.rate;
  }
  return round2(tax);
}

function breakdown(
  loc: LocationInput,
  person: PersonInput,
  referenceGoodsIndex: number, // the CURRENT city's goods index, to scale spending
  referenceRent: number, // the CURRENT rent, to estimate offer rent if not given
): LocationBreakdown {
  const cost = getCityCost(loc.city);
  const goodsIndex = cost?.goodsIndex ?? referenceGoodsIndex;
  const rentIndex = cost?.rentIndex ?? 100;

  const federalTax = calculateFederalTax(loc.grossSalary);
  const fica = calculateFICA(loc.grossSalary);
  const stateTax = calculateStateTax(loc.grossSalary, loc.state);
  const localTax = calculateLocalIncomeTax(loc.grossSalary, loc.city, stateTax);

  const netAnnual = round2(loc.grossSalary - federalTax - fica - stateTax - localTax);
  const netMonthly = round2(netAnnual / 12);

  // Non-rent spending scales with the destination's goods index.
  const monthlyNonRent = round2(
    person.monthlySpendingExRent * (goodsIndex / (referenceGoodsIndex || 100)),
  );

  // Rent: use the entered rent, else scale the reference rent by the rent index.
  const monthlyRent = round2(loc.rent ?? referenceRent * (rentIndex / 100));

  const monthlySurplus = round2(netMonthly - monthlyRent - monthlyNonRent);

  return {
    city: loc.city,
    state: loc.state,
    grossSalary: loc.grossSalary,
    federalTax,
    fica,
    stateTax,
    localTax,
    netAnnual,
    netMonthly,
    monthlyRent,
    monthlyNonRent,
    monthlySurplus,
  };
}

export function analyzeRelocation(
  current: LocationInput,
  offer: LocationInput,
  person: PersonInput,
  opts: { movingCostEstimate?: number } = {},
): RelocationResult {
  const currentCost = getCityCost(current.city);
  const currentGoods = currentCost?.goodsIndex ?? 100;
  const currentRent = current.rent ?? 0;

  const currentBD = breakdown(current, person, currentGoods, currentRent);

  // For the offer city, scale spending from the CURRENT goods index and
  // estimate offer rent from the rent-index ratio if not entered.
  const offerCost = getCityCost(offer.city);
  const offerRentEstimate =
    offer.rent ??
    round2(currentRent * ((offerCost?.rentIndex ?? 100) / (currentCost?.rentIndex ?? 100)));

  const offerBD = breakdown(
    { ...offer, rent: offerRentEstimate },
    person,
    currentGoods,
    currentRent,
  );

  const surplusDelta = round2(offerBD.monthlySurplus - currentBD.monthlySurplus);
  const raiseHeadline = round2(offer.grossSalary - current.grossSalary);

  // Break-even: the offer gross that makes offer surplus == current surplus.
  const breakEvenSalary = solveBreakEven(
    { ...offer, rent: offerRentEstimate },
    person,
    currentGoods,
    currentRent,
    currentBD.monthlySurplus,
  );
  const offerClearsBreakEvenBy =
    breakEvenSalary != null ? round2(offer.grossSalary - breakEvenSalary) : null;

  // First-year cost of the move: a mover estimate + a new security deposit.
  const movingCostEstimate = opts.movingCostEstimate ?? 3000;
  const firstYearMoveCost = round2(movingCostEstimate + offerBD.monthlyRent);
  const monthsToRecoup =
    surplusDelta > 0 ? Math.ceil(firstYearMoveCost / surplusDelta) : null;

  let verdict: RelocationResult["verdict"] = "marginal";
  if (surplusDelta > 200) verdict = "clear_win";
  else if (surplusDelta < -100) verdict = "worse";

  return {
    current: currentBD,
    offer: offerBD,
    surplusDelta,
    raiseHeadline,
    breakEvenSalary,
    offerClearsBreakEvenBy,
    firstYearMoveCost,
    monthsToRecoup,
    verdict,
  };
}

/** Binary-search the offer salary whose monthly surplus equals `target`. */
function solveBreakEven(
  offer: LocationInput,
  person: PersonInput,
  referenceGoodsIndex: number,
  referenceRent: number,
  targetSurplus: number,
): number | null {
  let lo = 0;
  let hi = 2_000_000;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const bd = breakdown(
      { ...offer, grossSalary: mid },
      person,
      referenceGoodsIndex,
      referenceRent,
    );
    if (bd.monthlySurplus < targetSurplus) lo = mid;
    else hi = mid;
  }
  const result = round2((lo + hi) / 2);
  return result > 0 && result < 2_000_000 ? result : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Shared relocation types — safe to import from client code. */

export interface LocationInput {
  city: string;
  state: string; // full name, must match stateTaxData2026
  grossSalary: number; // annual
  rent?: number; // monthly; if omitted, estimated from the rent index
}

export interface PersonInput {
  monthlySpendingExRent: number; // groceries/gas/etc, NOT rent
}

export interface LocationBreakdown {
  city: string;
  state: string;
  grossSalary: number;
  federalTax: number;
  fica: number;
  stateTax: number;
  localTax: number;
  netAnnual: number;
  netMonthly: number;
  monthlyRent: number;
  monthlyNonRent: number;
  monthlySurplus: number;
}

export interface RelocationAdvice {
  headline: string;
  reasoning: string;
  recommendation: string;
}

export interface RelocationResult {
  advice?: RelocationAdvice | null;
  current: LocationBreakdown;
  offer: LocationBreakdown;
  surplusDelta: number; // offer.surplus - current.surplus (per month)
  raiseHeadline: number; // offer.gross - current.gross
  breakEvenSalary: number | null; // offer gross needed to match current surplus
  offerClearsBreakEvenBy: number | null; // offer.gross - breakEven
  firstYearMoveCost: number; // one-time cost of moving
  monthsToRecoup: number | null; // how long until the move pays for itself
  verdict: "clear_win" | "marginal" | "worse";
}

export interface RelocationAnalyzeInputs {
  currentCity: string;
  currentState: string;
  currentSalary: number;
  currentRent: number;
  monthlySpendingExRent: number;
  offerCity: string;
  offerState: string;
  offerSalary: number;
  offerRent?: number | undefined;
}

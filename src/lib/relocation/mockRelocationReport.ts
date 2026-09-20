import type { RelocationReportData } from "./relocation.types";

/** Mock payload for the standalone report view — same shape the analyzer returns. */
export const mockRelocationReport: RelocationReportData = {
  current: {
    city: "New York",
    state: "New York",
    grossSalary: 120000,
    federalTax: 19_252.5,
    fica: 9180,
    stateTax: 6_512.4,
    localTax: 3_704.2,
    netAnnual: 81_350.9,
    netMonthly: 6_779.24,
    monthlyRent: 3200,
    monthlyNonRent: 1800,
    monthlySurplus: 1_779.24,
  },
  offer: {
    city: "Austin",
    state: "Texas",
    grossSalary: 125000,
    federalTax: 20_352.5,
    fica: 9562.5,
    stateTax: 0,
    localTax: 0,
    netAnnual: 95_085,
    netMonthly: 7_923.75,
    monthlyRent: 1975,
    monthlyNonRent: 1422,
    monthlySurplus: 4_526.75,
  },
  surplusDelta: 2_747.51,
  raiseHeadline: 5000,
  breakEvenSalary: 88_400,
  offerClearsBreakEvenBy: 36_600,
  firstYearMoveCost: 4975,
  monthsToRecoup: 2,
  verdict: "clear_win",
  advice: {
    headline:
      "Austin clears break-even by $36,600 and hands you $2,748 more every month.",
    reasoning:
      "The headline raise is only $5,000, but Texas charges no state income tax and New York City takes a local income tax on top of the state's, so far less of the gross disappears before it reaches you. Rent and day-to-day costs are also materially lower in Austin, which is where most of the monthly gain actually comes from. Together those effects turn a modest raise into a large change in what you keep.",
    recommendation: "Take it — the offer sits far above your break-even salary.",
  },
};

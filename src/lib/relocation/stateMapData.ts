/**
 * stateMapData.ts — per-state reference figures for the interactive US map.
 *
 * Sources (all figures published, not estimated):
 *  - topMarginalRate / system: top marginal state individual income tax rate,
 *    single filer, 2026 schedules. Nine states levy no individual income tax
 *    (topMarginalRate = null). Source: 2026 state rate tables compiled from
 *    state revenue departments / Tax Foundation, Feb 2026.
 *  - medianHouseholdIncome: U.S. Census Bureau, 2024 American Community Survey
 *    1-year estimates (2024 inflation-adjusted dollars) — latest official release.
 *  - comfortableIncome: pre-tax income a single adult with no children needs to
 *    live comfortably, SmartAsset 2026 study (MIT Living Wage basic needs under a
 *    50/30/20 budget). The 50 states only; not published for D.C.
 *
 * This file is reference/context data for the map. It is NOT used by the
 * relocation calculation — see stateTaxData2026.ts for that.
 */

export interface StateMapDatum {
  abbr: string;
  name: string;
  /** Top marginal state income tax rate in percent, or null where there is no income tax. */
  topMarginalRate: number | null;
  system: "none" | "flat" | "graduated";
  /** Median household income, ACS 2024 1-year estimate. */
  medianHouseholdIncome: number;
  /** Income a single adult needs to live comfortably, SmartAsset 2026. Null where unpublished. */
  comfortableIncome: number | null;
}

export const stateMapData: StateMapDatum[] = [
  { abbr: "AL", name: "Alabama", topMarginalRate: 5, system: "graduated", medianHouseholdIncome: 66659, comfortableIncome: 87610 },
  { abbr: "AK", name: "Alaska", topMarginalRate: null, system: "none", medianHouseholdIncome: 95665, comfortableIncome: 103917 },
  { abbr: "AZ", name: "Arizona", topMarginalRate: 2.5, system: "flat", medianHouseholdIncome: 81486, comfortableIncome: 101795 },
  { abbr: "AR", name: "Arkansas", topMarginalRate: 3.9, system: "graduated", medianHouseholdIncome: 62106, comfortableIncome: 83242 },
  { abbr: "CA", name: "California", topMarginalRate: 13.3, system: "graduated", medianHouseholdIncome: 100149, comfortableIncome: 126797 },
  { abbr: "CO", name: "Colorado", topMarginalRate: 4.4, system: "flat", medianHouseholdIncome: 97113, comfortableIncome: 108160 },
  { abbr: "CT", name: "Connecticut", topMarginalRate: 6.99, system: "graduated", medianHouseholdIncome: 96049, comfortableIncome: 108368 },
  { abbr: "DE", name: "Delaware", topMarginalRate: 6.6, system: "graduated", medianHouseholdIncome: 87534, comfortableIncome: 98966 },
  { abbr: "DC", name: "District of Columbia", topMarginalRate: 10.75, system: "graduated", medianHouseholdIncome: 109707, comfortableIncome: null },
  { abbr: "FL", name: "Florida", topMarginalRate: null, system: "none", medianHouseholdIncome: 77735, comfortableIncome: 100214 },
  { abbr: "GA", name: "Georgia", topMarginalRate: 4.99, system: "flat", medianHouseholdIncome: 79991, comfortableIncome: 100714 },
  { abbr: "HI", name: "Hawaii", topMarginalRate: 11, system: "graduated", medianHouseholdIncome: 100745, comfortableIncome: 129002 },
  { abbr: "ID", name: "Idaho", topMarginalRate: 5.3, system: "flat", medianHouseholdIncome: 81166, comfortableIncome: 98176 },
  { abbr: "IL", name: "Illinois", topMarginalRate: 4.95, system: "flat", medianHouseholdIncome: 83211, comfortableIncome: 101587 },
  { abbr: "IN", name: "Indiana", topMarginalRate: 2.95, system: "flat", medianHouseholdIncome: 71959, comfortableIncome: 90646 },
  { abbr: "IA", name: "Iowa", topMarginalRate: 3.8, system: "flat", medianHouseholdIncome: 75501, comfortableIncome: 88566 },
  { abbr: "KS", name: "Kansas", topMarginalRate: 5.58, system: "graduated", medianHouseholdIncome: 75514, comfortableIncome: 89981 },
  { abbr: "KY", name: "Kentucky", topMarginalRate: 3.5, system: "flat", medianHouseholdIncome: 64526, comfortableIncome: 84074 },
  { abbr: "LA", name: "Louisiana", topMarginalRate: 3, system: "flat", medianHouseholdIncome: 60986, comfortableIncome: 84739 },
  { abbr: "ME", name: "Maine", topMarginalRate: 9.15, system: "graduated", medianHouseholdIncome: 76442, comfortableIncome: 102918 },
  { abbr: "MD", name: "Maryland", topMarginalRate: 6.5, system: "graduated", medianHouseholdIncome: 102905, comfortableIncome: 107910 },
  { abbr: "MA", name: "Massachusetts", topMarginalRate: 9, system: "graduated", medianHouseholdIncome: 104828, comfortableIncome: 127213 },
  { abbr: "MI", name: "Michigan", topMarginalRate: 4.25, system: "flat", medianHouseholdIncome: 72389, comfortableIncome: 91811 },
  { abbr: "MN", name: "Minnesota", topMarginalRate: 9.85, system: "graduated", medianHouseholdIncome: 87117, comfortableIncome: 96970 },
  { abbr: "MS", name: "Mississippi", topMarginalRate: 4, system: "flat", medianHouseholdIncome: 59127, comfortableIncome: 86070 },
  { abbr: "MO", name: "Missouri", topMarginalRate: 4.7, system: "graduated", medianHouseholdIncome: 71589, comfortableIncome: 88483 },
  { abbr: "MT", name: "Montana", topMarginalRate: 5.65, system: "graduated", medianHouseholdIncome: 75340, comfortableIncome: 100797 },
  { abbr: "NE", name: "Nebraska", topMarginalRate: 4.55, system: "graduated", medianHouseholdIncome: 76376, comfortableIncome: 90480 },
  { abbr: "NV", name: "Nevada", topMarginalRate: null, system: "none", medianHouseholdIncome: 81134, comfortableIncome: 100506 },
  { abbr: "NH", name: "New Hampshire", topMarginalRate: null, system: "none", medianHouseholdIncome: 99782, comfortableIncome: 107203 },
  { abbr: "NJ", name: "New Jersey", topMarginalRate: 10.75, system: "graduated", medianHouseholdIncome: 104294, comfortableIncome: 113776 },
  { abbr: "NM", name: "New Mexico", topMarginalRate: 5.9, system: "graduated", medianHouseholdIncome: 67816, comfortableIncome: 91229 },
  { abbr: "NY", name: "New York", topMarginalRate: 10.9, system: "graduated", medianHouseholdIncome: 85820, comfortableIncome: 124342 },
  { abbr: "NC", name: "North Carolina", topMarginalRate: 3.99, system: "flat", medianHouseholdIncome: 73958, comfortableIncome: 93475 },
  { abbr: "ND", name: "North Dakota", topMarginalRate: 2.5, system: "graduated", medianHouseholdIncome: 77871, comfortableIncome: 85738 },
  { abbr: "OH", name: "Ohio", topMarginalRate: 2.75, system: "flat", medianHouseholdIncome: 72212, comfortableIncome: 87360 },
  { abbr: "OK", name: "Oklahoma", topMarginalRate: 4.5, system: "graduated", medianHouseholdIncome: 66148, comfortableIncome: 86237 },
  { abbr: "OR", name: "Oregon", topMarginalRate: 9.9, system: "graduated", medianHouseholdIncome: 85220, comfortableIncome: 110074 },
  { abbr: "PA", name: "Pennsylvania", topMarginalRate: 3.07, system: "flat", medianHouseholdIncome: 77545, comfortableIncome: 97011 },
  { abbr: "RI", name: "Rhode Island", topMarginalRate: 5.99, system: "graduated", medianHouseholdIncome: 83504, comfortableIncome: 104042 },
  { abbr: "SC", name: "South Carolina", topMarginalRate: 5.21, system: "graduated", medianHouseholdIncome: 72350, comfortableIncome: 92934 },
  { abbr: "SD", name: "South Dakota", topMarginalRate: null, system: "none", medianHouseholdIncome: 76881, comfortableIncome: 85405 },
  { abbr: "TN", name: "Tennessee", topMarginalRate: null, system: "none", medianHouseholdIncome: 71997, comfortableIncome: 89898 },
  { abbr: "TX", name: "Texas", topMarginalRate: null, system: "none", medianHouseholdIncome: 79721, comfortableIncome: 90563 },
  { abbr: "UT", name: "Utah", topMarginalRate: 4.5, system: "flat", medianHouseholdIncome: 96658, comfortableIncome: 102794 },
  { abbr: "VT", name: "Vermont", topMarginalRate: 8.75, system: "graduated", medianHouseholdIncome: 82730, comfortableIncome: 103667 },
  { abbr: "VA", name: "Virginia", topMarginalRate: 5.75, system: "graduated", medianHouseholdIncome: 92090, comfortableIncome: 106995 },
  { abbr: "WA", name: "Washington", topMarginalRate: null, system: "none", medianHouseholdIncome: 99389, comfortableIncome: 110614 },
  { abbr: "WV", name: "West Virginia", topMarginalRate: 4.58, system: "graduated", medianHouseholdIncome: 60798, comfortableIncome: 81245 },
  { abbr: "WI", name: "Wisconsin", topMarginalRate: 7.65, system: "graduated", medianHouseholdIncome: 77488, comfortableIncome: 91021 },
  { abbr: "WY", name: "Wyoming", topMarginalRate: null, system: "none", medianHouseholdIncome: 75532, comfortableIncome: 89232 },
];

export const STATE_MAP_BY_NAME: Record<string, StateMapDatum> = Object.fromEntries(
  stateMapData.map((s) => [s.name, s]),
);

export const MAP_SOURCE_NOTE =
  "Tax rates: 2026 state schedules (single filer, top marginal). Median household income: U.S. Census ACS 2024 1-year estimates. Comfortable income: SmartAsset 2026.";

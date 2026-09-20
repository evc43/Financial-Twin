/**
 * cascadeEngine.ts  —  THE "FACTS" LAYER
 * Pure TypeScript. No network, no AI, no React. Same inputs -> same numbers.
 */

export interface PlaidTx {
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface RecurringItem {
  description: string;
  amount: number;
  dayOfMonth: number;
}

export interface ObservedFee {
  description: string;
  amount: number;
  date: string;
  type: "overdraft" | "nsf" | "late" | "other";
}

export interface CashFlowModel {
  income: RecurringItem | null;
  rent: RecurringItem | null;
  otherObligations: RecurringItem[];
  fees: ObservedFee[];
  discretionaryMonthlyAvg: number;
}

export interface CascadeResult {
  detected: boolean;
  feesAlreadyObserved: boolean;
  payDay: number | null;
  rentDay: number | null;
  gapDays: number | null;
  rentLandsBeforePay: boolean;
  observedFeeCount: number;
  observedFeeTotal: number;
  recurringMonthlyFee: number;
  oneOffFeeTotal: number;
  projectionMonths: number;
  projectedFeeCost: number;
  recommendedNewRentDay: number | null;
  daysToShift: number | null;
  projectedSavings: number;
  cascadeChain: { label: string; amount?: number }[];
}

// ---------- Date helpers ----------
function parseDate(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function nextOccurrenceOfDay(from: Date, day: number): Date {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const clampedThis = Math.min(day, daysInMonth(y, m));
  const thisMonth = new Date(Date.UTC(y, m, clampedThis));
  if (daysBetween(from, thisMonth) >= 0) return thisMonth;
  const clampedNext = Math.min(day, daysInMonth(y, m + 1));
  return new Date(Date.UTC(y, m + 1, clampedNext));
}

// ---------- Amount matching ----------
function approx(a: number, target: number, tol = 0.08): boolean {
  if (target === 0) return false;
  return Math.abs(Math.abs(a) - Math.abs(target)) / Math.abs(target) <= tol;
}

function ym(dateStr: string): string {
  return dateStr.slice(0, 7);
}

// ---------- The engine ----------
export function detectCascade(
  model: CashFlowModel,
  txns: PlaidTx[],
  opts: { projectionMonths?: number; bufferDays?: number } = {},
): CascadeResult {
  const projectionMonths = opts.projectionMonths ?? 18;
  const bufferDays = opts.bufferDays ?? 2;

  const empty: CascadeResult = {
    detected: false,
    feesAlreadyObserved: false,
    payDay: model.income?.dayOfMonth ?? null,
    rentDay: model.rent?.dayOfMonth ?? null,
    gapDays: null,
    rentLandsBeforePay: false,
    observedFeeCount: 0,
    observedFeeTotal: 0,
    recurringMonthlyFee: 0,
    oneOffFeeTotal: 0,
    projectionMonths,
    projectedFeeCost: 0,
    recommendedNewRentDay: null,
    daysToShift: null,
    projectedSavings: 0,
    cascadeChain: [],
  };

  if (!model.income || !model.rent) return empty;

  const payDay = model.income.dayOfMonth;
  const rentDay = model.rent.dayOfMonth;

  const rentTxs = txns
    .filter((t) => t.amount > 0 && approx(t.amount, model.rent!.amount))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const latestRent = rentTxs[0];
  if (!latestRent) return empty;

  const rentDate = parseDate(latestRent.date);
  const nextPay = nextOccurrenceOfDay(rentDate, payDay);
  const gapDays = daysBetween(rentDate, nextPay);
  const rentLandsBeforePay = gapDays > 0 && gapDays <= 7;

  const fees = model.fees ?? [];
  const observedFeeCount = fees.length;
  const observedFeeTotal = round2(fees.reduce((s, f) => s + f.amount, 0));

  const byType = new Map<string, { months: Set<string>; amounts: number[] }>();
  for (const f of fees) {
    const key = f.type;
    if (!byType.has(key)) byType.set(key, { months: new Set(), amounts: [] });
    const rec = byType.get(key)!;
    rec.months.add(ym(f.date));
    rec.amounts.push(f.amount);
  }

  let recurringMonthlyFee = 0;
  let oneOffFeeTotal = 0;
  for (const [, rec] of byType) {
    if (rec.months.size >= 2) {
      // Appears in 2+ distinct months — a genuinely recurring monthly fee.
      recurringMonthlyFee += median(rec.amounts);
    } else {
      // Single month only — a one-time cost, never projected forward.
      oneOffFeeTotal += rec.amounts.reduce((s, a) => s + a, 0);
    }
  }
  recurringMonthlyFee = round2(recurringMonthlyFee);
  oneOffFeeTotal = round2(oneOffFeeTotal);

  const feesAlreadyObserved = observedFeeCount > 0;
  const detected = rentLandsBeforePay && recurringMonthlyFee > 0;
  const projectedFeeCost = round2(recurringMonthlyFee * projectionMonths);

  const recommendedNewRentDay = clampDay(payDay + bufferDays);
  const daysToShift = gapDays + bufferDays;
  const projectedSavings = projectedFeeCost;

  const cascadeChain = detected
    ? [
        { label: `Rent drafts ${gapDays}d before payday`, amount: model.rent.amount },
        { label: "Checking dips below $0" },
        { label: "Overdraft fee", amount: recurringMonthlyFee },
        ...(oneOffFeeTotal > 0
          ? [{ label: "One-time knock-on fee", amount: oneOffFeeTotal }]
          : []),
        { label: `${projectionMonths}-month impact`, amount: projectedFeeCost },
      ]
    : [];

  return {
    detected,
    feesAlreadyObserved,
    payDay,
    rentDay,
    gapDays,
    rentLandsBeforePay,
    observedFeeCount,
    observedFeeTotal,
    recurringMonthlyFee,
    oneOffFeeTotal,
    projectionMonths,
    projectedFeeCost,
    recommendedNewRentDay,
    daysToShift,
    projectedSavings,
    cascadeChain,
  };
}

// ---------- small utils ----------
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clampDay(d: number): number {
  return ((d - 1) % 28) + 1;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}
